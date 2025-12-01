import fs from 'node:fs'

// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@sidebase/nuxt-auth'],

  auth: {
    isEnabled: true,
    provider: { type: 'authjs' },
    globalAppMiddleware: true,
  },

  runtimeConfig: {
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY || fs.readFileSync('./secret', 'utf-8'),
    jwtPublicKey: process.env.JWT_PUBLIC_KEY || fs.readFileSync('./secret.pub.pem', 'utf-8'),
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioPort: process.env.MINIO_PORT,
    minioAccessKey: process.env.MINIO_ACCESS_KEY,
    minioSecretKey: process.env.MINIO_SECRET_KEY,
    minioBucket: process.env.MINIO_BUCKET,
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    elasticsearchEndpoint: process.env.ELASTICSEARCH_ENDPOINT,

    authSecret: process.env.AUTH_SECRET,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    keycloakIssuer: process.env.KEYCLOAK_ISSUER,

    public: {
      keycloakIssuer: process.env.KEYCLOAK_ISSUER
    }
  }
})