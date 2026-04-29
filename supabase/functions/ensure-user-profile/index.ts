import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 ensure-user-profile for:', user.id);

    let profileCreated = false;
    let roleCreated = false;
    let profileAutoApproved = false;
    let organizationCreated = false;
    let addedToOrg = false;

    // Check approval config
    const { data: approvalConfig } = await supabaseAdmin
      .from('project_config')
      .select('value')
      .eq('key', 'require_account_approval')
      .maybeSingle();

    const requireApproval = approvalConfig?.value === 'true';

    // Count existing profiles
    const { count: profileCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const isFirstUser = profileCount === null || profileCount === 0;

    // ── Profile ──────────────────────────────────────────────
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_approved, organization_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const isApproved = isFirstUser ? true : !requireApproval;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          is_active: true,
          is_approved: isApproved
        });

      if (!profileError) profileCreated = true;
      else console.error('❌ Error creating profile:', profileError);
    } else if (existingProfile.is_approved === false || existingProfile.is_approved === null) {
      const { count: totalProfiles } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalProfiles === 1) {
        await supabaseAdmin.from('profiles').update({ is_approved: true }).eq('id', user.id);
        profileAutoApproved = true;
      }
    }

    // ── Role ─────────────────────────────────────────────────
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingRole) {
      const { count: currentProfileCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const assignedRole = (currentProfileCount === null || currentProfileCount <= 1) ? 'admin' : 'agent';

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: user.id, role: assignedRole });

      if (!roleError) roleCreated = true;
      else console.error('❌ Error creating role:', roleError);
    }

    // ── Organization ─────────────────────────────────────────
    // Check if user already belongs to an org
    const { data: existingMembership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingMembership) {
      // First user: create a new organization and become owner
      // Subsequent users invited via invite link will be assigned by the invite flow
      if (isFirstUser || profileCreated) {
        // Determine if this is truly the first org ever
        const { count: orgCount } = await supabaseAdmin
          .from('organizations')
          .select('*', { count: 'exact', head: true });

        if (orgCount === null || orgCount === 0) {
          // Create first organization
          const companyName = user.user_metadata?.company_name || user.email?.split('@')[1]?.split('.')[0] || 'Minha Empresa';
          const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50);

          const { data: newOrg, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({ name: companyName, slug: `${slug}-${Date.now()}`, plan: 'conexao', status: 'active' })
            .select('id')
            .single();

          if (!orgError && newOrg) {
            organizationCreated = true;

            // Add user as owner
            await supabaseAdmin.from('organization_members').insert({
              organization_id: newOrg.id,
              user_id: user.id,
              role: 'owner'
            });

            // Link org to profile
            await supabaseAdmin.from('profiles').update({ organization_id: newOrg.id }).eq('id', user.id);

            addedToOrg = true;
            console.log('✅ Created organization:', newOrg.id);
          }
        } else {
          // Org already exists (seeded or created) — add user as member
          // This path handles the existing NandiDev seed org
          const { data: firstOrg } = await supabaseAdmin
            .from('organizations')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (firstOrg) {
            const memberRole = (existingRole?.role === 'admin' || (!existingRole && isFirstUser)) ? 'owner' : 'agent';
            const { error: memberError } = await supabaseAdmin
              .from('organization_members')
              .insert({ organization_id: firstOrg.id, user_id: user.id, role: memberRole })
              .select()
              .maybeSingle();

            if (!memberError) {
              addedToOrg = true;
              await supabaseAdmin.from('profiles').update({ organization_id: firstOrg.id }).eq('id', user.id);
            }
          }
        }
      }
    }

    // Return current organization context for frontend
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role, organizations(id, name, slug, plan, status)')
      .eq('user_id', user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      success: true,
      profileCreated,
      roleCreated,
      profileAutoApproved,
      organizationCreated,
      addedToOrg,
      existingProfile: !!existingProfile,
      existingRole: !!existingRole,
      organization: membership?.organizations ?? null,
      organizationRole: membership?.role ?? null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
