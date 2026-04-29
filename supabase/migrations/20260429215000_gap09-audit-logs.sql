-- ============================================================
-- GAP-09: Audit logs — per-org immutable event trail
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL,   -- e.g. 'member.invite', 'role.update', 'instance.delete'
  resource_type   TEXT        NOT NULL,   -- e.g. 'profile', 'whatsapp_instance', 'user_role'
  resource_id     TEXT,                   -- UUID or external ID of the affected resource
  metadata        JSONB,                  -- Structured context: {old_value, new_value, email, ...}
  ip_address      TEXT,                   -- Caller IP when available
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs are append-only — never updated, only inserted
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON public.audit_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs (organization_id, action, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Org owners and admins can read logs; agents cannot
CREATE POLICY "audit_logs_read_admins" ON public.audit_logs
  FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id         = auth.uid()
        AND om.organization_id = public.get_user_organization_id()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Service role can insert (edge functions write audit entries)
CREATE POLICY "audit_logs_insert_service_role" ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Helper: insert an audit log row (called from edge functions via supabase.rpc)
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_organization_id UUID,
  p_user_id         UUID,
  p_action          TEXT,
  p_resource_type   TEXT,
  p_resource_id     TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL,
  p_ip_address      TEXT    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs
    (organization_id, user_id, action, resource_type, resource_id, metadata, ip_address)
  VALUES
    (p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id, p_metadata, p_ip_address)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- DB-level trigger: auto-log role changes in user_roles
CREATE OR REPLACE FUNCTION public.audit_user_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Resolve org from organization_members
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
    VALUES (v_org_id, auth.uid(), 'role.assign', 'user_role', NEW.user_id::text,
            jsonb_build_object('role', NEW.role));
  ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
    VALUES (v_org_id, auth.uid(), 'role.update', 'user_role', NEW.user_id::text,
            jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_role ON public.user_roles;
CREATE TRIGGER trg_audit_user_role
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_role_change();

-- DB-level trigger: auto-log whatsapp_instances create/delete
CREATE OR REPLACE FUNCTION public.audit_instance_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
    VALUES (NEW.organization_id, auth.uid(), 'instance.create', 'whatsapp_instance', NEW.id::text,
            jsonb_build_object('instance_name', NEW.instance_name));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
    VALUES (OLD.organization_id, auth.uid(), 'instance.delete', 'whatsapp_instance', OLD.id::text,
            jsonb_build_object('instance_name', OLD.instance_name));
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_instance ON public.whatsapp_instances;
CREATE TRIGGER trg_audit_instance
  AFTER INSERT OR DELETE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.audit_instance_change();
