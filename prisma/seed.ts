import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Setup Roles
  const roles = [
    { RoleId: 1, RoleName: 'ADMIN', RoleDescription: 'Administrator Sistem' },
    { RoleId: 2, RoleName: 'DISTRIBUTOR', RoleDescription: 'Distributor Pupuk' },
    { RoleId: 3, RoleName: 'PENGECER', RoleDescription: 'Pengecer Pupuk' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { RoleId: role.RoleId },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded.');

  // 2. Setup Kode Pos
  const kodePosData = {
    KodePosId: '12345',
    KelurahanDesa: 'Desa Tani',
    Kecamatan: 'Kecamatan Subur',
    KabupatenKota: 'Kota Panen',
    Provinsi: 'Provinsi Agro',
  };

  await prisma.kodePos.upsert({
    where: { KodePosId: kodePosData.KodePosId },
    update: {},
    create: kodePosData,
  });
  console.log('Kode Pos seeded.');

  // 3. Setup Pupuk
  const pupukTypes = ['Urea', 'NPK', 'ZA', 'SP-36'];
  for (let i = 0; i < pupukTypes.length; i++) {
    const existingPupuk = await prisma.pupuk.findFirst({
      where: { JenisPupuk: pupukTypes[i] }
    });
    
    if (!existingPupuk) {
      await prisma.pupuk.create({
        data: { PupukId: Math.floor(Math.random() * 1000) + 10, JenisPupuk: pupukTypes[i] },
      });
    }
  }
  console.log('Pupuk seeded.');

  // 4. Create Users (Distributor & Pengecer)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const distributor = await prisma.user.upsert({
    where: { Email: 'distributor@agriflow.com' },
    update: {},
    create: {
      UserId: 100001,
      FirstName: 'Budi',
      LastName: 'Distributor',
      Email: 'distributor@agriflow.com',
      HashedPassword: hashedPassword,
      Status: 'Active',
      RoleId: 2, // DISTRIBUTOR
    },
  });

  const pengecer = await prisma.user.upsert({
    where: { Email: 'pengecer@agriflow.com' },
    update: {},
    create: {
      UserId: 200001,
      FirstName: 'Andi',
      LastName: 'Pengecer',
      Email: 'pengecer@agriflow.com',
      HashedPassword: hashedPassword,
      Status: 'Active',
      RoleId: 3, // PENGECER
    },
  });
  console.log('Users seeded.');

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
