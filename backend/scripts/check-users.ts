import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const count = await prisma.user.count();
    console.log('Total users in Prisma:', count);
    const users = await prisma.user.findMany({ select: { Email: true, HashedPassword: true } });
    console.log('Users:', users);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
