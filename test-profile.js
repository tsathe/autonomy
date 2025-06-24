const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProfile() {
  console.log('Testing user profile retrieval...')
  
  try {
    // First, sign in to get a session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('Auth error:', authError)
      return
    }
    
    console.log('Signed in successfully')
    
    // Now try to get the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    console.log('Profile query result:', { profileData, profileError })
    
    if (profileError) {
      console.error('Profile retrieval failed:', profileError.message)
    } else {
      console.log('Profile retrieved successfully:', profileData)
    }
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

testProfile()
