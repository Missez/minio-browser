// server/api/auth/[...].ts
import { NuxtAuthHandler } from '#auth'
import KeycloakProvider from 'next-auth/providers/keycloak'

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,
  pages: {
    signIn: '/login'
  },
  providers: [
    // @ts-expect-error
    KeycloakProvider.default({
      clientId: useRuntimeConfig().keycloakClientId,
      clientSecret: useRuntimeConfig().keycloakClientSecret,
      issuer: useRuntimeConfig().keycloakIssuer,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Map Keycloak roles to token - check both realm and client roles
        const realmRoles = (profile as any).realm_access?.roles || []
        const clientId = useRuntimeConfig().keycloakClientId
        const clientRoles = (profile as any).resource_access?.[clientId]?.roles || []

        // Combine both role sources
        const allRoles = [...realmRoles, ...clientRoles]
        token.role = allRoles.includes('admin') ? 'admin' : 'user'

        // Save id_token for logout
        token.id_token = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      // Pass role and id_token from token to session
      if (session.user) {
        (session.user as any).role = token.role;
        (session as any).id_token = token.id_token
      }
      return session
    }
  }
})