//import { useMinioClient } from '~/server/utils/minioClient'

export default defineEventHandler(async (event) => {
  const client = useMinioClient()
  const query = getQuery(event)
  const bucketName = query.bucket as string

  if (!bucketName) throw createError({ statusCode: 400, message: 'Bucket required' })

  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) throw createError({ statusCode: 400, message: 'No file' })

  // วนลูปอัปโหลดทุกไฟล์ที่ส่งมา
  const uploadPromises = files.map(async (file) => {
    // ใช้ filename จาก header (ซึ่ง Frontend ส่ง path มาด้วย)
    const objectName = file.filename || `unknown-${Date.now()}`
    
    return client.putObject(bucketName, objectName, file.data, file.data.length, {
        'Content-Type': file.type
    })
  })

  try {
      await Promise.all(uploadPromises)
      return { success: true }
  } catch (error) {
      throw createError({ statusCode: 500, message: (error as any).message })
  }
})