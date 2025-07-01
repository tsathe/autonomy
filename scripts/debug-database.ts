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

async function debugDatabase() {
  console.log('=== Database Debugging Session ===\n');
  
  try {
    // 1. Check database connection
    console.log('1. Testing database connection...');
    const { data: version, error: versionError } = await supabaseAdmin
      .rpc('version');
    
    if (versionError) {
      console.log('   ❌ Cannot get database version:', versionError.message);
    } else {
      console.log('   ✅ Database connection working');
    }
    
    // 2. Check if institutions table exists and has data
    console.log('\n2. Checking institutions table...');
    const { data: institutions, error: instError } = await supabaseAdmin
      .from('institutions')
      .select('*');
      
    if (instError) {
      console.log('   ❌ Error accessing institutions:', instError.message);
    } else {
      console.log(`   ✅ Found ${institutions.length} institutions`);
      if (institutions.length > 0) {
        console.log(`   First institution: ${institutions[0].name} (${institutions[0].id})`);
      }
    }
    
    // 3. Check user_profiles table structure
    console.log('\n3. Checking user_profiles table...');
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (profileError) {
      console.log('   ❌ Error accessing user_profiles:', profileError.message);
    } else {
      console.log('   ✅ user_profiles table accessible');
      console.log(`   Current profiles count: ${profiles.length}`);
    }
    
    // 4. Check if trigger function exists
    console.log('\n4. Checking trigger function...');
    const { data: functions, error: funcError } = await supabaseAdmin
      .rpc('pg_get_functiondef', { funcid: 'public.handle_new_user'::regproc });
      
    if (funcError) {
      console.log('   ❌ Cannot access function definition:', funcError.message);
      
      // Alternative check
      const { data: funcExists, error: existsError } = await supabaseAdmin
        .from('information_schema.routines')
        .select('*')
        .eq('routine_name', 'handle_new_user');
        
      if (existsError) {
        console.log('   ❌ Cannot check if function exists:', existsError.message);
      } else if (funcExists.length === 0) {
        console.log('   ❌ handle_new_user function does not exist!');
      } else {
        console.log('   ✅ handle_new_user function exists');
      }
    } else {
      console.log('   ✅ handle_new_user function accessible');
    }
    
    // 5. Check trigger exists
    console.log('\n5. Checking trigger...');
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created');
      
    if (triggerError) {
      console.log('   ❌ Cannot check triggers:', triggerError.message);
    } else if (triggers.length === 0) {
      console.log('   ❌ on_auth_user_created trigger does not exist!');
    } else {
      console.log('   ✅ on_auth_user_created trigger exists');
      console.log(`   Trigger table: ${triggers[0].event_object_table}`);
    }
    
    // 6. Test the trigger function manually
    console.log('\n6. Testing trigger function manually...');
    
    // Create a test record structure
    const testUser = {
      id: 'test-user-id-123',
      email: 'test@example.com',
      raw_user_meta_data: {
        first_name: 'Test',
        last_name: 'User',
        role: 'faculty',
        institution_id: institutions?.[0]?.id || 'test-institution-id',
        department: 'Test Department'
      }
    };
    
    // Test if we can insert directly into user_profiles
    console.log('   Testing direct insert into user_profiles...');
    const { data: testProfile, error: testError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: testUser.id,
        email: testUser.email,
        first_name: testUser.raw_user_meta_data.first_name,
        last_name: testUser.raw_user_meta_data.last_name,
        role: testUser.raw_user_meta_data.role,
        institution_id: testUser.raw_user_meta_data.institution_id,
        department: testUser.raw_user_meta_data.department
      })
      .select();
      
    if (testError) {
      console.log('   ❌ Direct insert failed:', testError.message);
      console.log('   Details:', testError.details);
      console.log('   Hint:', testError.hint);
    } else {
      console.log('   ✅ Direct insert successful, cleaning up...');
      
      // Clean up test record
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', testUser.id);
    }
    
    // 7. Check auth.users table permissions
    console.log('\n7. Checking auth table access...');
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email')
      .limit(1);
      
    if (authError) {
      console.log('   ❌ Cannot access auth.users:', authError.message);
    } else {
      console.log('   ✅ Can access auth.users table');
      console.log(`   Current users count: ${authUsers.length}`);
    }
    
    // 8. Check RLS policies
    console.log('\n8. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_profiles');
      
    if (policyError) {
      console.log('   ❌ Cannot check RLS policies:', policyError.message);
    } else {
      console.log(`   ✅ Found ${policies.length} RLS policies for user_profiles`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }
    
    console.log('\n=== Debugging Complete ===');
    console.log('Please share the output above to identify the issue.');
    
  } catch (error) {
    console.error('Unexpected error during debugging:', error);
  }
}

debugDatabase().catch(console.error);
