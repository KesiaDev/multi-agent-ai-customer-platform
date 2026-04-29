import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// This function is called daily by Supabase cron (pg_cron or Edge Function schedules).
// It scans usage_metrics for orgs near or at their plan quota and sends alerts.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_NAMES: Record<string, string> = {
  conexao:    'Conexão',
  equipe:     'Equipe',
  escala:     'Escala',
  enterprise: 'Enterprise',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Can be called by cron (no auth) or manually by an admin (with auth)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const now = new Date();
  const year  = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  console.log(`[check-quotas] Checking quotas for ${year}-${String(month).padStart(2, '0')}`);

  // Get all orgs that have crossed an alert threshold this period
  const { data: alerts, error } = await supabase.rpc('get_orgs_near_quota', {
    p_year:  year,
    p_month: month,
  });

  if (error) {
    console.error('[check-quotas] Error fetching quota data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[check-quotas] Found ${alerts?.length ?? 0} orgs needing alerts`);

  let alertsSent = 0;

  for (const alert of (alerts ?? [])) {
    const { organization_id, metric, threshold_pct, current_value, quota_limit, plan } = alert;
    const usagePct = Math.round((Number(current_value) / Number(quota_limit)) * 100);
    const planName = PLAN_NAMES[plan] ?? plan;

    console.log(`[check-quotas] Org ${organization_id}: ${usagePct}% of ${metric} (threshold: ${threshold_pct}%)`);

    // Fetch owner emails for this org
    const { data: owners } = await supabase
      .from('organization_members')
      .select('user_id, profiles(email, full_name)')
      .eq('organization_id', organization_id)
      .in('role', ['owner', 'admin']);

    const ownerEmails = (owners ?? [])
      .map((o: any) => o.profiles?.email)
      .filter(Boolean);

    if (ownerEmails.length === 0) {
      console.warn(`[check-quotas] No owner emails for org ${organization_id}`);
      continue;
    }

    const isAtLimit = threshold_pct === 100;
    const subject = isAtLimit
      ? `🚨 Limite atingido — Plano ${planName}`
      : `⚠️ Aviso de uso — 80% do limite do Plano ${planName}`;

    const metricLabel = metric === 'messages_count' ? 'mensagens/conversas' : metric;

    const body = isAtLimit
      ? `Sua organização atingiu 100% do limite de ${metricLabel} do Plano ${planName} este mês (${current_value}/${quota_limit}). Novas mensagens podem ser bloqueadas. Faça upgrade para continuar operando sem interrupção.`
      : `Sua organização usou ${usagePct}% do limite de ${metricLabel} do Plano ${planName} este mês (${current_value}/${quota_limit}). Considere fazer upgrade antes de atingir o limite.`;

    // Send notification via Supabase built-in email (if configured)
    // Falls back to just writing the audit log + quota_alert record
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    for (const email of ownerEmails) {
      try {
        // Fire-and-forget email via any configured email provider
        await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: email, subject, body }),
        }).catch(() => {}); // Optional: gracefully ignore if email fn doesn't exist
      } catch {
        // Email function is optional
      }
    }

    // Mark alert as sent to prevent duplicates
    await supabase.from('quota_alerts').upsert({
      organization_id,
      period_year:   year,
      period_month:  month,
      metric,
      threshold_pct,
    }, { onConflict: 'organization_id,period_year,period_month,metric,threshold_pct', ignoreDuplicates: true });

    // Audit log
    supabase.rpc('write_audit_log', {
      p_organization_id: organization_id,
      p_user_id:         null,
      p_action:          `quota.alert_${threshold_pct}pct`,
      p_resource_type:   'usage_metrics',
      p_resource_id:     `${year}-${month}`,
      p_metadata:        { metric, current_value, quota_limit, threshold_pct, plan },
    }).catch(console.error);

    alertsSent++;
  }

  console.log(`[check-quotas] ✅ Sent ${alertsSent} alert(s)`);

  return new Response(JSON.stringify({ success: true, alertsSent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
