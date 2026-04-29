import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = Deno.env.get('ASAAS_SANDBOX') === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3';

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? '';

const PLAN_AMOUNTS: Record<string, number> = {
  conexao: 197.00,
  equipe:  497.00,
  escala:  997.00,
};

async function asaasRequest(method: 'GET' | 'POST', path: string, body?: any) {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    method,
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only org owners can manage subscriptions
    const { data: callerMembership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (!callerMembership || callerMembership.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only org owners can manage subscriptions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = callerMembership.organization_id;

    // Guard: don't create duplicate active subscriptions
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (existingSub?.status === 'active') {
      return new Response(JSON.stringify({ error: 'Organization already has an active subscription' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ASAAS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Asaas API not configured — set ASAAS_API_KEY secret' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan, cpfCnpj, name, email, phone, postalCode } = await req.json();

    if (!PLAN_AMOUNTS[plan]) {
      return new Response(JSON.stringify({ error: `Invalid plan: ${plan}. Valid: ${Object.keys(PLAN_AMOUNTS).join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create customer in Asaas
    const customer = await asaasRequest('POST', '/customers', {
      name,
      email,
      mobilePhone:       phone ?? undefined,
      cpfCnpj:           cpfCnpj ?? undefined,
      postalCode:        postalCode ?? undefined,
      externalReference: orgId,
    });

    console.log('[create-subscription] Customer:', customer.id);

    // Next billing date = one day from now (Asaas requires a future date)
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);
    const nextDueStr = nextDue.toISOString().split('T')[0];

    // Create subscription in Asaas
    const subscription = await asaasRequest('POST', '/subscriptions', {
      customer:          customer.id,
      billingType:       'BOLETO',
      value:             PLAN_AMOUNTS[plan],
      nextDueDate:       nextDueStr,
      cycle:             'MONTHLY',
      description:       `NandiFlow — Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      externalReference: orgId,
    });

    console.log('[create-subscription] Subscription:', subscription.id);

    const now = new Date().toISOString();

    // Upsert subscription record
    await supabaseAdmin.from('subscriptions').upsert({
      organization_id:       orgId,
      asaas_subscription_id: subscription.id,
      asaas_customer_id:     customer.id,
      plan,
      status:                'active',
      amount:                PLAN_AMOUNTS[plan],
      next_due_date:         nextDueStr,
      current_period_start:  now,
      updated_at:            now,
    }, { onConflict: 'organization_id', ignoreDuplicates: false });

    // Update org plan slug
    await supabaseAdmin.from('organizations')
      .update({ plan, status: 'active' })
      .eq('id', orgId);

    // Audit log
    supabaseAdmin.rpc('write_audit_log', {
      p_organization_id: orgId,
      p_user_id:         caller.id,
      p_action:          'billing.subscribe',
      p_resource_type:   'subscription',
      p_resource_id:     subscription.id,
      p_metadata:        { plan, amount: PLAN_AMOUNTS[plan] },
      p_ip_address:      req.headers.get('x-forwarded-for') ?? null,
    }).catch((err: Error) => console.error('[create-subscription] Audit error:', err));

    return new Response(JSON.stringify({
      success:        true,
      subscriptionId: subscription.id,
      plan,
      amount:         PLAN_AMOUNTS[plan],
      nextDueDate:    nextDueStr,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[create-subscription] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
