/**
 * Promote existing user to Admin
 * Usage: npx tsx scripts/promote-admin.ts <email>
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function promoteAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Usage: npx tsx scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  console.log(`🔄 Promoting ${email} to admin...`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const prisma = new PrismaClient();

  try {
    // Find user in Supabase
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error(`User not found: ${email}`);
    }

    console.log(`✅ Found user: ${user.id}`);

    // Update user metadata to ADMIN
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'ADMIN',
      }
    });
    if (updateError) throw updateError;

    console.log('✅ Updated Supabase user metadata to ADMIN');

    // Create or update profile in database
    const profile = await prisma.profile.upsert({
      where: { authId: user.id },
      update: { role: 'ADMIN' },
      create: {
        authId: user.id,
        email: user.email!,
        firstName: user.user_metadata?.first_name || 'Admin',
        lastName: user.user_metadata?.last_name || 'User',
        role: 'ADMIN',
      }
    });

    console.log(`✅ Profile updated: ${profile.id}`);
    console.log(`✅ Vendor ID: U-${String(profile.vendorNumber).padStart(5, '0')}`);
    console.log('\n🎉 User promoted to admin successfully!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

promoteAdmin();
