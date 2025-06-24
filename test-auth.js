const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('Testing Supabase connection...')
  
  // Test sign up
  const testEmail = 'test@example.com'
  const testPassword = 'password123'
  
  try {
    console.log('Testing sign up...')
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'resident',
          institution_id: 'test-institution-id',
          pgy_year: 2
        }
      }
    })
    
    console.log('Sign up result:', { data, error })
    
    if (error) {
      console.error('Sign up failed:', error.message)
    } else {
      console.log('Sign up successful')
    }
    
  } catch (err) {
    console.error('Sign up error:', err)
  }
  
  // Test sign in
  try {
    console.log('\nTesting sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    console.log('Sign in result:', { data, error })
    
    if (error) {
      console.error('Sign in failed:', error.message)
    } else {
      console.log('Sign in successful')
    }
    
  } catch (err) {
    console.error('Sign in error:', err)
  }
}

testAuth()
