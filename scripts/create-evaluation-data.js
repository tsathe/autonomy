// Create evaluation test data for existing users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createEvaluationData() {
  console.log('📝 CREATING EVALUATION TEST DATA...\n');

  // Get institution ID
  const { data: institutions } = await supabase.from('institutions').select('*').limit(1);
  const institutionId = institutions[0].id;
  console.log('🏥 Using institution:', institutions[0].name, `(${institutionId})`);

  // Get existing test users
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('institution_id', institutionId)
    .in('email', [
      'resident1@autonomy.test',
      'resident2@autonomy.test', 
      'resident3@autonomy.test',
      'faculty1@autonomy.test',
      'faculty2@autonomy.test',
      'faculty3@autonomy.test'
    ]);

  const residents = allUsers.filter(u => u.role === 'resident');
  const faculty = allUsers.filter(u => u.role === 'faculty');

  console.log(`Found ${residents.length} residents and ${faculty.length} faculty`);

  if (residents.length === 0 || faculty.length === 0) {
    console.log('❌ No test users found. Please run create-comprehensive-test-data.js first.');
    return;
  }

  // Get EPAs
  const { data: epas } = await supabase.from('epas').select('*').order('code');
  console.log(`📋 Found ${epas.length} EPAs for evaluations`);

  // Create evaluations
  const evaluations = [];

  // For each resident, create evaluations with different faculty
  for (const resident of residents) {
    console.log(`\n👤 Creating evaluations for ${resident.first_name} ${resident.last_name} (PGY-${resident.pgy_year})`);
    
    for (let i = 0; i < faculty.length; i++) {
      const facultyMember = faculty[i];
      
      // Select different EPAs for variety
      const selectedEPAs = epas.slice(i * 3, (i * 3) + 3);
      
      for (const epa of selectedEPAs) {
        // Create different types of evaluations
        const evaluationTypes = [
          'completed', 'resident_pending', 'faculty_pending'
        ];
        
        for (const evalType of evaluationTypes) {
          const baseEval = {
            institution_id: institutionId,
            resident_id: resident.id,
            faculty_id: facultyMember.id,
            epa_id: epa.id,
            custom_case_text: getRandomCaseDescription(epa.code, resident.pgy_year),
            is_custom: true,
            domains: ['intraop'],
            initiated_by: evalType === 'faculty_pending' ? facultyMember.id : resident.id,
            created_at: getRandomPastDate(),
          };

          let evaluation;
          
          switch (evalType) {
            case 'completed':
              evaluation = {
                ...baseEval,
                resident_entrustment_level: getRandomEntrustmentLevel(resident.pgy_year),
                resident_complexity: getRandomComplexity(),
                resident_comment: getResidentComment(epa.title, resident.pgy_year),
                resident_completed_at: getRandomPastDate(),
                faculty_entrustment_level: getRandomEntrustmentLevel(resident.pgy_year),
                faculty_complexity: getRandomComplexity(),
                faculty_comment: getFacultyComment(resident.first_name, epa.title, resident.pgy_year),
                faculty_completed_at: getRandomPastDate()
              };
              break;
              
            case 'resident_pending':
              evaluation = {
                ...baseEval,
                faculty_entrustment_level: getRandomEntrustmentLevel(resident.pgy_year),
                faculty_complexity: getRandomComplexity(),
                faculty_comment: `Good case for ${resident.first_name}. Looking forward to their self-assessment.`,
                faculty_completed_at: getRandomPastDate()
              };
              break;
              
            case 'faculty_pending':
              evaluation = {
                ...baseEval,
                resident_entrustment_level: getRandomEntrustmentLevel(resident.pgy_year),
                resident_complexity: getRandomComplexity(),
                resident_comment: `Challenging case that pushed my skills. Would appreciate faculty feedback from Dr. ${facultyMember.last_name}.`,
                resident_completed_at: getRandomPastDate()
              };
              break;
          }

          evaluations.push(evaluation);
        }
      }
    }
  }

  // Insert evaluations in batches
  console.log(`\n📝 Inserting ${evaluations.length} evaluations...`);
  const batchSize = 10;
  let successCount = 0;
  
  for (let i = 0; i < evaluations.length; i += batchSize) {
    const batch = evaluations.slice(i, i + batchSize);
    const { error } = await supabase.from('evaluations').insert(batch);
    
    if (error) {
      console.log('❌ Evaluation batch failed:', error.message);
    } else {
      successCount += batch.length;
      console.log(`✅ Created evaluations ${i + 1}-${Math.min(i + batchSize, evaluations.length)}`);
    }
  }

  console.log(`\n🎯 EVALUATION DATA CREATION COMPLETE!`);
  console.log(`📊 Successfully created ${successCount} evaluations`);
  
  console.log('\n👥 Test Credentials:');
  console.log('\n🩺 RESIDENTS:');
  residents.forEach(r => {
    console.log(`   ${r.first_name} ${r.last_name} (PGY-${r.pgy_year}): ${r.email} / TestResident123!`);
  });
  
  console.log('\n👨‍⚕️ FACULTY:');
  faculty.forEach(f => {
    console.log(`   ${f.first_name} ${f.last_name}: ${f.email} / TestFaculty123!`);
  });
  
  console.log('\n🌐 Test at your deployed URL!');
}

// Helper functions
function getRandomCaseDescription(epaCode, pgyYear) {
  const descriptions = {
    'EPA-1': [
      'Uncomplicated inguinal hernia repair in a 45-year-old male',
      'Bilateral inguinal hernia repair with mesh',
      'Incarcerated inguinal hernia emergency repair'
    ],
    'EPA-2': [
      'Patient with acute abdominal pain, suspected appendicitis',
      'Elderly patient with bowel obstruction',
      'Young female with acute RLQ pain'
    ],
    'EPA-3': [
      'Hemorrhoidectomy for grade 3 internal hemorrhoids',
      'Anal fistula repair procedure',
      'Pilonidal cyst excision and closure'
    ],
    'EPA-4': [
      'Laparoscopic appendectomy for acute appendicitis',
      'Open appendectomy with complicated presentation',
      'Appendectomy with perforation and abscess'
    ],
    'EPA-5': [
      'Breast lumpectomy with sentinel node biopsy',
      'Core needle biopsy of breast mass',
      'Mastectomy for invasive carcinoma'
    ],
    'EPA-6': [
      'Right hemicolectomy for ascending colon adenocarcinoma',
      'Sigmoid resection for diverticulitis',
      'Low anterior resection for rectal cancer'
    ],
    'EPA-7': [
      'Emergency surgery consultation for perforated ulcer',
      'Preoperative assessment and planning',
      'Postoperative complication management'
    ],
    'EPA-8': [
      'ICU management of post-operative complications',
      'Ventilator management for surgical patient',
      'Sepsis management in post-op patient'
    ],
    'EPA-9': [
      'Upper endoscopy for GI bleeding evaluation',
      'Colonoscopy with polypectomy',
      'ERCP for bile duct evaluation'
    ],
    'EPA-10': [
      'Laparoscopic cholecystectomy for acute cholecystitis',
      'Open cholecystectomy conversion',
      'ERCP with sphincterotomy'
    ]
  };
  
  const caseList = descriptions[epaCode] || ['Complex surgical case'];
  const randomCase = caseList[Math.floor(Math.random() * caseList.length)];
  
  // Add complexity based on PGY year
  if (pgyYear >= 4) {
    return `${randomCase} (complex case with multiple comorbidities)`;
  } else if (pgyYear >= 2) {
    return `${randomCase} (standard complexity)`;
  } else {
    return `${randomCase} (supervised learning case)`;
  }
}

function getRandomEntrustmentLevel(pgyYear) {
  // Bias entrustment levels based on PGY year
  if (pgyYear === 1) {
    const levels = ['observation_only', 'observation_only', 'direct_supervision'];
    return levels[Math.floor(Math.random() * levels.length)];
  } else if (pgyYear === 2 || pgyYear === 3) {
    const levels = ['direct_supervision', 'direct_supervision', 'indirect_supervision'];
    return levels[Math.floor(Math.random() * levels.length)];
  } else {
    const levels = ['indirect_supervision', 'indirect_supervision', 'practice_ready'];
    return levels[Math.floor(Math.random() * levels.length)];
  }
}

function getRandomComplexity() {
  const complexities = ['straightforward', 'moderate', 'complex'];
  return complexities[Math.floor(Math.random() * complexities.length)];
}

function getResidentComment(epaTitle, pgyYear) {
  const comments = {
    1: [
      `First time observing ${epaTitle}. Learned a lot about the procedure and anatomy.`,
      `Great learning experience. Dr. was very educational and explained each step.`,
      `Challenging case that helped me understand the complexity of ${epaTitle}.`
    ],
    2: [
      `Assisted with ${epaTitle}. Feel more comfortable with the steps now.`,
      `Good case for my level. Was able to participate meaningfully in the procedure.`,
      `Building confidence with ${epaTitle}. Ready for more independence.`
    ],
    3: [
      `Performed most of ${epaTitle} with supervision. Feel comfortable with standard cases.`,
      `Challenging case that tested my skills. Good learning opportunity.`,
      `Confident with routine cases of ${epaTitle}. Ready for more complex scenarios.`
    ],
    4: [
      `Independently managed ${epaTitle} with minimal guidance. Comfortable with complications.`,
      `Complex case that I handled well. Feel ready for independent practice.`,
      `Performed ${epaTitle} independently. Ready to teach junior residents.`
    ],
    5: [
      `Independently performed ${epaTitle}. Teaching opportunity for junior residents.`,
      `Complex case managed independently. Comfortable with all variations.`,
      `Expert level performance. Ready for attending responsibilities.`
    ]
  };
  
  const yearComments = comments[pgyYear] || comments[3];
  return yearComments[Math.floor(Math.random() * yearComments.length)];
}

function getFacultyComment(residentName, epaTitle, pgyYear) {
  const comments = {
    1: [
      `${residentName} showed excellent attention to detail during ${epaTitle}. Good foundational knowledge.`,
      `Strong observational skills. ${residentName} asked thoughtful questions throughout the case.`,
      `${residentName} is developing well. Recommend more exposure to similar cases.`
    ],
    2: [
      `${residentName} assisted effectively during ${epaTitle}. Shows growing confidence.`,
      `Good technical skills developing. ${residentName} handled unexpected findings well.`,
      `${residentName} is progressing nicely. Ready for increased responsibility.`
    ],
    3: [
      `${residentName} performed ${epaTitle} with appropriate supervision. Good decision-making.`,
      `Strong technical execution. ${residentName} managed complications appropriately.`,
      `${residentName} demonstrates readiness for more independence in similar cases.`
    ],
    4: [
      `${residentName} performed ${epaTitle} independently. Excellent clinical judgment.`,
      `Ready for senior resident responsibilities. ${residentName} handled complexity well.`,
      `${residentName} shows teaching potential. Excellent case management.`
    ],
    5: [
      `${residentName} demonstrates attending-level skills in ${epaTitle}. Ready for practice.`,
      `Excellent leadership during the case. ${residentName} guided junior residents effectively.`,
      `${residentName} performed at expert level. Ready for independent practice.`
    ]
  };
  
  const yearComments = comments[pgyYear] || comments[3];
  return yearComments[Math.floor(Math.random() * yearComments.length)];
}

function getRandomPastDate() {
  const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

createEvaluationData().catch(console.error);
