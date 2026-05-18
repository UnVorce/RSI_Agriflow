import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Roles
  console.log('📝 Seeding roles...');
  const roles = [
    { RoleName: 'PEMERINTAH', RoleDescription: 'Government official' },
    { RoleName: 'DISTRIBUTOR', RoleDescription: 'Fertilizer distributor' },
    { RoleName: 'PENGECER', RoleDescription: 'Fertilizer retailer' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { RoleName: role.RoleName },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles seeded');

  // Seed Fertilizer Types
  console.log('📝 Seeding fertilizer types...');
  const fertilizers = ['Urea', 'NPK', 'ZA', 'Organik', 'SP-36', 'KCl'];

  for (const fertilizer of fertilizers) {
    await prisma.pupuk.upsert({
      where: { JenisPupuk: fertilizer },
      update: {},
      create: { JenisPupuk: fertilizer },
    });
  }
  console.log('✅ Fertilizer types seeded');

  // Seed Sample KodePos
  console.log('📝 Seeding sample postal codes...');
  const postalCodes = [
    {
      KelurahanDesa: 'Kebayoran Baru',
      Kecamatan: 'Kebayoran Baru',
      KabupatenKota: 'Jakarta Selatan',
      Provinsi: 'DKI Jakarta',
    },
    {
      KelurahanDesa: 'Bandung Wetan',
      Kecamatan: 'Bandung Wetan',
      KabupatenKota: 'Bandung',
      Provinsi: 'Jawa Barat',
    },
    {
      KelurahanDesa: 'Tegalsari',
      Kecamatan: 'Tegalsari',
      KabupatenKota: 'Surabaya',
      Provinsi: 'Jawa Timur',
    },
  ];

  for (const postal of postalCodes) {
    await prisma.kodePos.create({
      data: postal,
    });
  }
  console.log('✅ Postal codes seeded');

  // Create a government user for testing
  console.log('📝 Creating sample government user...');
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const govRole = await prisma.role.findUnique({
    where: { RoleName: 'PEMERINTAH' },
  });

  if (govRole) {
    await prisma.user.upsert({
      where: { Email: 'government@agriflow.com' },
      update: {},
      create: {
        FirstName: 'Admin',
        LastName: 'Pemerintah',
        Email: 'government@agriflow.com',
        HashedPassword: hashedPassword,
        Status: 'Active',
        RoleId: govRole.RoleId,
      },
    });
    console.log('✅ Government user created');
    console.log('   Email: government@agriflow.com');
    console.log('   Password: password123');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
