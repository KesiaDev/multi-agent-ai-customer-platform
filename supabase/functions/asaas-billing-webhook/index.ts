import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Asaas sends its webhook token in the asaas-access-token header
  const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? '';
  const providedToken = req.headers.get('asaas-access-token') ?? '';

  if (webhookToken && providedToken !== webhookToken) {
    console.error('[asaas-webhook] ❌ Invalid webhook token');
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { event, payment } = body;
  console.log('[asaas-webhook] Event:', event, 'Payment:', payment?.id);

  // Resolve subscription from Asaas subscription ID attached to the payment
  const asaasSubId = payment?.subscription;
  if (!asaasSubId) {
    // Some events (e.g. PAYMENT_CREATED without subscription) are safe to ignore
    console.log('[asaas-webhook] No subscription ID — ignoring event:', event);
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, organization_id, plan')
    .eq('asaas_subscription_id', asaasSubId)
    .maybeSingle();

  if (!sub) {
    console.warn('[asaas-webhook] Unknown Asaas subscription:', asaasSubId);
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();

  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    const dueDate = payment?.dueDate ? new Date(payment.dueDate) : new Date();
    const periodEnd = new Date(dueDate);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from('subscriptions').update({
      status:               'active',
      current_period_start: dueDate.toISOString(),
      current_period_end:   periodEnd.toISOString(),
      next_due_date:        periodEnd.toISOString().split('T')[0],
      amount:               payment?.value ?? null,
      updated_at:           now,
    }).eq('id', sub.id);

    // Ensure the org is in active state
    await supabase.from('organizations').update({ status: 'active' }).eq('id', sub.organization_id);

    console.log('[asaas-webhook] ✅ Subscription activated:', sub.id);

  } else if (event === 'PAYMENT_OVERDUE') {
    await supabase.from('subscriptions')
      .update({ status: 'overdue', updated_at: now })
      .eq('id', sub.id);

    console.log('[asaas-webhook] ⚠️ Subscription overdue:', sub.id);

  } else if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_EXPIRED') {
    await supabase.from('subscriptions')
      .update({ status: 'cancelled', updated_at: now })
      .eq('id', sub.id);

    await supabase.from('organizations')
      .update({ status: 'suspended' })
      .eq('id', sub.organization_id);

    console.log('[asaas-webhook] ❌ Subscription cancelled:', sub.id);
  }

  // Append-only billing event log
  await supabase.from('billing_events').insert({
    organization_id: sub.organization_id,
    subscription_id: sub.id,
    asaas_event_id:  payment?.id ?? null,
    event_type:      event,
    amount:          payment?.value ?? null,
    due_date:        payment?.dueDate ?? null,
    payment_date:    payment?.paymentDate ?? null,
    raw_payload:     body,
  });

  // Audit trail
  supabase.rpc('write_audit_log', {
    p_organization_id: sub.organization_id,
    p_user_id:         null,
    p_action:          `billing.${event.toLowerCase()}`,
    p_resource_type:   'subscription',
    p_resource_id:     sub.id,
    p_metadata:        { event, amount: payment?.value, plan: sub.plan },
  }).catch((err: Error) => console.error('[asaas-webhook] Audit error:', err));

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
