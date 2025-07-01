// Comprehensive authentication and user management diagnosis
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function comprehensiveAuthDiagnosis() {
  console.log('🔍 COMPREHENSIVE USER MANAGEMENT DIAGNOSIS\n');
  console.log('='.repeat(60));

  // Test 1: Check database connectivity
  console.log('\n1️⃣ DATABASE CONNECTIVITY TEST');
  try {
    const { data, error } = await supabase.from('institutions').select('count').single();
    if (error) {
      console.log('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
  }

  // Test 2: Check table structure and data
  console.log('\n2️⃣ TABLE STRUCTURE AND DATA');
  
  // Check institutions
  try {
    const { data: institutions, error } = await supabase
      .from('institutions')
      .select('*');
    
    if (error) {
      console.log('❌ Institutions table error:', error.message);
    } else {
      console.log('✅ Institutions table accessible');
      console.log('📊 Institution count:', institutions.length);
      if (institutions.length > 0) {
        console.log('🏥 Available institutions:');
        institutions.forEach(inst => {
          console.log(`   - ${inst.name} (ID: ${inst.id})`);
        });
      } else {
        console.log('⚠️  No institutions found - this will cause user creation to fail!');
      }
    }
  } catch (err) {
    console.log('❌ Institution check failed:', err.message);
  }

  // Check profiles table
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('count')
      .single();
    
    if (error) {
      console.log('❌ Profiles table error:', error.message);
    } else {
      console.log('✅ Profiles table accessible');
    }
  } catch (err) {
    console.log('❌ Profiles check failed:', err.message);
  }

  // Test 3: Check trigger function existence
  console.log('\n3️⃣ TRIGGER FUNCTION CHECK');
  try {
    // Try to query system tables to check if trigger exists
    const { data, error } = await supabaseAdmin.rpc('exec', {
      sql: `
        SELECT 
          proname as function_name,
          prosecdef as security_definer
        FROM pg_proc 
        WHERE proname = 'handle_new_user';
      `
    });
    
    if (error) {
      console.log('❌ Cannot check trigger function:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Trigger function exists:', data[0]);
    } else {
      console.log('❌ Trigger function NOT FOUND');
    }
  } catch (err) {
    console.log('⚠️  Cannot check trigger function (limited permissions)');
  }

  // Test 4: Manual user creation test (bypass trigger)
  console.log('\n4️⃣ MANUAL USER CREATION TEST');
  const testUserId = crypto.randomUUID();
  
  try {
    // Get an institution ID
    const { data: institutions } = await supabase
      .from('institutions')
      .select('id')
      .limit(1);
    
    if (!institutions || institutions.length === 0) {
      console.log('❌ Cannot test - no institutions available');
    } else {
      const institutionId = institutions[0].id;
      
      // Try manual profile creation
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          institution_id: institutionId,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'resident',
          pgy_year: 1,
          department: 'Test'
        });
      
      if (error) {
        console.log('❌ Manual profile creation failed:', error.message);
        if (error.message.includes('policy')) {
          console.log('💡 Issue: Row Level Security is blocking inserts');
        }
      } else {
        console.log('✅ Manual profile creation successful');
        // Clean up
        await supabase.from('profiles').delete().eq('id', testUserId);
        console.log('🧹 Test data cleaned up');
      }
    }
  } catch (err) {
    console.log('❌ Manual creation test failed:', err.message);
  }

  // Test 5: Check RLS policies
  console.log('\n5️⃣ ROW LEVEL SECURITY CHECK');
  try {
    // Test read access
    const { data: readTest, error: readError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (readError) {
      console.log('❌ RLS blocking reads:', readError.message);
    } else {
      console.log('✅ RLS allows reads');
    }
  } catch (err) {
    console.log('❌ RLS check failed:', err.message);
  }

  // Test 6: Environment variables check
  console.log('\n6️⃣ ENVIRONMENT VARIABLES CHECK');
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

  console.log('\n='.repeat(60));
  console.log('🎯 DIAGNOSIS COMPLETE');
  
  console.log('\n📋 RECOMMENDED SOLUTIONS:');
  console.log('1. If no institutions exist: Create one in Supabase dashboard');
  console.log('2. If trigger function missing: Redeploy schema.sql');
  console.log('3. If RLS blocking: Disable RLS on profiles table or fix policies');
  console.log('4. If service role key missing: Add to environment variables');
}

comprehensiveAuthDiagnosis().catch(console.error);
