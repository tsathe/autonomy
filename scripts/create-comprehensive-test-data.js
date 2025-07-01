// Comprehensive test data creation for EPA evaluation system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createComprehensiveTestData() {
  console.log('🏥 CREATING COMPREHENSIVE TEST DATA...\n');

  // Get institution ID
  const { data: institutions } = await supabase.from('institutions').select('*').limit(1);
  const institutionId = institutions[0].id;
  console.log('🏥 Using institution:', institutions[0].name, `(${institutionId})`);

  // Define test users
  const residents = [
    {
      email: 'resident1@autonomy.test',
      password: 'TestResident123!',
      role: 'resident',
      first_name: 'Dr. Emily',
      last_name: 'Rodriguez',
      pgy_year: 1,
      department: 'General Surgery'
    },
    {
      email: 'resident2@autonomy.test',
      password: 'TestResident123!',
      role: 'resident',
      first_name: 'Dr. James',
      last_name: 'Park',
      pgy_year: 3,
      department: 'General Surgery'
    },
    {
      email: 'resident3@autonomy.test',
      password: 'TestResident123!',
      role: 'resident',
      first_name: 'Dr. Sarah',
      last_name: 'Thompson',
      pgy_year: 5,
      department: 'General Surgery'
    }
  ];

  const faculty = [
    {
      email: 'faculty1@autonomy.test',
      password: 'TestFaculty123!',
      role: 'faculty',
      first_name: 'Dr. Michael',
      last_name: 'Chen',
      department: 'General Surgery'
    },
    {
      email: 'faculty2@autonomy.test',
      password: 'TestFaculty123!',
      role: 'faculty',
      first_name: 'Dr. Jennifer',
      last_name: 'Williams',
      department: 'General Surgery'
    },
    {
      email: 'faculty3@autonomy.test',
      password: 'TestFaculty123!',
      role: 'faculty',
      first_name: 'Dr. Robert',
      last_name: 'Davis',
      department: 'General Surgery'
    }
  ];

  const allUsers = [...residents, ...faculty];
  const createdUsers = [];

  // Create users
  console.log('👥 Creating users...\n');
  for (const user of allUsers) {
    try {
      console.log(`Creating ${user.role}: ${user.first_name} ${user.last_name} (${user.email})`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.log('❌ Auth creation failed:', authError.message);
        continue;
      }

      // Create profile
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
        await supabase.auth.admin.deleteUser(authData.user.id);
      } else {
        console.log('✅ Created successfully');
        createdUsers.push({
          ...user,
          id: authData.user.id
        });
      }

    } catch (err) {
      console.log('❌ User creation failed:', err.message);
    }
  }

  // Get EPAs for evaluations
  const { data: epas } = await supabase.from('epas').select('*').order('code');
  console.log(`\n📋 Found ${epas.length} EPAs for evaluations`);

  // Separate created users by role
  const createdResidents = createdUsers.filter(u => u.role === 'resident');
  const createdFaculty = createdUsers.filter(u => u.role === 'faculty');

  console.log(`\n✅ Successfully created ${createdResidents.length} residents and ${createdFaculty.length} faculty`);

  // Create evaluations
  console.log('\n📝 Creating evaluations...\n');
  
  const evaluations = [];
  let evalCount = 0;

  // For each resident, create evaluations with different faculty
  for (const resident of createdResidents) {
    for (let i = 0; i < createdFaculty.length; i++) {
      const faculty = createdFaculty[i];
      const epa = epas[Math.floor(Math.random() * epas.length)];
      
      // Create different types of evaluations
      const evaluationTypes = [
        'completed', 'resident_pending', 'faculty_pending'
      ];
      
      for (const evalType of evaluationTypes) {
        evalCount++;
        const baseEval = {
          institution_id: institutionId,
          resident_id: resident.id,
          faculty_id: faculty.id,
          epa_id: epa.id,
          custom_case_text: getRandomCaseDescription(epa.code),
          is_custom: true,
          domains: ['intraop'],
          initiated_by: evalType === 'faculty_pending' ? faculty.id : resident.id,
          created_at: getRandomPastDate(),
        };

        let evaluation;
        
        switch (evalType) {
          case 'completed':
            evaluation = {
              ...baseEval,
              resident_entrustment_level: getRandomEntrustmentLevel(),
              resident_complexity: getRandomComplexity(),
              resident_comment: `Great learning experience with ${epa.title}. I felt comfortable with the procedure.`,
              resident_completed_at: getRandomPastDate(),
              faculty_entrustment_level: getRandomEntrustmentLevel(),
              faculty_complexity: getRandomComplexity(),
              faculty_comment: `${resident.first_name} showed good understanding and technique. Areas for improvement: attention to detail.`,
              faculty_completed_at: getRandomPastDate(),
              is_completed: true
            };
            break;
            
          case 'resident_pending':
            evaluation = {
              ...baseEval,
              faculty_entrustment_level: getRandomEntrustmentLevel(),
              faculty_complexity: getRandomComplexity(),
              faculty_comment: `Good case for ${resident.first_name}. Looking forward to their self-assessment.`,
              faculty_completed_at: getRandomPastDate(),
              is_completed: false
            };
            break;
            
          case 'faculty_pending':
            evaluation = {
              ...baseEval,
              resident_entrustment_level: getRandomEntrustmentLevel(),
              resident_complexity: getRandomComplexity(),
              resident_comment: `Challenging case that pushed my skills. Would appreciate faculty feedback.`,
              resident_completed_at: getRandomPastDate(),
              is_completed: false
            };
            break;
        }

        evaluations.push(evaluation);
      }
    }
  }

  // Insert evaluations in batches
  const batchSize = 10;
  for (let i = 0; i < evaluations.length; i += batchSize) {
    const batch = evaluations.slice(i, i + batchSize);
    const { error } = await supabase.from('evaluations').insert(batch);
    
    if (error) {
      console.log('❌ Evaluation batch failed:', error.message);
    } else {
      console.log(`✅ Created evaluations ${i + 1}-${Math.min(i + batchSize, evaluations.length)}`);
    }
  }

  console.log(`\n🎯 COMPREHENSIVE TEST DATA CREATION COMPLETE!`);
  console.log(`\n📊 Created:`);
  console.log(`   • ${createdResidents.length} residents`);
  console.log(`   • ${createdFaculty.length} faculty`);
  console.log(`   • ${evaluations.length} evaluations`);
  
  console.log('\n👥 Test Credentials:');
  console.log('\n🩺 RESIDENTS:');
  createdResidents.forEach(r => {
    console.log(`   ${r.first_name} ${r.last_name} (PGY-${r.pgy_year}): ${r.email} / ${r.password}`);
  });
  
  console.log('\n👨‍⚕️ FACULTY:');
  createdFaculty.forEach(f => {
    console.log(`   ${f.first_name} ${f.last_name}: ${f.email} / ${f.password}`);
  });
  
  console.log('\n🌐 Test at your deployed URL!');
}

// Helper functions
function getRandomCaseDescription(epaCode) {
  const descriptions = {
    'EPA-1': 'Uncomplicated inguinal hernia repair in a 45-year-old male',
    'EPA-2': 'Patient with acute abdominal pain, suspected appendicitis',
    'EPA-3': 'Hemorrhoidectomy for grade 3 internal hemorrhoids',
    'EPA-4': 'Laparoscopic appendectomy for acute appendicitis',
    'EPA-5': 'Breast lumpectomy with sentinel node biopsy',
    'EPA-6': 'Right hemicolectomy for ascending colon adenocarcinoma',
    'EPA-7': 'Emergency surgery consultation for perforated ulcer',
    'EPA-8': 'ICU management of post-operative complications',
    'EPA-9': 'Upper endoscopy for GI bleeding evaluation',
    'EPA-10': 'Laparoscopic cholecystectomy for acute cholecystitis'
  };
  
  return descriptions[epaCode] || `Complex surgical case involving ${epaCode}`;
}

function getRandomEntrustmentLevel() {
  const levels = ['observation_only', 'direct_supervision', 'indirect_supervision', 'practice_ready'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomComplexity() {
  const complexities = ['simple', 'moderate', 'complex'];
  return complexities[Math.floor(Math.random() * complexities.length)];
}

function getRandomPastDate() {
  const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

createComprehensiveTestData().catch(console.error);
