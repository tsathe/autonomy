// Get institution ID from production database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getInstitutionId() {
  try {
    console.log('Fetching institutions...');
    
    const { data: institutions, error } = await supabase
      .from('institutions')
      .select('*');

    if (error) {
      console.error('Error fetching institutions:', error);
      return;
    }

    console.log('\n🏥 Available Institutions:');
    institutions.forEach(inst => {
      console.log(`📋 Name: ${inst.name}`);
      console.log(`🆔 ID: ${inst.id}`);
      console.log(`📅 Created: ${inst.created_at}`);
      console.log('---');
    });

    // Find Test Medical Center specifically
    const testCenter = institutions.find(inst => inst.name === 'Test Medical Center');
    if (testCenter) {
      console.log('\n✅ Use this Institution ID for signup:');
      console.log(`🎯 ${testCenter.id}`);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

getInstitutionId();
