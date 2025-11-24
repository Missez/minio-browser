export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = useMinioClient()
  const query = getQuery(event)
  
  const bucketName = (query.bucket as string) || config.minioDefaultBucket
  const prefix = (query.prefix as string) || ''

  return new Promise((resolve, reject) => {
    client.bucketExists(bucketName).then(exists => {
        if (!exists) return resolve([]) 

        const objects: any[] = []
        // listObjectsV2(bucketName, prefix, recursive, startAfter)
        // recursive = false to show folders
        const stream = client.listObjectsV2(bucketName, prefix, false)

        stream.on('data', (obj) => objects.push(obj))
        stream.on('end', async () => {
          const processedObjects = await Promise.all(objects.map(async (obj) => {
             // If it's a file (has name), generate URL. If it's a folder (has prefix), just return it.
             if (obj.name) {
                 const url = await client.presignedGetObject(bucketName, obj.name, 24*60*60)
                 return { ...obj, url, isFile: true }
             } else if (obj.prefix) {
                 return { ...obj, name: obj.prefix, isFolder: true }
             }
             return obj
          }))
          resolve(processedObjects)
        })
        stream.on('error', (err) => reject(err))
    }).catch(err => reject(err))
  })
})