import * as Minio from 'minio'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { bucketName } = body
    const config = useRuntimeConfig()

    const minioClient = new Minio.Client({
        endPoint: config.minioEndpoint,
        port: parseInt(config.minioPort),
        useSSL: false,
        accessKey: config.minioAccessKey,
        secretKey: config.minioSecretKey
    })

    try {
        await minioClient.removeBucket(bucketName)
        return { success: true }
    } catch (err) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete bucket. Ensure it is empty.'
        })
    }
})
