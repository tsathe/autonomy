const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNewSignup() {
  console.log('Testing new signup with fixed trigger...')
  
  const testEmail = 'newuser@example.com'
  const testPassword = 'password123'
  
  try {
    // Test sign up with a new user
    console.log('Testing sign up...')
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'New',
          last_name: 'User',
          role: 'resident',
          institution_id: '472806c2-323b-411b-bc8b-2035c68bf127', // Using the existing institution ID
          pgy_year: 3
        }
      }
    })
    
    console.log('Sign up result:', { data: data ? 'Success' : 'Failed', error })
    
    if (error) {
      console.error('Sign up failed:', error.message)
      return
    }
    
    console.log('Sign up successful! User ID:', data.user?.id)
    
    // Now check if profile was created
    console.log('Checking if profile was created...')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    console.log('Profile query result:', { profileData, profileError })
    
    if (profileError) {
      console.error('Profile not found:', profileError.message)
    } else {
      console.log('✅ Profile created successfully!', profileData)
    }
    
    // Test sign in
    console.log('\nTesting sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
    } else {
      console.log('✅ Sign in successful!')
    }
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

testNewSignup()
