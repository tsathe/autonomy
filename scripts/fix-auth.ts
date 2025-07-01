import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixAuthentication() {
  console.log('=== Fixing Authentication Issues ===');
  
  try {
    // First, try to disable the trigger
    console.log('Disabling trigger...');
    const { error: disableError } = await supabaseAdmin.rpc('pg_disable_trigger', {
      trigger_name: 'on_auth_user_created',
      table_name: 'auth.users'
    });
    
    if (disableError) {
      console.log('Note: Could not disable trigger (this is okay):', disableError.message);
    }
    
    // Get institution ID
    const { data: institutions } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .limit(1);
    const institutionId = institutions?.[0]?.id;
    
    // Try creating user without metadata first
    const email = 'faculty@test.com';
    const password = 'TestPassword123!';
    
    console.log('Creating user without trigger...');
    
    // Check if user exists first
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    
    let userId;
    
    if (existingUser) {
      console.log('User already exists, updating password...');
      userId = existingUser.id;
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
        return;
      }
      
      console.log('✅ Password updated');
    } else {
      // Create using a simple approach
      console.log('Creating new user...');
      
      // Use SQL directly to create the auth user
      const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('sql', {
        query: `
          INSERT INTO auth.users (
            instance_id, 
            id, 
            aud, 
            role, 
            email, 
            encrypted_password, 
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            '${email}',
            crypt('${password}', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{}',
            false
          ) RETURNING id;
        `
      });
      
      if (sqlError) {
        console.error('SQL error:', sqlError);
        
        // Fallback: try the admin API with minimal data
        console.log('Trying admin API with minimal data...');
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true
        });
        
        if (authError) {
          console.error('Admin API error:', authError);
          return;
        }
        
        userId = authUser.user!.id;
        console.log('✅ User created via admin API');
      } else {
        userId = sqlResult[0]?.id;
        console.log('✅ User created via SQL');
      }
    }
    
    // Now create/update the profile
    console.log('Creating/updating user profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: 'Test',
        last_name: 'Faculty',
        role: 'faculty',
        institution_id: institutionId,
        department: 'General Surgery'
      })
      .select()
      .single();
      
    if (profileError) {
      console.error('Profile error:', profileError);
    } else {
      console.log('✅ Profile created/updated');
    }
    
    console.log('\n=== SUCCESS! ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userId);
    console.log('\nTry logging in now!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixAuthentication().catch(console.error);
