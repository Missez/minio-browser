<template>
    <aside class="sidebar">
      <h3>🪣 MinIO Browser</h3>
      
      <div class="input-group">
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
        >
          📂 {{ b.name }}
        </li>
      </ul>
    </aside>
</template>

<script setup>
const { 
    newBucketName, 
    createBucket, 
    pendingBuckets, 
    buckets, 
    selectBucket, 
    currentBucket 
} = useBrowser()
</script>

<style scoped>
.sidebar { width: 250px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column; }
.input-group { display: flex; margin-bottom: 20px; gap: 5px; }
.input-group input { width: 100%; padding: 8px; border-radius: 4px; border: none; outline: none; }
.btn-icon { background: #42b883; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; width: 30px;}
.bucket-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; }
.bucket-list li { padding: 10px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; transition: 0.2s; }
.bucket-list li:hover { background: rgba(255,255,255,0.1); }
.bucket-list li.active { background: #42b883; font-weight: bold; }
</style>
