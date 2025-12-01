<template>
    <aside class="sidebar">
      <h3>🪣 MinIO Browser</h3>
      
      <nav class="main-nav">
        <NuxtLink to="/" class="nav-item" active-class="active">🏠 Files</NuxtLink>
        <NuxtLink to="/search" class="nav-item" active-class="active">🔍 Search</NuxtLink>
      </nav>
      
      <div v-if="isAdmin" class="input-group">
        <input v-model="newBucketName" placeholder="New bucket..." @keyup.enter="createBucket" />
        <button @click="createBucket" class="btn-icon">+</button>
      </div>

      <div v-if="pendingBuckets">Loading...</div>
      <ul v-else class="bucket-list">
        <li 
          v-for="b in buckets" 
          :key="b.name"
          @click="selectBucket(b.name)"
          :class="{ active: currentBucket === b.name }"
          class="bucket-item"
        >
          <span>📂 {{ b.name }}</span>
          <button v-if="isAdmin" @click.stop="deleteBucket(b.name)" class="btn-delete-bucket" title="Delete Bucket">🗑</button>
        </li>
      </ul>
      <div class="logout-section">
        <button @click="handleLogout" class="btn-logout">🚪 Logout</button>
      </div>
    </aside>
</template>

<script setup>
const { 
    newBucketName, 
    createBucket, 
    pendingBuckets, 
    buckets, 
    selectBucket: baseSelectBucket, 
    currentBucket,
    deleteBucket 
} = useBrowser()

const { isAdmin } = useAuth()
const router = useRouter()

const selectBucket = (name) => {
  baseSelectBucket(name)
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
}

const handleLogout = () => {
  const authCookie = useCookie('auth_token')
  authCookie.value = null
  router.push('/login')
}
</script>

<style scoped>
.sidebar { width: 250px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column; }
.input-group { display: flex; margin-bottom: 20px; gap: 5px; }
.input-group input { width: 100%; padding: 8px; border-radius: 4px; border: none; outline: none; }
.btn-icon { background: #42b883; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; width: 30px;}
.bucket-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex-grow: 1; }
.bucket-list li { padding: 10px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; transition: 0.2s; display: flex; justify-content: space-between; align-items: center; }
.bucket-list li:hover { background: rgba(255,255,255,0.1); }
.bucket-list li.active { background: #42b883; font-weight: bold; }
.btn-delete-bucket { background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0; transition: 0.2s; }
.bucket-list li:hover .btn-delete-bucket { opacity: 1; }
.btn-delete-bucket:hover { transform: scale(1.2); }

.logout-section { margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.btn-logout { width: 100%; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; transition: 0.2s; }
.btn-logout:hover { background: #c0392b; }

.main-nav { display: flex; flex-direction: column; gap: 5px; margin-bottom: 20px; }
.nav-item { color: #bdc3c7; text-decoration: none; padding: 10px; border-radius: 4px; transition: 0.2s; }
.nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
.nav-item.active { background: #42b883; color: white; font-weight: bold; }

</style>
