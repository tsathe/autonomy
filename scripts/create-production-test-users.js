// Create test users for production environment
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestUsers() {
  console.log('Creating test users...');

  // Test Faculty User
  const facultyUser = {
    email: 'faculty@autonomy.test',
    password: 'TestFaculty123!',
    email_confirm: true,
    user_metadata: {
      role: 'faculty',
      full_name: 'Dr. Sarah Johnson',
      institution: 'Test Medical Center'
    }
  };

  // Test Resident User  
  const residentUser = {
    email: 'resident@autonomy.test',
    password: 'TestResident123!',
    email_confirm: true,
    user_metadata: {
      role: 'resident',
      full_name: 'Dr. Michael Chen',
      institution: 'Test Medical Center'
    }
  };

  try {
    // Create Faculty User
    console.log('Creating faculty user...');
    const { data: facultyData, error: facultyError } = await supabase.auth.admin.createUser(facultyUser);
    
    if (facultyError) {
      console.error('Faculty user creation failed:', facultyError);
    } else {
      console.log('✅ Faculty user created successfully:', facultyData.user.email);
    }

    // Create Resident User
    console.log('Creating resident user...');
    const { data: residentData, error: residentError } = await supabase.auth.admin.createUser(residentUser);
    
    if (residentError) {
      console.error('Resident user creation failed:', residentError);
    } else {
      console.log('✅ Resident user created successfully:', residentData.user.email);
    }

    // Test database connection
    console.log('\nTesting database connection...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profileError) {
      console.error('Database connection failed:', profileError);
    } else {
      console.log('✅ Database connected. Found', profiles.length, 'profiles');
    }

    console.log('\n📧 Test User Credentials:');
    console.log('Faculty: faculty@autonomy.test / TestFaculty123!');
    console.log('Resident: resident@autonomy.test / TestResident123!');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUsers();
