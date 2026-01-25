/**
 * Database Seed Script
 * 
 * Seeds the database with initial data:
 * - Warehouses (MA, NJ, CT, DE)
 * - Sample deals
 * 
 * Usage:
 *   npx ts-node scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Seed Warehouses
  console.log('📦 Creating warehouses...');
  const warehouses = [
    { code: 'MA', name: 'Massachusetts Warehouse', state: 'MA' },
    { code: 'NJ', name: 'New Jersey Warehouse', state: 'NJ' },
    { code: 'CT', name: 'Connecticut Warehouse', state: 'CT' },
    { code: 'DE', name: 'Delaware Warehouse', state: 'DE' },
  ];

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {},
      create: wh,
    });
    console.log(`   ✅ ${wh.name}`);
  }

  console.log('\n🎉 Database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
