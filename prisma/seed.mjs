// prisma/seed.mjs
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = 'user'
  const password = 'fiew1234' // รหัสผ่านที่ต้องการ

  // 1. Hash รหัสผ่าน
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  // 2. สร้าง User หรือ Update ถ้ามีอยู่แล้ว
  const user = await prisma.user.upsert({
    where: { username: username },
    update: {},
    create: {
      username,
      passwordHash,
      role: 'user',
    },
  })

  console.log(`✅ Created user: ${user.username}`)
  console.log(`🔑 Password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })