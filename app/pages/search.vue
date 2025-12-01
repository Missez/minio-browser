<template>
  <div class="container">
    <AppSidebar />
    <div class="search-page">
      <h1>🔍 Search Files</h1>
      <div class="search-bar">
        <input v-model="query" @keyup.enter="performSearch" placeholder="Search content..." />
        <button @click="performSearch">Search</button>
      </div>
      
      <div v-if="loading">Searching...</div>
      <div v-else-if="results.length === 0 && searched">No results found.</div>
      
      <ul v-else class="results-list">
        <li v-for="file in results" :key="file.id" class="result-item">
          <div class="file-info">
            <strong>{{ file.filename }}</strong>
            <span class="bucket-badge">{{ file.bucket }}</span>
          </div>
          <div v-if="file.highlight" class="snippet">
            <div v-for="(fragments, field) in file.highlight" :key="field">
              <span v-for="fragment in fragments" :key="fragment" v-html="fragment"></span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const query = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)

const performSearch = async () => {
  if (!query.value) return
  loading.value = true
  searched.value = true
  try {
    const data = await $fetch('/api/search', {
      params: { q: query.value }
    })
    results.value = data
  } catch (err) {
    console.error(err)
    results.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container { display: flex; height: 100vh; }
.search-page { flex: 1; padding: 20px; overflow-y: auto; background: #f4f6f8; color: #333; }
.search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
.search-bar input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
.search-bar button { padding: 10px 20px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
.results-list { list-style: none; padding: 0; }
.result-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.file-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.bucket-badge { background: #eee; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; color: #666; }
.snippet { font-size: 0.9rem; color: #555; background: #f9f9f9; padding: 10px; border-left: 3px solid #42b883; }
/* Highlight style for Elasticsearch hits */
:deep(em) { font-style: normal; background: #fff3cd; font-weight: bold; padding: 0 2px; border-radius: 2px; }
</style>
