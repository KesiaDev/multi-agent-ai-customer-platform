-- ============================================================
-- GAP-01 + GAP-02: Multi-tenancy Foundation
-- Creates organizations, organization_members, org-aware RLS
-- ============================================================

-- 1. organizations table
CREATE TABLE public.organizations (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(255) NOT NULL UNIQUE,
  plan       VARCHAR(50)  NOT NULL DEFAULT 'conexao',
  status     VARCHAR(50)  NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. organization_members
CREATE TABLE public.organization_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id)           ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL DEFAULT 'agent',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Seed organization for existing data
INSERT INTO public.organizations (id, name, slug, plan, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'NandiDev', 'nandidev', 'escala', 'active');

-- 4. Add organization_id to whatsapp_instances
ALTER TABLE public.whatsapp_instances
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.whatsapp_instances
  SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.whatsapp_instances
  ALTER COLUMN organization_id SET NOT NULL;

-- 5. Helper function: current user organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id
  FROM   public.organization_members
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;

-- ============================================================
-- 6. Replace ALL existing RLS policies with org-aware versions
-- ============================================================

-- whatsapp_instances
DROP POLICY IF EXISTS "Allow all operations on instances"       ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Authenticated users can view instances"  ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Only admins can manage instances"        ON public.whatsapp_instances;

CREATE POLICY "instances_org_isolation" ON public.whatsapp_instances
  FOR ALL
  USING      (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());

-- whatsapp_instance_secrets
DROP POLICY IF EXISTS "Only admins can manage secrets" ON public.whatsapp_instance_secrets;

CREATE POLICY "secrets_org_isolation" ON public.whatsapp_instance_secrets
  FOR ALL
  USING (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_contacts
DROP POLICY IF EXISTS "Allow all operations on contacts"      ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Supervisors can manage contacts"       ON public.whatsapp_contacts;

CREATE POLICY "contacts_org_isolation" ON public.whatsapp_contacts
  FOR ALL
  USING (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_conversations
DROP POLICY IF EXISTS "Allow all operations on conversations"      ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can view accessible conversations"    ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Service can insert conversations"           ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can update accessible conversations"  ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Only admins can delete conversations"       ON public.whatsapp_conversations;

CREATE POLICY "conversations_org_isolation" ON public.whatsapp_conversations
  FOR ALL
  USING (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_messages
DROP POLICY IF EXISTS "Allow all operations on messages"                        ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can view messages of accessible conversations"     ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible conversations"   ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can update own recent messages"                    ON public.whatsapp_messages;

CREATE POLICY "messages_org_isolation" ON public.whatsapp_messages
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_sentiment_analysis
DROP POLICY IF EXISTS "Allow all operations on sentiment"                    ON public.whatsapp_sentiment_analysis;
DROP POLICY IF EXISTS "Users can view sentiment of accessible conversations" ON public.whatsapp_sentiment_analysis;
DROP POLICY IF EXISTS "Service can manage sentiment"                         ON public.whatsapp_sentiment_analysis;

CREATE POLICY "sentiment_org_isolation" ON public.whatsapp_sentiment_analysis
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_sentiment_history
DROP POLICY IF EXISTS "Allow all operations on sentiment history"                    ON public.whatsapp_sentiment_history;
DROP POLICY IF EXISTS "Users can view sentiment history of accessible conversations" ON public.whatsapp_sentiment_history;

CREATE POLICY "sentiment_history_org_isolation" ON public.whatsapp_sentiment_history
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_conversation_summaries
DROP POLICY IF EXISTS "Allow all operations on summaries"                    ON public.whatsapp_conversation_summaries;
DROP POLICY IF EXISTS "Users can view summaries of accessible conversations" ON public.whatsapp_conversation_summaries;
DROP POLICY IF EXISTS "Service can manage summaries"                         ON public.whatsapp_conversation_summaries;

CREATE POLICY "summaries_org_isolation" ON public.whatsapp_conversation_summaries
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_conversation_notes
DROP POLICY IF EXISTS "Allow all operations on notes"                         ON public.whatsapp_conversation_notes;
DROP POLICY IF EXISTS "Users can manage notes on accessible conversations"    ON public.whatsapp_conversation_notes;

CREATE POLICY "notes_org_isolation" ON public.whatsapp_conversation_notes
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_macros
DROP POLICY IF EXISTS "Allow all operations on macros"      ON public.whatsapp_macros;
DROP POLICY IF EXISTS "Authenticated users can view macros" ON public.whatsapp_macros;
DROP POLICY IF EXISTS "Supervisors can manage macros"       ON public.whatsapp_macros;

CREATE POLICY "macros_org_isolation" ON public.whatsapp_macros
  FOR ALL
  USING (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_reactions
DROP POLICY IF EXISTS "Allow all operations on reactions"                    ON public.whatsapp_reactions;
DROP POLICY IF EXISTS "Users can view reactions on accessible conversations" ON public.whatsapp_reactions;
DROP POLICY IF EXISTS "Users can add reactions on accessible conversations"  ON public.whatsapp_reactions;

CREATE POLICY "reactions_org_isolation" ON public.whatsapp_reactions
  FOR ALL
  USING (
    message_id IN (
      SELECT m.id FROM public.whatsapp_messages m
      JOIN   public.whatsapp_conversations c ON m.conversation_id = c.id
      JOIN   public.whatsapp_instances i     ON c.instance_id     = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT m.id FROM public.whatsapp_messages m
      JOIN   public.whatsapp_conversations c ON m.conversation_id = c.id
      JOIN   public.whatsapp_instances i     ON c.instance_id     = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_message_edit_history
DROP POLICY IF EXISTS "Allow all operations on edit history"                    ON public.whatsapp_message_edit_history;
DROP POLICY IF EXISTS "Users can view edit history of accessible conversations" ON public.whatsapp_message_edit_history;

CREATE POLICY "edit_history_org_isolation" ON public.whatsapp_message_edit_history
  FOR ALL
  USING (
    message_id IN (
      SELECT m.id FROM public.whatsapp_messages m
      JOIN   public.whatsapp_conversations c ON m.conversation_id = c.id
      JOIN   public.whatsapp_instances i     ON c.instance_id     = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT m.id FROM public.whatsapp_messages m
      JOIN   public.whatsapp_conversations c ON m.conversation_id = c.id
      JOIN   public.whatsapp_instances i     ON c.instance_id     = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- whatsapp_topics_history
DROP POLICY IF EXISTS "Allow all operations on topics history"                    ON public.whatsapp_topics_history;
DROP POLICY IF EXISTS "Users can view topics history of accessible conversations" ON public.whatsapp_topics_history;

CREATE POLICY "topics_history_org_isolation" ON public.whatsapp_topics_history
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- assignment_rules
DROP POLICY IF EXISTS "Allow all operations on assignment_rules"  ON public.assignment_rules;
DROP POLICY IF EXISTS "Admins and supervisors can manage rules"   ON public.assignment_rules;

CREATE POLICY "assignment_rules_org_isolation" ON public.assignment_rules
  FOR ALL
  USING (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    instance_id IN (
      SELECT id FROM public.whatsapp_instances
      WHERE organization_id = public.get_user_organization_id()
    )
  );

-- conversation_assignments
DROP POLICY IF EXISTS "Authenticated users can view assignments"               ON public.conversation_assignments;
DROP POLICY IF EXISTS "Admins and supervisors can insert assignments"          ON public.conversation_assignments;
DROP POLICY IF EXISTS "Users can view assignments of accessible conversations" ON public.conversation_assignments;
DROP POLICY IF EXISTS "Admins and supervisors can manage assignments"          ON public.conversation_assignments;

CREATE POLICY "conv_assignments_org_isolation" ON public.conversation_assignments
  FOR ALL
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      JOIN   public.whatsapp_instances i ON c.instance_id = i.id
      WHERE  i.organization_id = public.get_user_organization_id()
    )
  );

-- profiles: users see their own + org members
DROP POLICY IF EXISTS "Users can view all profiles"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"          ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile"         ON public.profiles;

CREATE POLICY "profiles_org_read" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM public.organization_members
      WHERE organization_id = public.get_user_organization_id()
    )
  );

CREATE POLICY "profiles_own_write" ON public.profiles
  FOR UPDATE
  USING      (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- user_roles: readable within org
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles"  ON public.user_roles;

CREATE POLICY "user_roles_org_read" ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT user_id FROM public.organization_members
      WHERE organization_id = public.get_user_organization_id()
    )
  );

CREATE POLICY "user_roles_own_manage" ON public.user_roles
  FOR ALL
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- organizations RLS
CREATE POLICY "orgs_member_read" ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "orgs_owner_update" ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- organization_members RLS
CREATE POLICY "org_members_same_org_read" ON public.organization_members
  FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "org_members_owner_manage" ON public.organization_members
  FOR ALL
  USING (
    organization_id = public.get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE  organization_id = public.get_user_organization_id()
      AND    user_id         = auth.uid()
      AND    role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE  organization_id = public.get_user_organization_id()
      AND    user_id         = auth.uid()
      AND    role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 7. Add organization_id to profiles for fast frontend lookup
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- ============================================================
-- 8. Migrate existing users to seed organization
-- ============================================================
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  ur.user_id,
  CASE WHEN ur.role = 'admin' THEN 'owner' ELSE ur.role::text END
FROM public.user_roles ur
ON CONFLICT (organization_id, user_id) DO NOTHING;

UPDATE public.profiles p
SET    organization_id = '00000000-0000-0000-0000-000000000001'
WHERE  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p.id)
AND    p.organization_id IS NULL;

-- ============================================================
-- 9. Performance indexes
-- ============================================================
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org  ON public.organization_members(organization_id);
CREATE INDEX idx_instances_org    ON public.whatsapp_instances(organization_id);
CREATE INDEX idx_profiles_org     ON public.profiles(organization_id);

-- ============================================================
-- 10. updated_at trigger for organizations
-- ============================================================
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
