const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMixedEvaluationStates() {
  console.log('📝 CREATING EVALUATIONS WITH MIXED COMPLETION STATES...');

  try {
    // Get institution
    const { data: institutions } = await supabase
      .from('institutions')
      .select('id')
      .limit(1);
    
    const institutionId = institutions[0].id;
    console.log(`🏥 Using institution: ${institutionId}`);

    // Get users by email
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .in('email', [
        'resident1@autonomy.test',
        'resident2@autonomy.test', 
        'resident3@autonomy.test',
        'faculty1@autonomy.test',
        'faculty2@autonomy.test',
        'faculty3@autonomy.test'
      ]);

    const residents = users.filter(u => u.role === 'resident');
    const faculty = users.filter(u => u.role === 'faculty');

    console.log(`Found ${residents.length} residents and ${faculty.length} faculty`);

    // Get some EPAs
    const { data: epas } = await supabase
      .from('epas')
      .select('id, code, title')
      .limit(10);

    console.log(`📋 Found ${epas.length} EPAs for evaluations`);

    const evaluationsToCreate = [];
    let evalCounter = 1;

    // For each resident, create evaluations in different states
    for (const resident of residents) {
      console.log(`\n👤 Creating mixed state evaluations for ${resident.first_name} ${resident.last_name}`);

      for (const facultyMember of faculty) {
        // 1. COMPLETED EVALUATION (both responded)
        evaluationsToCreate.push({
          institution_id: institutionId,
          resident_id: resident.id,
          faculty_id: facultyMember.id,
          epa_id: epas[0].id,
          custom_case_text: `Completed case evaluation ${evalCounter++}`,
          is_custom: true,
          domains: ['intraop'],
          resident_complexity: 'moderate',
          faculty_complexity: 'moderate',
          resident_entrustment_level: '3',
          faculty_entrustment_level: '3',
          resident_comment: 'I felt confident handling this case with minimal supervision.',
          faculty_comment: 'Resident performed well with appropriate level of independence.',
          resident_completed_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          faculty_completed_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
          initiated_by: resident.id,
          created_at: new Date(Date.now() - Math.random() * 35 * 24 * 60 * 60 * 1000).toISOString()
        });

        // 2. INBOX EVALUATION - Faculty initiated, waiting for resident response
        evaluationsToCreate.push({
          institution_id: institutionId,
          resident_id: resident.id,
          faculty_id: facultyMember.id,
          epa_id: epas[1].id,
          custom_case_text: `Faculty-initiated evaluation ${evalCounter++} - awaiting resident response`,
          is_custom: true,
          domains: ['preop'],
          faculty_complexity: 'straightforward',
          faculty_entrustment_level: '4',
          faculty_comment: 'Please provide your self-assessment for this case.',
          faculty_completed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          initiated_by: facultyMember.id,
          created_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
        });

        // 3. PENDING EVALUATION - Resident initiated, waiting for faculty response
        evaluationsToCreate.push({
          institution_id: institutionId,
          resident_id: resident.id,
          faculty_id: facultyMember.id,
          epa_id: epas[2].id,
          custom_case_text: `Resident-initiated evaluation ${evalCounter++} - awaiting faculty feedback`,
          is_custom: true,
          domains: ['postop'],
          resident_complexity: 'complex',
          resident_entrustment_level: '2',
          resident_comment: 'This was a challenging case. I would appreciate faculty feedback on my performance.',
          resident_completed_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          initiated_by: resident.id,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        // 4. FRESH EVALUATION - Just created, no responses yet
        evaluationsToCreate.push({
          institution_id: institutionId,
          resident_id: resident.id,
          faculty_id: facultyMember.id,
          epa_id: epas[3].id,
          custom_case_text: `New evaluation ${evalCounter++} - no responses yet`,
          is_custom: true,
          domains: ['intraop'],
          initiated_by: Math.random() > 0.5 ? resident.id : facultyMember.id,
          created_at: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    console.log(`\n📝 Inserting ${evaluationsToCreate.length} evaluations with mixed states...`);

    // Insert in batches
    const batchSize = 10;
    let successCount = 0;

    for (let i = 0; i < evaluationsToCreate.length; i += batchSize) {
      const batch = evaluationsToCreate.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('evaluations')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
      } else {
        successCount += batch.length;
        console.log(`✅ Created evaluations ${i + 1}-${Math.min(i + batchSize, evaluationsToCreate.length)}`);
      }
    }

    console.log(`\n🎯 MIXED STATE EVALUATION CREATION COMPLETE!`);
    console.log(`📊 Successfully created ${successCount} evaluations with different completion states:`);
    console.log(`   ✅ Completed evaluations (both responded)`);
    console.log(`   📥 Inbox evaluations (awaiting user response)`);
    console.log(`   ⏳ Pending evaluations (awaiting other party response)`);
    console.log(`   🆕 Fresh evaluations (no responses yet)`);

    console.log(`\n👥 Test Credentials:`);
    console.log(`\n🩺 RESIDENTS:`);
    console.log(`   Dr. Emily Rodriguez (PGY-1): resident1@autonomy.test / TestResident123!`);
    console.log(`   Dr. James Park (PGY-3): resident2@autonomy.test / TestResident123!`);
    console.log(`   Dr. Sarah Thompson (PGY-5): resident3@autonomy.test / TestResident123!`);

    console.log(`\n👨‍⚕️ FACULTY:`);
    console.log(`   Dr. Michael Chen: faculty1@autonomy.test / TestFaculty123!`);
    console.log(`   Dr. Jennifer Williams: faculty2@autonomy.test / TestFaculty123!`);
    console.log(`   Dr. Robert Davis: faculty3@autonomy.test / TestFaculty123!`);

    console.log(`\n🌐 Now all dashboard sections should be populated!`);

  } catch (error) {
    console.error('❌ Error creating mixed evaluation states:', error);
  }
}

createMixedEvaluationStates();
