export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // MinIO sends a list of records
    if (!body || !body.Records) {
        return { status: 'ignored' }
    }

    const client = useMinioClient()
    const es = useEsClient()

    for (const record of body.Records) {
        const eventName = record.eventName
        // Only process object creation events
        if (!eventName.startsWith('s3:ObjectCreated:')) {
            continue
        }

        const bucketName = record.s3.bucket.name
        const objectName = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

        try {
            // Get object stream from MinIO
            const dataStream = await client.getObject(bucketName, objectName)

            // Convert stream to buffer (for attachment processor)
            const chunks: Buffer[] = []
            for await (const chunk of dataStream) {
                chunks.push(Buffer.from(chunk))
            }
            const buffer = Buffer.concat(chunks)
            const base64Content = buffer.toString('base64')

            // Index to Elasticsearch
            await initEsPipeline()
            await es.index({
                index: 'files',
                pipeline: 'attachment',
                document: {
                    filename: objectName,
                    bucket: bucketName,
                    contentType: record.s3.object.contentType || 'application/octet-stream',
                    data: base64Content,
                    uploadedAt: new Date(record.eventTime),
                }
            })

            console.log(`Indexed ${objectName} from bucket ${bucketName}`)

        } catch (error) {
            console.error(`Failed to index ${objectName}:`, error)
        }
    }

    return { status: 'processed' }
})
