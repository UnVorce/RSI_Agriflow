import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.$queryRawUnsafe<any[]>('SELECT TOP 5 UserId, Email, HashedPassword FROM master.[USER] ORDER BY UserId ASC');
    console.log('Top 5 users:', users);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
