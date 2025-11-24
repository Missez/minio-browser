export default defineEventHandler(async (event) => {
    const client = useMinioClient()
    const body = await readBody(event)
    const bucketName = body.name?.toLowerCase() // Bucket ต้องตัวเล็กเสมอ
  
    if (!bucketName) throw createError({ statusCode: 400, message: 'Name required' })
  
    try {
      const exists = await client.bucketExists(bucketName)
      if (exists) throw createError({ statusCode: 409, message: 'Bucket exists' })
  
      await client.makeBucket(bucketName, 'us-east-1')
      return { success: true, name: bucketName }
    } catch (error) {
      throw createError({ statusCode: 500, message: (error as any).message })
    }
  })