const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestProfile() {
  console.log('Creating profile for existing test user...')
  
  try {
    // First, let's check if we can sign in with the test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('Could not authenticate test user:', authError.message)
      return
    }
    
    console.log('✅ Test user authenticated. User ID:', authData.user.id)
    
    // Now manually create the profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user.id,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'resident',
          institution_id: '472806c2-323b-411b-bc8b-2035c68bf127',
          pgy_year: 2
        }
      ])
      .select()
      .single()
    
    console.log('Profile creation result:', { profileData, profileError })
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)
    } else {
      console.log('✅ Profile created successfully!', profileData)
    }
    
    // Test if we can retrieve the profile
    const { data: retrievedProfile, error: retrieveError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    console.log('Profile retrieval test:', { retrievedProfile, retrieveError })
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

createTestProfile()
