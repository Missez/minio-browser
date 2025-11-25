import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { username, password } = body

    // TODO: Replace with actual user validation logic (e.g., database check)
    // For now, using hardcoded credentials for demonstration
    const validUsername = process.env.ADMIN_USERNAME || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || 'password'

    if (username === validUsername && password === validPassword) {
        const config = useRuntimeConfig()
        const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' })

        return { token }
    }

    throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
    })
})
