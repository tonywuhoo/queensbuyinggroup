import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log("Checking profiles...");
  
  const profiles = await db.profile.findMany();
  console.log("All profiles:", profiles);
  
  const adminProfile = await db.profile.findFirst({
    where: { email: 'tonywucollege@gmail.com' }
  });
  
  if (adminProfile) {
    console.log("\n✅ Admin profile found:");
    console.log("  ID:", adminProfile.id);
    console.log("  Email:", adminProfile.email);
    console.log("  Role:", adminProfile.role);
    console.log("  AuthId:", adminProfile.authId);
  } else {
    console.log("\n❌ No profile found for tonywucollege@gmail.com");
  }
  
  await db.$disconnect();
}

main().catch(console.error);
