export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = useMinioClient()
  const query = getQuery(event)
  
  // รับชื่อ Bucket จาก Query หรือใช้ค่า Default
  const bucketName = (query.bucket as string) || config.minioDefaultBucket

  return new Promise((resolve, reject) => {
    client.bucketExists(bucketName).then(exists => {
        if (!exists) return resolve([]) 

        const objects: any[] = []
        const stream = client.listObjects(bucketName, '', true)

        stream.on('data', (obj) => objects.push(obj))
        stream.on('end', async () => {
          // สร้าง Presigned URL สำหรับดูรูป
          const objectsWithUrl = await Promise.all(objects.map(async (obj) => {
             const url = await client.presignedGetObject(bucketName, obj.name, 24*60*60)
             return { ...obj, url }
          }))
          resolve(objectsWithUrl)
        })
        stream.on('error', (err) => reject(err))
    }).catch(err => reject(err))
  })
})