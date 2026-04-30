
-- ============ ORGANIZATIONS ============
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'conexao',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============ ORGANIZATION_MEMBERS ============
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('owner','admin','agent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- ============ HELPER FUNCTIONS (criar antes das policies) ============
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- ============ POLICIES: organizations ============
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization" ON public.organizations
  FOR SELECT USING (public.is_org_member(auth.uid(), id));

DROP POLICY IF EXISTS "Owners and admins can update org" ON public.organizations;
CREATE POLICY "Owners and admins can update org" ON public.organizations
  FOR UPDATE USING (public.has_org_role(auth.uid(), id, ARRAY['owner','admin']));

-- ============ POLICIES: organization_members ============
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.organization_members;
CREATE POLICY "Owners and admins can manage members" ON public.organization_members
  FOR ALL USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']))
  WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']));

-- ============ PLAN QUOTAS ============
CREATE TABLE IF NOT EXISTS public.plan_quotas (
  plan text PRIMARY KEY,
  max_instances integer NOT NULL DEFAULT 1,
  max_conversations_per_month integer NOT NULL DEFAULT 1000,
  max_members integer NOT NULL DEFAULT 1,
  price_brl numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view plan quotas" ON public.plan_quotas;
CREATE POLICY "Anyone authenticated can view plan quotas" ON public.plan_quotas
  FOR SELECT USING (auth.uid() IS NOT NULL);

INSERT INTO public.plan_quotas (plan, max_instances, max_conversations_per_month, max_members, price_brl) VALUES
  ('conexao',    1,  1000,   1, 49.00),
  ('equipe',     3,  5000,   5, 149.00),
  ('escala',    10, 20000,  20, 399.00),
  ('enterprise',999,999999, 999, 999.00)
ON CONFLICT (plan) DO NOTHING;

-- ============ SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'conexao',
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','overdue','suspended','cancelled')),
  asaas_customer_id text,
  asaas_subscription_id text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_due_date timestamptz,
  amount numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view org subscription" ON public.subscriptions;
CREATE POLICY "Members can view org subscription" ON public.subscriptions
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Owners can manage subscription" ON public.subscriptions;
CREATE POLICY "Owners can manage subscription" ON public.subscriptions
  FOR ALL USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']))
  WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']));

-- ============ USAGE METRICS ============
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  messages_count integer NOT NULL DEFAULT 0,
  conversations_count integer NOT NULL DEFAULT 0,
  ai_calls_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_year, period_month)
);
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view usage" ON public.usage_metrics;
CREATE POLICY "Members can view usage" ON public.usage_metrics
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON public.audit_logs(organization_id, created_at DESC);

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']));

-- ============ BILLING EVENTS ============
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  asaas_payment_id text,
  amount numeric(10,2),
  status text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view billing events" ON public.billing_events;
CREATE POLICY "Owners can view billing events" ON public.billing_events
  FOR SELECT USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']));

-- ============ QUOTA ALERTS ============
CREATE TABLE IF NOT EXISTS public.quota_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  metric text NOT NULL,
  threshold_pct integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_year, period_month, metric, threshold_pct)
);
ALTER TABLE public.quota_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view quota alerts" ON public.quota_alerts;
CREATE POLICY "Admins can view quota alerts" ON public.quota_alerts
  FOR SELECT USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner','admin']));

-- ============ PROFILES / INSTANCES: organization_id ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ============ OPERATIONAL FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.increment_usage_metric(
  p_organization_id uuid,
  p_metric text,
  p_increment integer DEFAULT 1
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year int := EXTRACT(YEAR FROM now())::int;
  v_month int := EXTRACT(MONTH FROM now())::int;
BEGIN
  INSERT INTO public.usage_metrics (organization_id, period_year, period_month, messages_count, conversations_count, ai_calls_count)
  VALUES (
    p_organization_id, v_year, v_month,
    CASE WHEN p_metric = 'messages_count' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric = 'conversations_count' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric = 'ai_calls_count' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (organization_id, period_year, period_month) DO UPDATE SET
    messages_count      = public.usage_metrics.messages_count      + EXCLUDED.messages_count,
    conversations_count = public.usage_metrics.conversations_count + EXCLUDED.conversations_count,
    ai_calls_count      = public.usage_metrics.ai_calls_count      + EXCLUDED.ai_calls_count,
    updated_at = now();
END; $$;

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_organization_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.get_orgs_near_quota(p_year int, p_month int)
RETURNS TABLE (
  organization_id uuid,
  metric text,
  threshold_pct int,
  current_value bigint,
  quota_limit bigint,
  plan text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH usage AS (
    SELECT um.organization_id, o.plan, pq.max_conversations_per_month::bigint AS quota,
           um.messages_count::bigint AS current
    FROM public.usage_metrics um
    JOIN public.organizations o ON o.id = um.organization_id
    JOIN public.plan_quotas pq ON pq.plan = o.plan
    WHERE um.period_year = p_year AND um.period_month = p_month
  ),
  flagged AS (
    SELECT u.organization_id, 'messages_count'::text AS metric,
           CASE WHEN u.current >= u.quota THEN 100
                WHEN u.current >= (u.quota * 0.8) THEN 80 END AS threshold_pct,
           u.current AS current_value, u.quota AS quota_limit, u.plan
    FROM usage u
    WHERE u.quota > 0 AND u.current >= (u.quota * 0.8)
  )
  SELECT f.organization_id, f.metric, f.threshold_pct, f.current_value, f.quota_limit, f.plan
  FROM flagged f
  WHERE NOT EXISTS (
    SELECT 1 FROM public.quota_alerts qa
    WHERE qa.organization_id = f.organization_id
      AND qa.period_year = p_year AND qa.period_month = p_month
      AND qa.metric = f.metric AND qa.threshold_pct = f.threshold_pct
  );
$$;

-- ============ SEED: organização padrão + vínculo de dados existentes ============
DO $$
DECLARE
  v_org_id uuid;
  v_first_admin uuid;
BEGIN
  -- Pega/cria organização padrão
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'nandidev' LIMIT 1;
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, plan, status)
    VALUES ('NandiDev', 'nandidev', 'enterprise', 'active')
    RETURNING id INTO v_org_id;
  END IF;

  -- Vincular profiles sem org
  UPDATE public.profiles SET organization_id = v_org_id WHERE organization_id IS NULL;

  -- Vincular instâncias sem org
  UPDATE public.whatsapp_instances SET organization_id = v_org_id WHERE organization_id IS NULL;

  -- Adicionar membros: admins viram owner, demais agent
  INSERT INTO public.organization_members (organization_id, user_id, role)
  SELECT v_org_id, p.id,
         CASE WHEN public.has_role(p.id, 'admin'::app_role) THEN 'owner'
              WHEN public.has_role(p.id, 'supervisor'::app_role) THEN 'admin'
              ELSE 'agent' END
  FROM public.profiles p
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Cria assinatura trial caso não exista
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_ends_at)
  VALUES (v_org_id, 'enterprise', 'active', now() + interval '30 days')
  ON CONFLICT (organization_id) DO NOTHING;
END $$;
