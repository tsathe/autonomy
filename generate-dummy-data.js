// Dummy Data Generator for EPA Evaluation App
// Run this to generate sample data for testing the feed design

// Simple UUID generator (for dummy data only)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Sample data configurations
const SAMPLE_RESIDENTS = [
  { id: generateUUID(), first_name: 'John', last_name: 'Doe', pgy_year: 3 },
  { id: generateUUID(), first_name: 'Jane', last_name: 'Smith', pgy_year: 2 },
  { id: generateUUID(), first_name: 'Michael', last_name: 'Johnson', pgy_year: 4 },
  { id: generateUUID(), first_name: 'Emily', last_name: 'Davis', pgy_year: 1 },
  { id: generateUUID(), first_name: 'Sarah', last_name: 'Wilson', pgy_year: 5 }
];

const SAMPLE_FACULTY = [
  { id: generateUUID(), first_name: 'Dr. Robert', last_name: 'Miller' },
  { id: generateUUID(), first_name: 'Dr. Lisa', last_name: 'Anderson' },
  { id: generateUUID(), first_name: 'Dr. James', last_name: 'Taylor' },
  { id: generateUUID(), first_name: 'Dr. Maria', last_name: 'Garcia' },
  { id: generateUUID(), first_name: 'Dr. David', last_name: 'Brown' }
];

const SAMPLE_EPAS = [
  { id: generateUUID(), code: 'EPA-1', title: 'Gather a history and perform a physical examination' },
  { id: generateUUID(), code: 'EPA-2', title: 'Prioritize a differential diagnosis following a clinical encounter' },
  { id: generateUUID(), code: 'EPA-3', title: 'Recommend and interpret common diagnostic and screening tests' },
  { id: generateUUID(), code: 'EPA-4', title: 'Enter and discuss orders and prescriptions' },
  { id: generateUUID(), code: 'EPA-5', title: 'Document a clinical encounter in the patient record' },
  { id: generateUUID(), code: 'EPA-6', title: 'Provide an oral presentation of a clinical encounter' },
  { id: generateUUID(), code: 'EPA-7', title: 'Form clinical questions and retrieve evidence to advance patient care' },
  { id: generateUUID(), code: 'EPA-8', title: 'Give or receive a patient handover to transition care responsibility' },
  { id: generateUUID(), code: 'EPA-9', title: 'Collaborate as a member of an interprofessional team' },
  { id: generateUUID(), code: 'EPA-10', title: 'Recognize a patient requiring urgent or emergent care and initiate evaluation and management' }
];

const COMPLEXITY_LEVELS = ['straightforward', 'moderate', 'complex'];
const ENTRUSTMENT_LEVELS = ['observation_only', 'direct_supervision', 'indirect_supervision', 'practice_ready'];
const DOMAINS = ['preop', 'intraop', 'postop'];

const SAMPLE_CASES = [
  'Laparoscopic cholecystectomy for symptomatic gallstones',
  'Open appendectomy for acute appendicitis',
  'Inguinal hernia repair with mesh',
  'Colonoscopy for colorectal cancer screening',
  'Emergency department trauma evaluation',
  'Postoperative wound care and management',
  'Preoperative assessment for elective surgery',
  'Central line placement in ICU',
  'Thyroidectomy for thyroid nodule',
  'Bowel obstruction workup and management',
  'Breast biopsy for suspicious lesion',
  'Ventral hernia repair',
  'Endoscopic retrograde cholangiopancreatography (ERCP)',
  'Surgical site infection management',
  'Peritoneal dialysis catheter placement'
];

// Helper functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEvaluations(count = 50) {
  const evaluations = [];
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  
  for (let i = 0; i < count; i++) {
    const resident = randomChoice(SAMPLE_RESIDENTS);
    const faculty = randomChoice(SAMPLE_FACULTY);
    const epa = randomChoice(SAMPLE_EPAS);
    const complexity = randomChoice(COMPLEXITY_LEVELS);
    const createdAt = randomDate(threeMonthsAgo, now);
    
    // Generate different completion states
    const completionType = Math.random();
    let residentCompleted = null;
    let facultyCompleted = null;
    let residentEntrustment = null;
    let facultyEntrustment = null;
    let residentComment = null;
    let facultyComment = null;
    
    if (completionType < 0.4) {
      // 40% - Completed evaluations
      residentCompleted = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      facultyCompleted = new Date(residentCompleted.getTime() + Math.random() * 48 * 60 * 60 * 1000);
      residentEntrustment = randomChoice(ENTRUSTMENT_LEVELS);
      facultyEntrustment = randomChoice(ENTRUSTMENT_LEVELS);
      residentComment = `This case helped me understand ${epa.title.toLowerCase()}. I felt ${residentEntrustment.replace('_', ' ')} throughout the procedure.`;
      facultyComment = `The resident demonstrated ${facultyEntrustment.replace('_', ' ')} for this EPA. ${Math.random() > 0.5 ? 'Good clinical reasoning and technical skills.' : 'Areas for improvement include communication and efficiency.'}`;
    } else if (completionType < 0.7) {
      // 30% - Pending faculty evaluation (resident completed)
      residentCompleted = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      residentEntrustment = randomChoice(ENTRUSTMENT_LEVELS);
      residentComment = `Completed ${epa.title.toLowerCase()} case. Awaiting faculty feedback.`;
    } else {
      // 30% - Pending resident evaluation (just created)
      // Leave everything null - just initiated
    }
    
    const evaluation = {
      id: generateUUID(),
      resident_id: resident.id,
      faculty_id: faculty.id,
      epa_id: epa.id,
      domains: randomChoices(DOMAINS, Math.floor(Math.random() * 3) + 1),
      complexity: complexity,
      resident_entrustment_level: residentEntrustment,
      faculty_entrustment_level: facultyEntrustment,
      resident_comment: residentComment,
      faculty_comment: facultyComment,
      custom_case_text: Math.random() > 0.7 ? randomChoice(SAMPLE_CASES) : null,
      is_custom: Math.random() > 0.7,
      resident_completed_at: residentCompleted?.toISOString() || null,
      faculty_completed_at: facultyCompleted?.toISOString() || null,
      initiated_by: Math.random() > 0.5 ? resident.id : faculty.id,
      created_at: createdAt.toISOString(),
      updated_at: (facultyCompleted || residentCompleted || createdAt).toISOString()
    };
    
    evaluations.push(evaluation);
  }
  
  return evaluations;
}

// Generate the data
const dummyData = {
  residents: SAMPLE_RESIDENTS,
  faculty: SAMPLE_FACULTY,
  epas: SAMPLE_EPAS,
  evaluations: generateEvaluations(50)
};

// Output formatted data
console.log('=== DUMMY DATA FOR EPA EVALUATION APP ===\n');

console.log('-- SAMPLE RESIDENTS (add to user_profiles table) --');
dummyData.residents.forEach(resident => {
  console.log(`INSERT INTO user_profiles (id, email, first_name, last_name, role, pgy_year, created_at) VALUES`);
  console.log(`('${resident.id}', '${resident.first_name.toLowerCase()}.${resident.last_name.toLowerCase()}@hospital.edu', '${resident.first_name}', '${resident.last_name}', 'resident', ${resident.pgy_year}, NOW());`);
});

console.log('\n-- SAMPLE FACULTY (add to user_profiles table) --');
dummyData.faculty.forEach(faculty => {
  console.log(`INSERT INTO user_profiles (id, email, first_name, last_name, role, created_at) VALUES`);
  console.log(`('${faculty.id}', '${faculty.first_name.toLowerCase().replace('dr. ', '')}.${faculty.last_name.toLowerCase()}@hospital.edu', '${faculty.first_name}', '${faculty.last_name}', 'faculty', NOW());`);
});

console.log('\n-- SAMPLE EVALUATIONS --');
dummyData.evaluations.forEach(eval => {
  const domains = eval.domains.map(d => `"${d}"`).join(',');
  console.log(`INSERT INTO evaluations (id, resident_id, faculty_id, epa_id, domains, complexity, resident_entrustment_level, faculty_entrustment_level, resident_comment, faculty_comment, custom_case_text, is_custom, resident_completed_at, faculty_completed_at, initiated_by, created_at, updated_at) VALUES`);
  console.log(`('${eval.id}', '${eval.resident_id}', '${eval.faculty_id}', (SELECT id FROM epas WHERE code = '${dummyData.epas.find(e => e.id === eval.epa_id)?.code}'), '{${domains}}', '${eval.complexity}', ${eval.resident_entrustment_level ? `'${eval.resident_entrustment_level}'` : 'NULL'}, ${eval.faculty_entrustment_level ? `'${eval.faculty_entrustment_level}'` : 'NULL'}, ${eval.resident_comment ? `'${eval.resident_comment.replace(/'/g, "''")}'` : 'NULL'}, ${eval.faculty_comment ? `'${eval.faculty_comment.replace(/'/g, "''")}'` : 'NULL'}, ${eval.custom_case_text ? `'${eval.custom_case_text.replace(/'/g, "''")}'` : 'NULL'}, ${eval.is_custom}, ${eval.resident_completed_at ? `'${eval.resident_completed_at}'` : 'NULL'}, ${eval.faculty_completed_at ? `'${eval.faculty_completed_at}'` : 'NULL'}, '${eval.initiated_by}', '${eval.created_at}', '${eval.updated_at}');`);
});

console.log('\n=== SUMMARY ===');
console.log(`Generated ${dummyData.residents.length} residents`);
console.log(`Generated ${dummyData.faculty.length} faculty members`);
console.log(`Generated ${dummyData.evaluations.length} evaluations:`);

const completed = dummyData.evaluations.filter(e => e.resident_completed_at && e.faculty_completed_at).length;
const pendingFaculty = dummyData.evaluations.filter(e => e.resident_completed_at && !e.faculty_completed_at).length;
const pendingResident = dummyData.evaluations.filter(e => !e.resident_completed_at).length;

console.log(`  - ${completed} completed evaluations`);
console.log(`  - ${pendingFaculty} pending faculty review`);
console.log(`  - ${pendingResident} pending resident completion`);

console.log('\n=== USAGE ===');
console.log('Copy and paste the SQL statements above into your Supabase SQL editor');
console.log('Make sure to run them in order: residents, faculty, then evaluations');
console.log('You may need to adjust institution_id values to match your setup');
