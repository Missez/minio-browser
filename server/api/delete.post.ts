export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = useMinioClient()
  const body = await readBody(event)
  
  const bucketName = body.bucketName || config.minioDefaultBucket
  // Support both single 'filename' and array 'filenames'
  const filenames = body.filenames || (body.filename ? [body.filename] : [])

  if (filenames.length === 0) {
      return { message: 'No files to delete' }
  }

  try {
    const objectsToDelete: string[] = []

    for (const name of filenames) {
        if (name.endsWith('/')) {
            // It's a folder, list all objects recursively
            const stream = client.listObjects(bucketName, name, true)
            for await (const obj of stream) {
                if (obj.name) objectsToDelete.push(obj.name)
            }
        } else {
            objectsToDelete.push(name)
        }
    }

    if (objectsToDelete.length > 0) {
        await client.removeObjects(bucketName, objectsToDelete)
    }
    
    return { message: 'Deleted successfully' }
  } catch (error) {
    throw createError({ statusCode: 500, message: (error as any).message })
  }
})