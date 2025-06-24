const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInstitutions() {
  console.log('Testing institutions...')
  
  try {
    // Check if there are any institutions
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('*')
    
    console.log('Institutions:', { institutions, instError })
    
    // Create a test institution if none exist
    if (!institutions || institutions.length === 0) {
      console.log('Creating test institution...')
      const { data: newInst, error: createError } = await supabase
        .from('institutions')
        .insert([{ name: 'Test Institution' }])
        .select()
        .single()
      
      console.log('Institution creation result:', { newInst, createError })
      
      if (newInst) {
        console.log('Test institution ID:', newInst.id)
      }
    }
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

testInstitutions()
