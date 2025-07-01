// Fix foreign key constraints to point to profiles instead of user_profiles
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixForeignKeys() {
  console.log('🔧 FIXING FOREIGN KEY CONSTRAINTS...\n');

  const queries = [
    'ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_resident_id_fkey;',
    'ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_faculty_id_fkey;', 
    'ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_initiated_by_fkey;',
    'ALTER TABLE evaluations ADD CONSTRAINT evaluations_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE evaluations ADD CONSTRAINT evaluations_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE evaluations ADD CONSTRAINT evaluations_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES profiles(id) ON DELETE CASCADE;'
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`Executing query ${i + 1}/${queries.length}:`, query.substring(0, 50) + '...');
    
    const { error } = await supabase.rpc('execute_sql', { sql: query });
    
    if (error) {
      console.log('❌ Error:', error.message);
      // Try alternative method for DDL
      const { error: error2 } = await supabase
        .from('_supabase_admin')
        .select('*')
        .limit(0); // This won't work, but let's try direct SQL
        
      // If RPC doesn't work, we'll try a different approach
      console.log('Trying alternative approach...');
      try {
        // This might not work with the client, but worth trying
        const result = await supabase.auth.admin.sql(query);
        console.log('✅ Query executed successfully');
      } catch (err) {
        console.log('❌ Alternative approach failed:', err.message);
      }
    } else {
      console.log('✅ Query executed successfully');
    }
  }

  // Verify the constraints
  console.log('\n🔍 Verifying foreign key constraints...');
  const verifyQuery = `
    SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='evaluations';
  `;

  const { data: constraints, error: verifyError } = await supabase.rpc('execute_sql', { sql: verifyQuery });
  
  if (verifyError) {
    console.log('❌ Could not verify constraints:', verifyError.message);
  } else {
    console.log('✅ Current foreign key constraints:');
    console.log(constraints);
  }

  console.log('\n🔧 FOREIGN KEY FIX ATTEMPT COMPLETE!');
  console.log('\nNote: If the RPC method failed, you may need to run these SQL commands manually in the Supabase SQL editor.');
}

fixForeignKeys().catch(console.error);
