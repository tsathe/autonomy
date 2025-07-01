// Manual user creation bypassing the broken trigger
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUsersManually() {
  console.log('👥 CREATING TEST USERS MANUALLY...\n');

  // Get institution ID
  const { data: institutions } = await supabase.from('institutions').select('*').limit(1);
  const institutionId = institutions[0].id;
  console.log('🏥 Using institution:', institutions[0].name, `(${institutionId})`);

  const users = [
    {
      email: 'faculty@autonomy.test',
      password: 'TestFaculty123!',
      role: 'faculty',
      first_name: 'Dr. Sarah',
      last_name: 'Johnson',
      department: 'General Surgery'
    },
    {
      email: 'resident@autonomy.test', 
      password: 'TestResident123!',
      role: 'resident',
      first_name: 'Dr. Michael',
      last_name: 'Chen',
      pgy_year: 2,
      department: 'General Surgery'
    }
  ];

  for (const user of users) {
    try {
      console.log(`\n👤 Creating ${user.role}: ${user.email}`);
      
      // Step 1: Create auth user (with disabled trigger, this should work)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.log('❌ Auth creation failed:', authError.message);
        continue;
      }

      console.log('✅ Auth user created');

      // Step 2: Manually create profile (since trigger is broken)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          institution_id: institutionId,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          pgy_year: user.pgy_year || null,
          department: user.department
        });

      if (profileError) {
        console.log('❌ Profile creation failed:', profileError.message);
        // Clean up auth user if profile failed
        await supabase.auth.admin.deleteUser(authData.user.id);
      } else {
        console.log('✅ Profile created successfully');
        console.log(`📧 Login: ${user.email} / ${user.password}`);
      }

    } catch (err) {
      console.log('❌ User creation failed:', err.message);
    }
  }

  console.log('\n🎯 MANUAL USER CREATION COMPLETE!');
  console.log('\n📧 Test Credentials:');
  console.log('Faculty: faculty@autonomy.test / TestFaculty123!');
  console.log('Resident: resident@autonomy.test / TestResident123!');
  console.log('\n🌐 Test at: https://autonomy-8egax9akx-tsathes-projects.vercel.app');
}

createTestUsersManually().catch(console.error);
