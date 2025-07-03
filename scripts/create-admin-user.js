const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin test account...')

    // Get the existing institution ID
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('id')
      .limit(1)

    if (instError) {
      console.error('❌ Error fetching institution:', instError)
      return
    }

    const institutionId = institutions[0]?.id

    if (!institutionId) {
      console.error('❌ No institution found. Please create an institution first.')
      return
    }

    // Admin user details
    const adminUser = {
      id: 'admin-test-001',
      email: 'admin@autonomy.edu',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      institution_id: institutionId,
      department: 'Administration',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert admin user into profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([adminUser])
      .select()

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@autonomy.edu')
    console.log('🔑 Password: Use sign-up to set password or sign in with magic link')
    console.log('👤 Role: Administrator')
    console.log('🏢 Institution ID:', institutionId)
    console.log('📊 Profile:', profile[0])

    // Also create an auth user for easier login
    console.log('\n🔐 Creating auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@autonomy.edu',
      password: 'AdminPass123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin'
      }
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      console.log('💡 You can still sign up manually with admin@autonomy.edu')
    } else {
      console.log('✅ Auth user created!')
      console.log('🔑 Login: admin@autonomy.edu / AdminPass123!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
createAdminUser()
