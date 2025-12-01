import { Client } from '@elastic/elasticsearch'

let esClient: Client | null = null

export const useEsClient = () => {
    const config = useRuntimeConfig()

    if (!esClient) {
        esClient = new Client({
            node: config.elasticsearchEndpoint,
        })
    }
    return esClient
}

export const initEsPipeline = async () => {
    const client = useEsClient()
    try {
        await client.ingest.getPipeline({ id: 'attachment' })
    } catch (error) {
        // If pipeline does not exist, create it
        console.log('Creating attachment pipeline...')
        await client.ingest.putPipeline({
            id: 'attachment',
            processors: [
                {
                    attachment: {
                        field: 'data',
                        properties: ['content', 'title'],
                    },
                },
                {
                    remove: {
                        field: 'data',
                    },
                },
            ],
        })
    }
}
