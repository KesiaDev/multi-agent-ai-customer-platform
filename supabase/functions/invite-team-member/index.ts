import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AppRole = 'admin' | 'supervisor' | 'agent';
type OrgRole = 'owner' | 'admin' | 'agent';

interface InviteRequest {
  email: string;
  fullName: string;
  role: AppRole;
}

function appRoleToOrgRole(appRole: AppRole): OrgRole {
  return appRole === 'admin' ? 'admin' : 'agent';
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

    // Authenticate the caller
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

    // Caller must belong to an org and be owner or admin
    const { data: callerMembership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (!callerMembership) {
      return new Response(JSON.stringify({ error: 'Caller has no organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['owner', 'admin'].includes(callerMembership.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions to invite members' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, fullName, role }: InviteRequest = await req.json();
    const orgId = callerMembership.organization_id;

    console.log('[invite-team-member] Inviting', email, 'to org', orgId, 'as', role);

    // Prevent duplicate membership in this org
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMembership } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('user_id', existingProfile.id)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ error: 'User is already a member of this organization' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Send invitation email — user gets a magic link to set their password
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${siteUrl}/`,
        data: { full_name: fullName },
      }
    );

    if (inviteError) {
      console.error('[invite-team-member] Error sending invite:', inviteError);
      throw inviteError;
    }

    const invitedUserId = inviteData.user.id;
    console.log('[invite-team-member] User invited:', invitedUserId);

    // Pre-seed profile so the user is ready on first login
    await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: invitedUserId,
          email,
          full_name: fullName,
          is_active: true,
          is_approved: true,  // explicit invite = pre-approved
          organization_id: orgId,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );

    // Add to organization with appropriate org role
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert(
        { organization_id: orgId, user_id: invitedUserId, role: appRoleToOrgRole(role) },
        { onConflict: 'organization_id,user_id', ignoreDuplicates: true }
      );

    if (memberError) {
      console.error('[invite-team-member] Error adding to org:', memberError);
    }

    // Set app role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: invitedUserId, role },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );

    if (roleError) {
      console.error('[invite-team-member] Error setting role:', roleError);
    }

    console.log('[invite-team-member] ✅ Invite complete for', email);

    return new Response(
      JSON.stringify({
        success: true,
        userId: invitedUserId,
        message: 'Convite enviado com sucesso. O membro receberá um email para confirmar o cadastro.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[invite-team-member] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
