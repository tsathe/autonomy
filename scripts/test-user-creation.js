// Test user creation to verify trigger is working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUserCreation() {
  console.log('🧪 TESTING USER CREATION...\n');

  try {
    // Use the Test Medical Center institution
    const institutionId = '72417dc3-a908-43c6-b7a6-6ec2c37a2c96';
    
    console.log('1️⃣ Creating test user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@autonomy.test`,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'resident',
        pgy_year: 2,
        institution_id: institutionId
      }
    });

    if (authError) {
      console.log('❌ User creation failed:', authError.message);
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log('👤 User ID:', authData.user.id);
    
    // Wait a moment for trigger to run
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if profile was created by trigger
    console.log('\n2️⃣ Checking if profile was created by trigger...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
      console.log('💡 Trigger may not be working properly');
    } else {
      console.log('✅ Profile created successfully by trigger!');
      console.log('📋 Profile details:');
      console.log(`   Name: ${profile.first_name} ${profile.last_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Institution ID: ${profile.institution_id}`);
    }

    // Clean up test user
    console.log('\n3️⃣ Cleaning up test user...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('🧹 Test user cleaned up');

  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  console.log('\n🎯 TEST COMPLETE');
}

testUserCreation().catch(console.error);
