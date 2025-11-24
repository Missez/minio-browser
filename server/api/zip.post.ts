import archiver from 'archiver'
import { PassThrough } from 'stream'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = useMinioClient()
  const body = await readBody(event)
  
  const bucketName = body.bucket || config.minioDefaultBucket
  const files = body.files as string[] // Array of full paths

  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files specified' })
  }

  // Set headers for zip download
  setResponseHeader(event, 'Content-Type', 'application/zip')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="download.zip"`)

  const archive = archiver('zip', { zlib: { level: 9 } })
  const passThrough = new PassThrough()

  // Pipe archive to response
  archive.pipe(passThrough)

  // Add files to archive
  for (const file of files) {
      try {
          if (file.endsWith('/')) {
              // Folder: list recursively
              const stream = client.listObjects(bucketName, file, true)
              for await (const obj of stream) {
                  if (obj.name) {
                      const fileStream = await client.getObject(bucketName, obj.name)
                      archive.append(fileStream, { name: obj.name })
                  }
              }
          } else {
              // File
              const stream = await client.getObject(bucketName, file)
              archive.append(stream, { name: file })
          }
      } catch (err) {
          console.error(`Failed to add ${file} to zip`, err)
      }
  }

  archive.finalize()

  return sendStream(event, passThrough)
})
