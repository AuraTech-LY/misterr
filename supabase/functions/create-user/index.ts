import { createClient } from 'npm:@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  created_by?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !currentUser) {
      throw new Error('Unauthorized');
    }

    const { data: currentUserRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('can_manage_users, is_owner')
      .eq('user_email', currentUser.email)
      .maybeSingle();

    if (roleError || !currentUserRole || (!currentUserRole.can_manage_users && !currentUserRole.is_owner)) {
      throw new Error('Insufficient permissions');
    }

    const { email, password, name, phone, created_by }: CreateUserRequest = await req.json();

    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone: phone || null,
      },
    });

    if (createError) {
      throw createError;
    }

    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_email: email,
        user_name: name,
        user_phone: phone || null,
        created_by: created_by || currentUser.email,
      }]);

    if (roleInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw roleInsertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user: authData.user,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});