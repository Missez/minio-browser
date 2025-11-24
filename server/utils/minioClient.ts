import { Client } from 'minio'

let minioClient: Client | null = null

export const useMinioClient = () => {
  const config = useRuntimeConfig()

  if (!minioClient) {
    minioClient = new Client({
      endPoint: config.minioEndpoint,
      port: parseInt(config.minioPort),
      useSSL: false, // Docker local ปกติไม่ใช้ SSL
      accessKey: config.minioAccessKey,
      secretKey: config.minioSecretKey,
    })
  }
  return minioClient
}