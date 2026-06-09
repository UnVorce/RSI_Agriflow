const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const roles = await prisma.role.findMany();
  console.log('Roles in DB:', roles);
}

run().finally(() => prisma.$disconnect());
