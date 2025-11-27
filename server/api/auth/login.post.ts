import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = useRuntimeConfig()

    // 1. ค้นหา User จาก Database (Prisma)
    const user = await prisma.user.findUnique({
        where: { username: body.username }
    })

    if (!user) {
        throw createError({ statusCode: 401, message: 'User not found' })
    }

    // 2. ตรวจสอบรหัสผ่าน (Bcrypt)
    const isMatch = await bcrypt.compare(body.password, user.passwordHash)

    if (!isMatch) {
        throw createError({ statusCode: 401, message: 'Wrong password' })
    }

    // 3. สร้าง JWT ด้วย Private Key (RSA)
    const payload = { id: user.id, username: user.username, role: user.role }

    // ใช้ config.jwtPrivateKey ที่เราอ่านมาจากไฟล์ 'secret'
    const token = jwt.sign(payload, config.jwtPrivateKey, {
        algorithm: 'RS256',
        expiresIn: '1d'
    })

    // 4. ฝัง Cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: false, // Changed to false to allow client-side middleware to read it
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // ปรับเป็น lax เพื่อความชัวร์ในการ redirect
        maxAge: 60 * 60 * 24
    })

    return { success: true, user: { username: user.username } }
})