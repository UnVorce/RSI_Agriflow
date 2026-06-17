import prisma from './src/config/database';
async function main() {
  await prisma.$executeRawUnsafe("UPDATE master.PETANI SET UserIdPengecer = 1 WHERE PetaniId IN ('0000897634919051', '0001121246472000')");
  console.log('Updated petani to UserIdPengecer = 1');
  await prisma.$disconnect();
}
main();
