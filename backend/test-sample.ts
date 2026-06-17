import prisma from './src/config/database';
async function main() {
  const petani = await prisma.$queryRaw`
    SELECT TOP 1 p.PetaniId, u.Email as PengecerEmail, u.FirstName as PengecerName 
    FROM master.PETANI p 
    JOIN master.[USER] u ON p.UserIdPengecer = u.UserId 
    WHERE u.RoleId = 3
  `;
  console.log('Sample Data:', petani);
  await prisma.$disconnect();
}
main();
