const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvaluations() {
  console.log('🔍 Checking which users have evaluations...');
  
  // Get all evaluations with user details
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select(`
      id,
      resident:profiles!evaluations_resident_id_fkey(email, first_name, last_name),
      faculty:profiles!evaluations_faculty_id_fkey(email, first_name, last_name),
      is_completed
    `)
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Sample evaluations:');
  evaluations.forEach(eval => {
    console.log(`  Resident: ${eval.resident.first_name} ${eval.resident.last_name} (${eval.resident.email})`);
    console.log(`  Faculty: ${eval.faculty.first_name} ${eval.faculty.last_name} (${eval.faculty.email})`);
    console.log(`  Completed: ${eval.is_completed}`);
    console.log('  ---');
  });

  // Check unique users with evaluations
  const { data: residentEvals } = await supabase
    .from('evaluations')
    .select('resident:profiles!evaluations_resident_id_fkey(email, first_name, last_name)')
    .limit(100);

  const { data: facultyEvals } = await supabase
    .from('evaluations')
    .select('faculty:profiles!evaluations_faculty_id_fkey(email, first_name, last_name)')
    .limit(100);

  console.log('\n👥 USERS WITH EVALUATIONS:');
  console.log('\n🩺 RESIDENTS:');
  const uniqueResidents = [...new Map(residentEvals.map(e => [e.resident.email, e.resident])).values()];
  uniqueResidents.forEach(r => {
    console.log(`   ${r.first_name} ${r.last_name}: ${r.email}`);
  });

  console.log('\n👨‍⚕️ FACULTY:');
  const uniqueFaculty = [...new Map(facultyEvals.map(e => [e.faculty.email, e.faculty])).values()];
  uniqueFaculty.forEach(f => {
    console.log(`   ${f.first_name} ${f.last_name}: ${f.email}`);
  });
}

checkEvaluations();
