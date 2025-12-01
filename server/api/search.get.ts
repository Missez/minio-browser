export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const q = query.q as string

    if (!q) {
        return []
    }

    const es = useEsClient()

    try {
        const result = await es.search({
            index: 'files',
            query: {
                multi_match: {
                    query: q,
                    fields: ['filename', 'attachment.content', 'attachment.title'],
                },
            },
            _source: ['filename', 'bucket', 'uploadedAt', 'contentType'],
            highlight: {
                fields: {
                    'attachment.content': {},
                    'filename': {}
                }
            }
        })

        return result.hits.hits.map((hit: any) => ({
            id: hit._id,
            ...hit._source,
            highlight: hit.highlight,
            score: hit._score,
        }))
    } catch (error: any) {
        // If index doesn't exist yet, return empty list
        if (error.meta && error.meta.body && error.meta.body.error && error.meta.body.error.type === 'index_not_found_exception') {
            return []
        }
        console.error('Search error:', error)
        throw createError({ statusCode: 500, message: 'Search failed' })
    }
})
