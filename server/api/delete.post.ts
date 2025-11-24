export default defineEventHandler(async (event) => {
    const client = useMinioClient()
    const body = await readBody(event)
    const { filename, bucketName } = body
  
    if (!filename || !bucketName) throw createError({ statusCode: 400, message: 'Missing info' })
  
    try {
      await client.removeObject(bucketName, filename)
      return { success: true }
    } catch (error) {
      throw createError({ statusCode: 500, message: (error as any).message })
    }
  })