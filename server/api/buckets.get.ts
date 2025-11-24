export default defineEventHandler(async (event) => {
    try {
      const client = useMinioClient()
      return await client.listBuckets()
    } catch (error) {
      throw createError({ statusCode: 500, message: (error as any).message })
    }
  })