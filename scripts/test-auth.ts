import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testAuth() {
  console.log('\n=== Testing Supabase Connection ===');
  
  try {
    // Test basic connection
    const { data: institutions, error: instError } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .limit(1);
      
    if (instError) {
      console.error('Database connection error:', instError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('Institutions found:', institutions?.length || 0);
    
    // Get institution ID for user creation
    let institutionId = institutions?.[0]?.id;
    
    if (!institutionId) {
      console.log('Creating test institution...');
      const { data: newInst, error: newInstError } = await supabaseAdmin
        .from('institutions')
        .insert({ name: 'Test Medical Center' })
        .select()
        .single();
        
      if (newInstError) {
        console.error('Error creating institution:', newInstError);
        return;
      }
      institutionId = newInst.id;
    }
    
    console.log('Using institution ID:', institutionId);
    
    // Create test faculty user
    const testEmail = 'faculty@test.com';
    const testPassword = 'TestPassword123!';
    
    console.log('\n=== Creating Test Faculty User ===');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
    // Check if user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const existingUser = users.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.id);
      
      // Update user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: testPassword }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      // Create new user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: {
          first_name: 'Test',
          last_name: 'Faculty',
          role: 'faculty',
          institution_id: institutionId,
          department: 'General Surgery'
        },
        email_confirm: true
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        return;
      }
      
      console.log('✅ Auth user created:', authUser.user?.id);
    }
    
    console.log('\n=== Test Credentials ===');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('\nYou can now try logging in with these credentials.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAuth().catch(console.error);
