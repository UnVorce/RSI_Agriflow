import prisma from './src/config/database';
async function main() {
  const users = await prisma.$queryRaw`SELECT TOP 5 UserId, Email, FirstName FROM master.[USER] WHERE RoleId = 3`;
  console.log('Pengecer Users:', users);
  await prisma.$disconnect();
}
main();
