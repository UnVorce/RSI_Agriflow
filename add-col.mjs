import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "sqlserver://localhost:1433;database=AgriFlowDB;integratedSecurity=true;trustServerCertificate=true;connection_limit=20"
    }
  }
});

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE [master].[PETANI] ADD [KodePosId] INT NULL;`);
    console.log("Kolom KodePosId berhasil ditambahkan!");
  } catch (e) {
    console.error("Gagal menambahkan kolom:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
