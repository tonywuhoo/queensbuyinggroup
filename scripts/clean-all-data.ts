import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('🧹 Cleaning database (keeping users and warehouses)...\n');
  
  // Delete in order to respect foreign key constraints
  console.log('Deleting invoices...');
  const invoices = await prisma.invoice.deleteMany({});
  console.log(`  ✓ Deleted ${invoices.count} invoices`);
  
  console.log('Deleting tracking records...');
  const tracking = await prisma.tracking.deleteMany({});
  console.log(`  ✓ Deleted ${tracking.count} tracking records`);
  
  console.log('Deleting label requests...');
  const labels = await prisma.labelRequest.deleteMany({});
  console.log(`  ✓ Deleted ${labels.count} label requests`);
  
  console.log('Deleting commitments...');
  const commitments = await prisma.commitment.deleteMany({});
  console.log(`  ✓ Deleted ${commitments.count} commitments`);
  
  console.log('Deleting deals...');
  const deals = await prisma.deal.deleteMany({});
  console.log(`  ✓ Deleted ${deals.count} deals`);
  
  // Keep users and warehouses
  const users = await prisma.profile.count();
  const warehouses = await prisma.warehouse.count();
  
  console.log('\n✅ Database cleaned!');
  console.log(`   Kept ${users} users`);
  console.log(`   Kept ${warehouses} warehouses`);
  
  await prisma.$disconnect();
}

cleanData().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
