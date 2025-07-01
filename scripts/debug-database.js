// Debug database structure and foreign key references
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDatabase() {
  console.log('🔍 DEBUGGING DATABASE STRUCTURE...\n');

  // Get institution ID
  const { data: institutions } = await supabase.from('institutions').select('*').limit(1);
  const institutionId = institutions[0].id;
  console.log('🏥 Institution:', institutions[0].name, `(${institutionId})`);

  // Check profiles table
  console.log('\n👥 Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('institution_id', institutionId);

  if (profilesError) {
    console.log('❌ Profiles error:', profilesError.message);
  } else {
    console.log(`✅ Found ${profiles.length} profiles:`);
    profiles.forEach(p => {
      console.log(`   ${p.role}: ${p.first_name} ${p.last_name} (${p.email}) - ID: ${p.id}`);
    });
  }

  // Try to check if user_profiles exists
  console.log('\n👥 Checking user_profiles table...');
  const { data: userProfiles, error: userProfilesError } = await supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, role')
    .limit(5);

  if (userProfilesError) {
    console.log('❌ User_profiles error:', userProfilesError.message);
  } else {
    console.log(`✅ Found ${userProfiles.length} user_profiles:`);
    userProfiles.forEach(p => {
      console.log(`   ${p.role}: ${p.first_name} ${p.last_name} (${p.email}) - ID: ${p.id}`);
    });
  }

  // Check evaluations table structure
  console.log('\n📝 Checking evaluations table...');
  const { data: evaluations, error: evaluationsError } = await supabase
    .from('evaluations')
    .select('*')
    .limit(1);

  if (evaluationsError) {
    console.log('❌ Evaluations error:', evaluationsError.message);
  } else {
    console.log('✅ Evaluations table accessible');
    if (evaluations.length > 0) {
      console.log('Sample evaluation columns:', Object.keys(evaluations[0]));
    }
  }

  // Try a simple insert test
  if (profiles && profiles.length >= 2) {
    const testResident = profiles.find(p => p.role === 'resident');
    const testFaculty = profiles.find(p => p.role === 'faculty');
    
    if (testResident && testFaculty) {
      console.log('\n🧪 Testing simple evaluation insert...');
      console.log(`Using resident: ${testResident.first_name} ${testResident.last_name} (${testResident.id})`);
      console.log(`Using faculty: ${testFaculty.first_name} ${testFaculty.last_name} (${testFaculty.id})`);
      
      // Get first EPA
      const { data: epas } = await supabase.from('epas').select('*').limit(1);
      if (epas && epas.length > 0) {
        console.log(`Using EPA: ${epas[0].code} (${epas[0].id})`);
        
        const testEvaluation = {
          institution_id: institutionId,
          resident_id: testResident.id,
          faculty_id: testFaculty.id,
          epa_id: epas[0].id,
          custom_case_text: 'Test case description',
          is_custom: true,
          domains: ['intraop'],
          initiated_by: testResident.id,
        };

        console.log('Test evaluation object:', JSON.stringify(testEvaluation, null, 2));
        
        const { data: result, error: insertError } = await supabase
          .from('evaluations')
          .insert(testEvaluation)
          .select()
          .single();

        if (insertError) {
          console.log('❌ Test insert failed:', insertError.message);
          console.log('Error details:', insertError);
        } else {
          console.log('✅ Test insert successful!');
          console.log('Created evaluation:', result.id);
          
          // Clean up - delete the test evaluation
          await supabase.from('evaluations').delete().eq('id', result.id);
          console.log('🧹 Cleaned up test evaluation');
        }
      }
    }
  }

  console.log('\n🔍 DEBUG COMPLETE!');
}

debugDatabase().catch(console.error);
