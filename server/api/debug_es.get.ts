export default defineEventHandler(async (event) => {
    const es = useEsClient()
    try {
        const health = await es.cluster.health()
        const indexExists = await es.indices.exists({ index: 'files' })
        let count = 0
        let pipeline = null

        if (indexExists) {
            const countResult = await es.count({ index: 'files' })
            count = countResult.count
        }

        try {
            pipeline = await es.ingest.getPipeline({ id: 'attachment' })
        } catch (e) {
            pipeline = 'Not found'
        }

        return {
            status: 'ok',
            health: health.status,
            index_files_exists: indexExists,
            document_count: count,
            pipeline_attachment: pipeline ? 'Exists' : 'Missing',
            elasticsearch_endpoint: useRuntimeConfig().elasticsearchEndpoint
        }
    } catch (error: any) {
        return {
            status: 'error',
            message: error.message,
            details: error.meta ? error.meta.body : error
        }
    }
})
