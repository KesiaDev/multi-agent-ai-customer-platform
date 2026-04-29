-- ============================================================
-- GAP-05 (partial): Usage metrics — per-org message quota counters
-- GAP-06: Webhook security — per-instance HMAC tokens
-- ============================================================

-- ── GAP-06: Per-instance webhook secrets ─────────────────────────────────────

ALTER TABLE public.whatsapp_instance_secrets
  ADD COLUMN IF NOT EXISTS webhook_secret           TEXT,
  ADD COLUMN IF NOT EXISTS webhook_security_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Auto-generate unique secrets for every existing instance.
-- Security starts disabled so existing webhook configs keep working.
UPDATE public.whatsapp_instance_secrets
  SET webhook_secret = gen_random_uuid()::text
  WHERE webhook_secret IS NULL;

ALTER TABLE public.whatsapp_instance_secrets
  ALTER COLUMN webhook_secret SET NOT NULL;

-- ── GAP-05: Usage metrics table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_year         INT         NOT NULL CHECK (period_year >= 2024),
  period_month        INT         NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  messages_count      BIGINT      NOT NULL DEFAULT 0,
  conversations_count BIGINT      NOT NULL DEFAULT 0,
  ai_calls_count      BIGINT      NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_period
  ON public.usage_metrics (organization_id, period_year, period_month);

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- Org members can read their own metrics
CREATE POLICY "usage_metrics_read" ON public.usage_metrics
  FOR SELECT
  USING (organization_id = public.get_user_organization_id());

-- Service role can upsert (edge functions run with service role key)
CREATE POLICY "usage_metrics_service_role" ON public.usage_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Atomic counter increment — safely handles concurrent webhook events
CREATE OR REPLACE FUNCTION public.increment_usage_metric(
  p_organization_id UUID,
  p_year            INT,
  p_month           INT,
  p_field           TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_field = 'messages_count' THEN
    INSERT INTO public.usage_metrics (organization_id, period_year, period_month, messages_count)
    VALUES (p_organization_id, p_year, p_month, 1)
    ON CONFLICT (organization_id, period_year, period_month)
    DO UPDATE SET
      messages_count = public.usage_metrics.messages_count + 1,
      updated_at     = NOW();

  ELSIF p_field = 'conversations_count' THEN
    INSERT INTO public.usage_metrics (organization_id, period_year, period_month, conversations_count)
    VALUES (p_organization_id, p_year, p_month, 1)
    ON CONFLICT (organization_id, period_year, period_month)
    DO UPDATE SET
      conversations_count = public.usage_metrics.conversations_count + 1,
      updated_at          = NOW();

  ELSIF p_field = 'ai_calls_count' THEN
    INSERT INTO public.usage_metrics (organization_id, period_year, period_month, ai_calls_count)
    VALUES (p_organization_id, p_year, p_month, 1)
    ON CONFLICT (organization_id, period_year, period_month)
    DO UPDATE SET
      ai_calls_count = public.usage_metrics.ai_calls_count + 1,
      updated_at     = NOW();
  END IF;
END;
$$;
