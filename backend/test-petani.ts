import prisma from './src/config/database';
async function main() {
  const farmers = await prisma.$queryRaw`SELECT TOP 5 PetaniId, UserIdPengecer FROM master.PETANI`;
  console.log('Farmers:', farmers);
  await prisma.$disconnect();
}
main();
