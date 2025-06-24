const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEPAs() {
  console.log('Checking EPA data...')
  
  try {
    const { data: epas, error } = await supabase
      .from('epas')
      .select('*')
      .order('code')
    
    console.log('EPAs found:', epas?.length || 0)
    
    if (epas && epas.length > 0) {
      console.log('Sample EPAs:')
      epas.slice(0, 5).forEach(epa => {
        console.log(`- ${epa.code}: ${epa.title}`)
        if (epa.description) console.log(`  ${epa.description}`)
      })
    } else {
      console.log('No EPAs found. Need to populate the database.')
    }
    
  } catch (err) {
    console.error('Error checking EPAs:', err)
  }
}

checkEPAs()
