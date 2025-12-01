export default defineEventHandler(async (event) => {
    const client = useMinioClient()
    const query = getQuery(event)
    const bucketName = query.bucket as string
    const filename = query.filename as string

    if (!bucketName || !filename) {
        throw createError({ statusCode: 400, message: 'Bucket and filename required' })
    }

    try {
        // Generate presigned URL for PUT request (valid for 15 minutes)
        const url = await client.presignedPutObject(bucketName, filename, 15 * 60)
        return { url }
    } catch (error: any) {
        throw createError({ statusCode: 500, message: error.message })
    }
})
