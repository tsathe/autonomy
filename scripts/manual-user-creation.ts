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

async function createFacultyUser() {
  console.log('=== Manual Faculty User Creation ===');
  
  const email = 'faculty@test.com';
  const password = 'TestPassword123!';
  
  try {
    // First, let's get the institution ID
    const { data: institutions, error: instError } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .limit(1);
      
    if (instError) {
      console.error('Error getting institutions:', instError);
      return;
    }
    
    const institutionId = institutions?.[0]?.id;
    console.log('Institution ID:', institutionId);
    
    // Create user with minimal metadata
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {},  // Start with empty metadata to avoid trigger issues
      email_confirm: true
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('✅ Auth user created:', authUser.user?.id);
    
    // Now manually create the user profile
    console.log('Creating user profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user!.id,
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
      // Try to clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
      return;
    }
    
    console.log('✅ User profile created:', profile.id);
    
    console.log('\n=== SUCCESS! ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', authUser.user?.id);
    console.log('\nYou can now try logging in with these credentials.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createFacultyUser().catch(console.error);
