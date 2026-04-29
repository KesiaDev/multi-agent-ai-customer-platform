-- ============================================================
-- GAP-10: Quota alerts — notify org owners when limits are near
-- ============================================================

-- Track which alert thresholds have been sent (prevents duplicate alerts)
CREATE TABLE IF NOT EXISTS public.quota_alerts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_year      INT         NOT NULL,
  period_month     INT         NOT NULL,
  metric           TEXT        NOT NULL,   -- 'messages_count', 'conversations_count'
  threshold_pct    INT         NOT NULL,   -- 80 or 100
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, period_year, period_month, metric, threshold_pct)
);

ALTER TABLE public.quota_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quota_alerts_read" ON public.quota_alerts
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

CREATE POLICY "quota_alerts_service_role" ON public.quota_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function called by the check-quotas edge function
-- Returns orgs that have crossed 80% or 100% of their plan limit and
-- haven't had an alert sent yet for that threshold this period.
CREATE OR REPLACE FUNCTION public.get_orgs_near_quota(
  p_year  INT,
  p_month INT
) RETURNS TABLE (
  organization_id  UUID,
  metric           TEXT,
  threshold_pct    INT,
  current_value    BIGINT,
  quota_limit      BIGINT,
  plan             TEXT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    um.organization_id,
    'messages_count'                                    AS metric,
    CASE
      WHEN um.messages_count >= pq.max_conversations_per_month THEN 100
      WHEN um.messages_count >= pq.max_conversations_per_month * 0.8 THEN 80
    END                                                 AS threshold_pct,
    um.messages_count                                   AS current_value,
    pq.max_conversations_per_month                      AS quota_limit,
    o.plan
  FROM public.usage_metrics um
  JOIN public.organizations o           ON o.id = um.organization_id
  JOIN public.plan_quotas   pq          ON pq.plan = o.plan
  LEFT JOIN public.subscriptions s      ON s.organization_id = um.organization_id
  WHERE um.period_year  = p_year
    AND um.period_month = p_month
    -- Only check active or trial orgs
    AND COALESCE(s.status, 'trial') IN ('active', 'trial')
    -- At least 80% consumed
    AND um.messages_count >= pq.max_conversations_per_month * 0.8
    -- Alert not already sent for this threshold this period
    AND NOT EXISTS (
      SELECT 1 FROM public.quota_alerts qa
      WHERE qa.organization_id = um.organization_id
        AND qa.period_year     = p_year
        AND qa.period_month    = p_month
        AND qa.metric          = 'messages_count'
        AND qa.threshold_pct   = CASE
          WHEN um.messages_count >= pq.max_conversations_per_month THEN 100
          WHEN um.messages_count >= pq.max_conversations_per_month * 0.8 THEN 80
        END
    );
$$;
