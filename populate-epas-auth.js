const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// American Board of Surgery EPAs (18 total)
const surgicalEPAs = [
  {
    code: 'EPA-1',
    title: 'Evaluate and manage of a patient with abdominal wall hernia',
    description: 'Assessment and surgical management of various abdominal wall hernias'
  },
  {
    code: 'EPA-2', 
    title: 'Evaluate and manage of a patient with the acute abdomen',
    description: 'Diagnosis and management of patients presenting with acute abdominal pain'
  },
  {
    code: 'EPA-3',
    title: 'Evaluate and manage of a patient with benign anorectal disease',
    description: 'Assessment and treatment of common anorectal conditions'
  },
  {
    code: 'EPA-4',
    title: 'Evaluate a patient with right lower quadrant pain and manage appendicitis',
    description: 'Diagnosis and surgical management of appendicitis and related conditions'
  },
  {
    code: 'EPA-5',
    title: 'Evaluate and manage of a patient with benign or malignant breast disease',
    description: 'Comprehensive assessment and management of breast pathology'
  },
  {
    code: 'EPA-6',
    title: 'Evaluate and manage of a patient with benign or malignant colon disease',
    description: 'Assessment and surgical management of colorectal conditions'
  },
  {
    code: 'EPA-7',
    title: 'Provide surgical consultation to other health care providers',
    description: 'Effective communication and consultation with healthcare team members'
  },
  {
    code: 'EPA-8',
    title: 'Perioperative care of the critically ill surgery patient (includes sepsis and hemorrhage)',
    description: 'Management of critically ill surgical patients throughout perioperative period'
  },
  {
    code: 'EPA-9',
    title: 'Flexible GI endoscopy',
    description: 'Performance and interpretation of flexible endoscopic procedures'
  },
  {
    code: 'EPA-10',
    title: 'Evaluate and manage a patient with gallbladder disease',
    description: 'Assessment and surgical management of gallbladder and biliary conditions'
  },
  {
    code: 'EPA-11',
    title: 'Evaluate and manage of a patient with an inguinal hernia',
    description: 'Diagnosis and surgical repair of inguinal hernias'
  },
  {
    code: 'EPA-12',
    title: 'Evaluate and manage of a patient with cutaneous and subcutaneous neoplasms',
    description: 'Assessment and surgical management of skin and soft tissue tumors'
  },
  {
    code: 'EPA-13',
    title: 'Evaluate and manage of a patient with severe acute or necrotizing pancreatitis',
    description: 'Management of complex pancreatic inflammatory conditions'
  },
  {
    code: 'EPA-14',
    title: 'Evaluate and manage of a patient needing renal replacement therapy',
    description: 'Assessment and management of patients requiring dialysis access'
  },
  {
    code: 'EPA-15',
    title: 'Evaluate and manage of a patient with small bowel obstruction',
    description: 'Diagnosis and management of intestinal obstruction'
  },
  {
    code: 'EPA-16',
    title: 'Evaluate and manage of a patient with soft tissue infection (including NSTI)',
    description: 'Assessment and surgical management of soft tissue infections'
  },
  {
    code: 'EPA-17',
    title: 'Evaluate and manage of a patient with thyroid and parathyroid disease',
    description: 'Assessment and surgical management of endocrine neck disorders'
  },
  {
    code: 'EPA-18',
    title: 'Evaluation and initial management of a patient presenting with blunt or penetrating trauma',
    description: 'Initial assessment and management of trauma patients'
  }
]

async function populateEPAs() {
  console.log('Populating EPAs...')
  
  try {
    // Sign in first to bypass RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('Auth error:', authError.message)
      return
    }
    
    console.log('✅ Authenticated successfully')
    
    // Check if EPAs already exist
    const { data: existing } = await supabase
      .from('epas')
      .select('code')
    
    if (existing && existing.length > 0) {
      console.log('EPAs already exist. Clearing first...')
      await supabase.from('epas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    
    // Insert EPAs
    const { data, error } = await supabase
      .from('epas')
      .insert(surgicalEPAs)
      .select()
    
    if (error) {
      console.error('Error inserting EPAs:', error)
      return
    }
    
    console.log(`✅ Successfully inserted ${data.length} EPAs`)
    
    // Show all EPAs
    console.log('\nAll EPAs:')
    data.forEach(epa => {
      console.log(`- ${epa.code}: ${epa.title}`)
    })
    
  } catch (err) {
    console.error('Error populating EPAs:', err)
  }
}

populateEPAs()
