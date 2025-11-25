// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioPort: process.env.MINIO_PORT,
    minioAccessKey: process.env.MINIO_ACCESS_KEY,
    minioSecretKey: process.env.MINIO_SECRET_KEY,
    minioBucket: process.env.MINIO_BUCKET,
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  }
})