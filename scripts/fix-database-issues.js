// Fix the identified database issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixDatabaseIssues() {
  console.log('🔧 FIXING DATABASE ISSUES...\n');

  try {
    // Fix Issue #1: Create an institution
    console.log('1️⃣ Creating default institution...');
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .insert({ name: 'Test Medical Center' })
      .select()
      .single();

    if (instError && instError.code !== '23505') { // Ignore duplicate error
      console.log('❌ Failed to create institution:', instError.message);
    } else {
      console.log('✅ Institution created/exists:', institution?.id || 'existing');
    }

    // Get the institution ID for testing
    const { data: institutions } = await supabase
      .from('institutions')
      .select('*')
      .limit(1);

    if (institutions && institutions.length > 0) {
      console.log('✅ Institution ID to use for signup:', institutions[0].id);
      console.log('📋 Institution Name:', institutions[0].name);
    }

    console.log('\n🎯 FIXES APPLIED!');
    console.log('\n📧 Try creating users with these credentials:');
    console.log('Institution ID:', institutions?.[0]?.id);
    console.log('Faculty: faculty@autonomy.test / TestFaculty123!');
    console.log('Resident: resident@autonomy.test / TestResident123!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixDatabaseIssues();
