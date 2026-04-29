-- ============================================================
-- GAP-03: Recurring billing via Asaas
-- ============================================================

-- ── Plan quotas reference table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_quotas (
  plan                        TEXT           PRIMARY KEY,
  max_instances               INT            NOT NULL,
  max_conversations_per_month BIGINT         NOT NULL,
  max_members                 INT            NOT NULL,
  price_brl                   NUMERIC(10,2)  NOT NULL
);

INSERT INTO public.plan_quotas (plan, max_instances, max_conversations_per_month, max_members, price_brl)
VALUES
  ('conexao',    1,       1000,    3,  197.00),
  ('equipe',     5,       5000,   10,  497.00),
  ('escala',    20,      20000,   30,  997.00),
  ('enterprise', 999, 9999999,  999,    0.00)
ON CONFLICT (plan) DO NOTHING;

ALTER TABLE public.plan_quotas ENABLE ROW LEVEL SECURITY;

-- Plan pricing is public information
CREATE POLICY "plan_quotas_public_read" ON public.plan_quotas
  FOR SELECT USING (true);

-- ── Subscriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID          NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  asaas_subscription_id  TEXT          UNIQUE,
  asaas_customer_id      TEXT,
  plan                   TEXT          NOT NULL DEFAULT 'conexao' REFERENCES public.plan_quotas(plan),
  status                 TEXT          NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'overdue', 'suspended', 'cancelled')),
  trial_ends_at          TIMESTAMPTZ,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  next_due_date          DATE,
  amount                 NUMERIC(10,2),
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org
  ON public.subscriptions (organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas
  ON public.subscriptions (asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Org members can read their own subscription
CREATE POLICY "subscriptions_read" ON public.subscriptions
  FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Service role full access (webhook + admin ops)
CREATE POLICY "subscriptions_service_role" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Billing events (Asaas webhook log) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id  UUID          REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  asaas_event_id   TEXT,
  event_type       TEXT          NOT NULL,
  amount           NUMERIC(10,2),
  due_date         DATE,
  payment_date     DATE,
  raw_payload      JSONB,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_org
  ON public.billing_events (organization_id, created_at DESC);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Org owners and admins can read billing events
CREATE POLICY "billing_events_read" ON public.billing_events
  FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id         = auth.uid()
        AND om.organization_id = public.get_user_organization_id()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "billing_events_service_role" ON public.billing_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Seed trial subscription for NandiDev org ─────────────────────────────────
INSERT INTO public.subscriptions (organization_id, plan, status, trial_ends_at, amount)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'escala',
  'trial',
  NOW() + INTERVAL '30 days',
  997.00
)
ON CONFLICT (organization_id) DO NOTHING;
