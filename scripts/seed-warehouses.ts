import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const warehouses = [
  {
    code: 'MA',
    name: 'Massachusetts',
    allowDropOff: true,
    allowShipping: false,
    isActive: true,
  },
  {
    code: 'NJ',
    name: 'New Jersey',
    allowDropOff: true,
    allowShipping: false,
    isActive: true,
  },
  {
    code: 'CT',
    name: 'Connecticut',
    allowDropOff: true,
    allowShipping: false,
    isActive: true,
  },
  {
    code: 'NY',
    name: 'New York',
    allowDropOff: true,
    allowShipping: false,
    isActive: true,
  },
  {
    code: 'DE',
    name: 'Delaware',
    allowDropOff: false,
    allowShipping: true,
    isActive: true,
  },
];

async function seedWarehouses() {
  console.log('Seeding warehouses...');
  
  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {
        name: wh.name,
        allowDropOff: wh.allowDropOff,
        allowShipping: wh.allowShipping,
        isActive: wh.isActive,
      },
      create: wh,
    });
    console.log(`  ✓ ${wh.code} - Drop-off: ${wh.allowDropOff}, Ship: ${wh.allowShipping}`);
  }
  
  console.log('Done!');
  await prisma.$disconnect();
}

seedWarehouses().catch((e) => {
  console.error(e);
  process.exit(1);
});
