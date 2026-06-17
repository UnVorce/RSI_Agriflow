import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const BATCH_SIZE = 100
const CONCURRENCY = 20
const SALT_ROUNDS = 6

function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$')
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function processBatch(users: { UserId: number; Email: string; HashedPassword: string }[]): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  const processUser = async (user: { UserId: number; Email: string; HashedPassword: string }) => {
    try {
      const hashed = await hashPassword(user.HashedPassword)
      await prisma.$executeRawUnsafe(
        `UPDATE master.[USER] SET HashedPassword = '${hashed.replace(/'/g, "''")}', UpdatedAt = GETDATE() WHERE UserId = ${user.UserId}`
      )
      return { ok: true, email: user.Email }
    } catch (err) {
      return { ok: false, email: user.Email, error: String(err) }
    }
  }

  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const chunk = users.slice(i, i + CONCURRENCY)
    const results = await Promise.all(chunk.map(processUser))

    for (const r of results) {
      if (r.ok) {
        success++
      } else {
        failed++
        process.stdout.write(`  ✗ ${r.email} — ${(r as any).error}\n`)
      }
    }
  }

  return { success, failed }
}

async function main() {
  console.log('[hash-passwords] Loading users from DB...')

  const allUsers = await prisma.$queryRawUnsafe<
    { UserId: number; Email: string; HashedPassword: string }[]
  >(`SELECT UserId, Email, HashedPassword FROM master.[USER]`)

  const toProcess = allUsers.filter(u => u.HashedPassword && !isBcryptHash(u.HashedPassword))
  const total = toProcess.length

  console.log(`[hash-passwords] Found ${allUsers.length} total users, ${total} need hashing`)

  if (total === 0) {
    console.log('[hash-passwords] ✅ Nothing to do — all passwords already hashed.')
    await prisma.$disconnect()
    return
  }

  let totalSuccess = 0
  let totalFailed = 0

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(total / BATCH_SIZE)

    console.log(`[hash-passwords] Processing batch ${batchNum}/${totalBatches} (${batch.length} users)...`)

    const { success, failed } = await processBatch(batch)
    totalSuccess += success
    totalFailed += failed

    console.log(`[hash-passwords] Batch ${batchNum}/${totalBatches} complete (${totalSuccess}/${total} hashed)`)
  }

  console.log(`[hash-passwords] ✅ Done. ${totalSuccess} hashed, ${totalFailed} failed.`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('[hash-passwords] ❌ Fatal error:', err)
  process.exit(1)
})
