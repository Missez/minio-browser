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

export const setBucketNotification = async (bucketName: string, webhookEndpoint: string) => {
  const client = useMinioClient()
  // Note: This requires the 'arn:minio:sqs::_:webhook' configuration in MinIO server
  // Since we can't easily configure MinIO server from here, we assume the user has configured
  // a webhook target in MinIO with ARN 'arn:minio:sqs::_:webhook' pointing to our app.
  // OR we can try to use the client to set it if the library supports it, but minio-js 
  // support for setting bucket notification targets is limited/complex.

  // For simplicity in this demo, we will guide the user to configure it manually or 
  // assume a specific ARN is available.

  // However, a common pattern is to use `client.setBucketNotification`.
  // But first we need to know the ARN.

  // Let's just export the client for now and handle notification setup in a separate script or manual step
  // as it depends heavily on MinIO server config (mc admin config set).
}