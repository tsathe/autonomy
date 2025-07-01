// Comprehensive database diagnosis
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnoseDatabaseIssues() {
  console.log('🔍 DIAGNOSING DATABASE ISSUES...\n');

  // ========== ISSUE #1: Check Table Structure ==========
  console.log('1️⃣ CHECKING TABLE STRUCTURE...');
  try {
    // Check if profiles table exists and its structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles table issue:', profilesError.message);
      if (profilesError.code === '42P01') {
        console.log('💡 SOLUTION: Profiles table does not exist. Run schema deployment.');
      }
    } else {
      console.log('✅ Profiles table exists and accessible');
    }

    // Check institutions table
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('*');

    if (instError) {
      console.log('❌ Institutions table issue:', instError.message);
    } else {
      console.log('✅ Institutions table exists:', institutions.length, 'records');
      if (institutions.length === 0) {
        console.log('⚠️  WARNING: No institutions exist!');
      }
    }
  } catch (error) {
    console.log('❌ Table structure check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // ========== ISSUE #2: Check Custom Types ==========
  console.log('2️⃣ CHECKING CUSTOM ENUM TYPES...');
  try {
    // Try to insert a test record to see data type issues
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error: typeError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'resident', // This will fail if user_role enum doesn't exist
        institution_id: '00000000-0000-0000-0000-000000000001'
      });

    if (typeError) {
      console.log('❌ Data type issue:', typeError.message);
      if (typeError.message.includes('user_role')) {
        console.log('💡 SOLUTION: user_role enum type not created properly');
      }
    } else {
      console.log('✅ Data types are working (cleaning up test record...)');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
  } catch (error) {
    console.log('❌ Type check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // ========== ISSUE #3: Check RLS Policies ==========
  console.log('3️⃣ CHECKING ROW LEVEL SECURITY...');
  try {
    // This will show if RLS is blocking operations
    const { data: rlsTest, error: rlsError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (rlsError && rlsError.message.includes('policy')) {
      console.log('❌ RLS blocking operations:', rlsError.message);
      console.log('💡 SOLUTION: RLS policies too restrictive for user creation');
    } else {
      console.log('✅ RLS policies allow read access');
    }
  } catch (error) {
    console.log('❌ RLS check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // ========== ISSUE #4: Check Trigger Function ==========
  console.log('4️⃣ CHECKING TRIGGER FUNCTION...');
  try {
    // We can't directly call the trigger, but we can check if it exists
    console.log('⚠️  Trigger function check requires SQL access');
    console.log('💡 Run this in Supabase SQL Editor:');
    console.log('   SELECT proname FROM pg_proc WHERE proname = \'handle_new_user\';');
  } catch (error) {
    console.log('❌ Trigger check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // ========== ISSUE #5: Check Foreign Keys ==========
  console.log('5️⃣ CHECKING FOREIGN KEY CONSTRAINTS...');
  try {
    const { data: institutions } = await supabase
      .from('institutions')
      .select('id, name');

    console.log('📋 Available Institution IDs:');
    institutions?.forEach(inst => {
      console.log(`   ${inst.id} - ${inst.name}`);
    });

    if (!institutions || institutions.length === 0) {
      console.log('❌ NO INSTITUTIONS FOUND!');
      console.log('💡 SOLUTION: Create an institution first');
    }
  } catch (error) {
    console.log('❌ Foreign key check failed:', error.message);
  }

  console.log('\n🎯 DIAGNOSIS COMPLETE!\n');
}

diagnoseDatabaseIssues();
