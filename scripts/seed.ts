import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are not set. Make sure you have a .env.local file.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedDatabase() {
  console.log('Starting database seed...');

  // 1. Create or get an Institution
  console.log('Upserting institution...');
  let institutionId;
  const institutionName = 'Windsurf Medical Center';

  const { data: existingInstitution } = await supabaseAdmin
    .from('institutions')
    .select('id')
    .eq('name', institutionName)
    .single();

  if (existingInstitution) {
    institutionId = existingInstitution.id;
    console.log(`Institution '${institutionName}' already exists with ID: ${institutionId}`);
  } else {
    const { data: newInstitution, error: institutionError } = await supabaseAdmin
      .from('institutions')
      .insert({ name: institutionName })
      .select()
      .single();

    if (institutionError || !newInstitution) {
      console.error('Error creating institution:', institutionError?.message);
      return;
    }
    institutionId = newInstitution.id;
    console.log(`Institution '${institutionName}' created with ID: ${institutionId}`);
  }

  const usersToCreate = [
    {
      email: 'admin@windsurfmed.com',
      password: 'SecurePassword123!',
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        institution_id: institutionId,
      },
    },
    {
      email: 'faculty@windsurfmed.com',
      password: 'SecurePassword123!',
      user_metadata: {
        first_name: 'Faculty',
        last_name: 'User',
        role: 'faculty',
        department: 'General Surgery',
        institution_id: institutionId,
      },
    },
    {
      email: 'resident@windsurfmed.com',
      password: 'SecurePassword123!',
      user_metadata: {
        first_name: 'Resident',
        last_name: 'User',
        role: 'resident',
        pgy_year: 2, // Including PGY year as requested
        institution_id: institutionId,
      },
    },
  ];

  for (const userData of usersToCreate) {
    console.log(`Processing user: ${userData.email}`);

    // Check if auth user exists
    const { data: { users: userList }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error(`Error listing users:`, listError.message);
      continue;
    }
    const existingAuthUser = userList.find(u => u.email === userData.email);

    if (existingAuthUser) {
      console.log(`Auth user ${userData.email} already exists. Skipping creation.`);
      continue;
    }

    // Create the user. The DB trigger will create the profile.
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for simplicity
      user_metadata: userData.user_metadata,
    });

    if (authError || !data.user) {
      console.error(`Error creating auth user ${userData.email}:`, authError?.message);
    } else {
      console.log(`Successfully created user and profile for ${userData.email}`);
    }
  }

  console.log('\nDatabase seed complete!');
  console.log('You can now log in with the following credentials:');
  console.log('---');
  usersToCreate.forEach(u => {
    console.log(`Role:     ${u.user_metadata.role}`);
    console.log(`Email:    ${u.email}`);
    console.log(`Password: ${u.password}`);
    console.log('---');
  });
}

seedDatabase().catch(console.error);
