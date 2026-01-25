import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanData() {
  console.log('🧹 Cleaning database (keeping users)...\n');

  // Delete in order of dependencies
  
  // 1. Invoices
  const invoices = await prisma.invoice.deleteMany({});
  console.log(`✓ Deleted ${invoices.count} invoices`);

  // 2. Label Requests
  const labels = await prisma.labelRequest.deleteMany({});
  console.log(`✓ Deleted ${labels.count} label requests`);

  // 3. Tracking
  const tracking = await prisma.tracking.deleteMany({});
  console.log(`✓ Deleted ${tracking.count} tracking records`);

  // 4. Commitments
  const commitments = await prisma.commitment.deleteMany({});
  console.log(`✓ Deleted ${commitments.count} commitments`);

  // 5. Deals
  const deals = await prisma.deal.deleteMany({});
  console.log(`✓ Deleted ${deals.count} deals`);

  // Show what's left
  const users = await prisma.profile.count();
  const warehouses = await prisma.warehouse.count();
  
  console.log('\n📊 Remaining data:');
  console.log(`   - ${users} users (kept)`);
  console.log(`   - ${warehouses} warehouses (kept)`);

  console.log('\n✅ Clean slate ready!');
  
  await prisma.$disconnect();
}

cleanData().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
