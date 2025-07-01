import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Testing with client-side Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Anon key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  console.log('\n=== Testing Client-Side Sign Up ===');
  
  const testEmail = 'faculty-test@test.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'Faculty',
          role: 'faculty',
          department: 'General Surgery',
          institution_id: '472806c2-323b-411b-bc8b-2035c68bf127'
        }
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
    } else {
      console.log('✅ Sign up successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      
      console.log('\n=== Test Credentials ===');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function testSignIn() {
  console.log('\n=== Testing Existing User Sign In ===');
  
  // Try with the original faculty account
  const emails = [
    'faculty@test.com',
    'faculty@windsurfmed.com',
    'faculty-test@test.com'
  ];
  
  const passwords = [
    'TestPassword123!',
    'SecurePassword123!'
  ];
  
  for (const email of emails) {
    for (const password of passwords) {
      console.log(`Trying ${email} with ${password}...`);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!error && data.user) {
          console.log(`✅ SUCCESS! Login works with:`);
          console.log(`Email: ${email}`);
          console.log(`Password: ${password}`);
          console.log(`User ID: ${data.user.id}`);
          return;
        } else if (error) {
          console.log(`❌ Failed: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Error: ${err}`);
      }
    }
  }
  
  console.log('\n❌ No working credentials found');
}

async function runTests() {
  await testSignIn();
  await testSignUp();
}

runTests().catch(console.error);
