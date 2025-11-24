export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = useMinioClient()
  const body = await readBody(event)
  
  const bucketName = body.bucket || config.minioDefaultBucket
  const filename = body.filename

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }

  return new Promise((resolve, reject) => {
    // Generate a presigned URL valid for 7 days (604800 seconds)
    client.presignedGetObject(bucketName, filename, 7 * 24 * 60 * 60)
      .then(url => {
        resolve({ url })
      })
      .catch(err => {
        reject(createError({
          statusCode: 500,
          statusMessage: err.message
        }))
      })
  })
})
