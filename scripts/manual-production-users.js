// Manually create users bypassing the trigger
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You need the service role key for this to work
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUsersManually() {
  try {
    // First, get institution ID
    const { data: institutions } = await supabase.from('institutions').select('*').limit(1);
    let institutionId;
    
    if (institutions && institutions.length > 0) {
      institutionId = institutions[0].id;
      console.log('Using institution ID:', institutionId);
    } else {
      // Create institution first
      const { data: newInst } = await supabase
        .from('institutions')
        .insert({ name: 'Test Medical Center' })
        .select()
        .single();
      institutionId = newInst.id;
      console.log('Created new institution ID:', institutionId);
    }

    // Disable trigger temporarily
    await supabase.rpc('exec', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    });

    // Create faculty user
    const { data: facultyAuth, error: facultyAuthError } = await supabase.auth.admin.createUser({
      email: 'faculty@autonomy.test',
      password: 'TestFaculty123!',
      email_confirm: true
    });

    if (facultyAuth && !facultyAuthError) {
      // Create faculty profile manually
      await supabase.from('profiles').insert({
        id: facultyAuth.user.id,
        institution_id: institutionId,
        email: 'faculty@autonomy.test',
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        role: 'faculty',
        department: 'General Surgery'
      });
      console.log('✅ Faculty user created');
    }

    // Create resident user
    const { data: residentAuth, error: residentAuthError } = await supabase.auth.admin.createUser({
      email: 'resident@autonomy.test',
      password: 'TestResident123!',
      email_confirm: true
    });

    if (residentAuth && !residentAuthError) {
      // Create resident profile manually
      await supabase.from('profiles').insert({
        id: residentAuth.user.id,
        institution_id: institutionId,
        email: 'resident@autonomy.test',
        first_name: 'Dr. Michael',
        last_name: 'Chen',
        role: 'resident',
        pgy_year: 2,
        department: 'General Surgery'
      });
      console.log('✅ Resident user created');
    }

    console.log('\n📧 Test Credentials:');
    console.log('Faculty: faculty@autonomy.test / TestFaculty123!');
    console.log('Resident: resident@autonomy.test / TestResident123!');

  } catch (error) {
    console.error('Error:', error);
  }
}

createUsersManually();
