import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTracking() {
  console.log('Clearing tracking data...');
  
  const result = await prisma.tracking.deleteMany({});
  
  console.log(`Deleted ${result.count} tracking records`);
  
  await prisma.$disconnect();
}

clearTracking().catch((e) => {
  console.error(e);
  process.exit(1);
});
