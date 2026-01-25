/**
 * Create Admin User Script
 * 
 * Usage:
 *   npx ts-node scripts/create-admin.ts <email> <password> <firstName> <lastName>
 * 
 * Example:
 *   npx ts-node scripts/create-admin.ts admin@example.com SecurePass123! John Doe
 * 
 * On Railway/Production:
 *   railway run npx ts-node scripts/create-admin.ts admin@example.com SecurePass123! John Doe
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role key for admin operations

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error('❌ Usage: npx ts-node scripts/create-admin.ts <email> <password> <firstName> <lastName>');
    console.error('   Example: npx ts-node scripts/create-admin.ts admin@example.com SecurePass123! John Doe');
    process.exit(1);
  }

  const [email, password, firstName, lastName] = args;

  // Validate inputs
  if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('🚀 Creating admin user...');
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${firstName} ${lastName}`);

  // Check for required env vars
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Initialize Supabase with service role key (admin access)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Initialize Prisma
  const prisma = new PrismaClient();

  try {
    // 1. Create user in Supabase Auth
    console.log('📧 Creating Supabase auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'ADMIN',
      }
    });

    if (authError) {
      throw new Error(`Supabase auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // 2. Create profile in database
    console.log('👤 Creating database profile...');
    const profile = await prisma.profile.create({
      data: {
        authId: authData.user.id,
        email,
        firstName,
        lastName,
        role: 'ADMIN',
      }
    });

    console.log(`✅ Profile created: ${profile.id}`);
    console.log(`✅ Vendor ID: U-${String(profile.vendorNumber).padStart(5, '0')}`);

    console.log('\n🎉 Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ADMIN`);
    console.log(`   Vendor ID: U-${String(profile.vendorNumber).padStart(5, '0')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
