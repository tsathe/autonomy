// Debug why we can't see existing institutions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugInstitutionAccess() {
  console.log('🔍 DEBUGGING INSTITUTION ACCESS ISSUE...\n');

  // Test with different connection methods
  const configs = [
    {
      name: 'Anon Key Client',
      client: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    }
  ];

  // Add service role if available
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    configs.push({
      name: 'Service Role Client',
      client: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    });
  }

  for (const config of configs) {
    console.log(`\n📡 Testing with ${config.name}:`);
    console.log('=' + '='.repeat(config.name.length + 15));

    try {
      // Test 1: Direct select
      console.log('1️⃣ Direct select from institutions...');
      const { data: institutions, error: selectError } = await config.client
        .from('institutions')
        .select('*');

      if (selectError) {
        console.log('❌ Select failed:', selectError.message);
        console.log('   Code:', selectError.code);
        console.log('   Details:', selectError.details);
      } else {
        console.log('✅ Select successful!');
        console.log('📊 Found institutions:', institutions.length);
        institutions.forEach((inst, i) => {
          console.log(`   ${i + 1}. ${inst.name} (ID: ${inst.id})`);
        });
      }

      // Test 2: Count query
      console.log('\n2️⃣ Count query...');
      const { count, error: countError } = await config.client
        .from('institutions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log('❌ Count failed:', countError.message);
      } else {
        console.log('✅ Count successful:', count);
      }

      // Test 3: Single row test
      console.log('\n3️⃣ Single row test...');
      const { data: singleInst, error: singleError } = await config.client
        .from('institutions')
        .select('*')
        .limit(1)
        .single();

      if (singleError) {
        console.log('❌ Single row failed:', singleError.message);
      } else {
        console.log('✅ Single row successful:', singleInst.name);
      }

    } catch (err) {
      console.log('❌ Connection test failed:', err.message);
    }
  }

  // Test 4: Environment variable validation
  console.log('\n🔧 ENVIRONMENT VALIDATION:');
  console.log('=' + '='.repeat(25));
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌');
  console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌');
  console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✅' : 'Missing ❌');

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  }

  console.log('\n🎯 DIAGNOSIS COMPLETE');
}

debugInstitutionAccess().catch(console.error);
