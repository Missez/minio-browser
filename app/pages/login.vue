<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Login</h1>
      <div class="actions">
        <button @click="handleKeycloakLogin" class="btn-keycloak">
          Sign in with Keycloak
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false
})

const { signIn } = useAuth()

const handleKeycloakLogin = async () => {
  await signIn('keycloak', { callbackUrl: '/' })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h1 {
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

.btn-keycloak {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-keycloak:hover {
  background-color: #0056b3;
}
</style>
