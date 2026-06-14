import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding akun pemerintah...')

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin123', 10)

  // Cari RoleId Pemerintah
  const role = await prisma.$queryRawUnsafe<{ RoleId: number }[]>(
    `SELECT RoleId FROM ref.ROLE WHERE RoleName = 'Pemerintah'`
  )

  if (!role || role.length === 0) {
    console.error('Role Pemerintah tidak ditemukan!')
    process.exit(1)
  }

  const roleId = role[0].RoleId
  console.log('RoleId Pemerintah:', roleId)

  // Insert akun pemerintah
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT 1 FROM master.[USER] WHERE Email = 'government@agriflow.com')
    BEGIN
      INSERT INTO master.[USER] (UserId, FirstName, Email, HashedPassword, Status, RoleId, CreatedAt, UpdatedAt)
      VALUES (
        '1',
        'Admin Pemerintah',
        'government@agriflow.com',
        '${hashedPassword.replace(/'/g, "''")}',
        'Active',
        ${roleId},
        GETDATE(),
        GETDATE()
      )
      PRINT 'Akun pemerintah berhasil dibuat'
    END
    ELSE
    BEGIN
      PRINT 'Akun pemerintah sudah ada'
    END
  `)

  // Verifikasi
  const user = await prisma.$queryRawUnsafe<{ UserId: string; Email: string; Status: string }[]>(
    `SELECT UserId, Email, Status FROM master.[USER] WHERE Email = 'government@agriflow.com'`
  )
  
  console.log('✅ Akun pemerintah:', user[0])
  console.log('Email: government@agriflow.com')
  console.log('Password: Admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
