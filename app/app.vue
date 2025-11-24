<template>
  <div class="container">
    
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

    <main class="main-content">
      <header>
        <h2>Bucket: {{ currentBucket }}</h2>
        
        <div 
          class="drop-zone" 
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
            <input type="file" ref="fileInputRef" @change="handleFileChange" hidden multiple />
            
            <div v-if="uploading">
               <div style="font-size: 2rem;">⏳</div>
               <div>{{ uploadProgressText }}</div>
            </div>
            <div v-else>
               <span style="font-size: 24px;">☁️</span>
               <p v-if="isDragging">Drop folder or files here!</p>
               <p v-else>Drag & Drop Folder/Files here <br/> or <span style="text-decoration: underline; color: #42b883;">Click to browse</span></p>
            </div>
        </div>
      </header>

      <hr />

      <div v-if="pendingFiles">Loading files...</div>
      <div v-else-if="!files || files.length === 0" class="empty-state">No files found.</div>
      <div v-else class="grid">
        <div v-for="file in files" :key="file.name" class="card">
           <div class="preview">
             <img v-if="isImage(file.name)" :src="file.url" />
             <div v-else class="file-icon">📄</div>
           </div>
           
           <div class="info">
             <div class="filename" :title="file.name">{{ file.name }}</div>
             <div class="file-meta">{{ (file.size / 1024).toFixed(2) }} KB</div>
             <div class="actions">
                <a :href="file.url" target="_blank" class="btn btn-view" title="View">👁</a>
                <button @click="downloadFile(file.url, file.name)" class="btn btn-download" title="Download">⬇</button>
                <button @click="deleteFile(file.name)" class="btn btn-del" title="Delete">🗑</button>
             </div>
           </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// --- State ---
const newBucketName = ref('')
const uploading = ref(false)
const currentBucket = ref('my-bucket') 
const isDragging = ref(false)
const fileInputRef = ref(null)
const uploadProgressText = ref('')

// --- Data ---
const { data: buckets, refresh: refreshBuckets, pending: pendingBuckets } = await useFetch('/api/buckets')
const { data: files, refresh: refreshFiles, pending: pendingFiles } = await useFetch(
    () => `/api/files`, 
    { query: { bucket: currentBucket } }
)

// --- Actions ---
const selectBucket = (name) => { currentBucket.value = name }

const createBucket = async () => {
  if (!newBucketName.value) return
  try {
    await $fetch('/api/buckets', { method: 'POST', body: { name: newBucketName.value } })
    newBucketName.value = ''
    refreshBuckets()
  } catch (err) { alert(err.data?.message || 'Error') }
}

const triggerFileInput = () => { fileInputRef.value.click() }

const handleFileChange = (e) => {
    const fileList = e.target.files
    if (fileList.length > 0) processUpload([...fileList])
}

// ✨ Folder & File Drop Logic
const handleDrop = async (e) => {
    isDragging.value = false
    const items = e.dataTransfer.items
    if (!items) return

    uploading.value = true
    uploadProgressText.value = 'Scanning folders...'
    const fileQueue = []
    
    const entryPromises = []
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry() 
        if (item) entryPromises.push(scanEntry(item, fileQueue))
    }
    
    await Promise.all(entryPromises)
    await processUpload(fileQueue)
}

const scanEntry = async (entry, queue, path = '') => {
    if (entry.isFile) {
        const file = await new Promise((resolve) => entry.file(resolve))
        Object.defineProperty(file, 'fullPath', { value: path + entry.name, writable: false })
        queue.push(file)
    } else if (entry.isDirectory) {
        const dirReader = entry.createReader()
        const readEntriesPromise = async () => {
            const entries = await new Promise((resolve) => dirReader.readEntries(resolve))
            if (entries.length > 0) {
                await Promise.all(entries.map(child => scanEntry(child, queue, path + entry.name + '/')))
                await readEntriesPromise()
            }
        }
        await readEntriesPromise()
    }
}

const processUpload = async (fileList) => {
    uploading.value = true
    const total = fileList.length
    let count = 0
    const BATCH_SIZE = 5
    
    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = fileList.slice(i, i + BATCH_SIZE)
        await Promise.all(batch.map(async (file) => {
            const formData = new FormData()
            const filename = file.fullPath || file.name 
            formData.append('file', file, filename) 

            try {
                await $fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                    query: { bucket: currentBucket.value }
                })
            } catch (err) { console.error(`Failed ${filename}`, err) } 
            finally {
                count++
                uploadProgressText.value = `Uploading ${count}/${total}`
            }
        }))
    }
    uploading.value = false
    uploadProgressText.value = ''
    if (fileInputRef.value) fileInputRef.value.value = ''
    refreshFiles()
}

const downloadFile = async (url, filename) => {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
    } catch (error) { window.open(url, '_blank') }
}

const deleteFile = async (filename) => {
    if(!confirm(`Delete ${filename}?`)) return
    try {
        await $fetch('/api/delete', { method: 'POST', body: { filename, bucketName: currentBucket.value } })
        refreshFiles()
    } catch (err) { alert('Delete failed') }
}

const isImage = (name) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
</script>

<style>
body { margin: 0; font-family: 'Segoe UI', sans-serif; color: #333; }
.container { display: flex; height: 100vh; }
.sidebar { width: 250px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column; }
.input-group { display: flex; margin-bottom: 20px; gap: 5px; }
.input-group input { width: 100%; padding: 8px; border-radius: 4px; border: none; outline: none; }
.btn-icon { background: #42b883; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; width: 30px;}
.bucket-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; }
.bucket-list li { padding: 10px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; transition: 0.2s; }
.bucket-list li:hover { background: rgba(255,255,255,0.1); }
.bucket-list li.active { background: #42b883; font-weight: bold; }
.main-content { flex: 1; padding: 20px; overflow-y: auto; background: #f8f9fa; display: flex; flex-direction: column; }
.drop-zone { border: 2px dashed #ccc; border-radius: 10px; padding: 30px; text-align: center; background: white; cursor: pointer; transition: all 0.3s ease; color: #666; margin-bottom: 20px; }
.drop-zone:hover { border-color: #42b883; background: #f0fdf4; }
.drop-zone.is-dragging { border-color: #42b883; background: #e6fffa; transform: scale(1.01); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.empty-state { text-align: center; color: #888; margin-top: 50px; font-size: 1.2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; margin-top: 20px; }
.card { background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; }
.card:hover { transform: translateY(-3px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
.preview { height: 140px; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid #f0f0f0;}
.preview img { width: 100%; height: 100%; object-fit: cover; }
.file-icon { font-size: 3rem; color: #cbd5e0; }
.info { padding: 12px; flex: 1; display: flex; flex-direction: column; }
.filename { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; color: #2d3748; }
.file-meta { font-size: 0.75rem; color: #718096; margin-bottom: 10px; }
.actions { display: flex; gap: 8px; margin-top: auto; }
.btn { flex: 1; border: none; padding: 6px; border-radius: 4px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-size: 0.9rem; }
.btn-view { background-color: #4299e1; }
.btn-view:hover { background-color: #3182ce; }
.btn-download { background-color: #48bb78; }
.btn-download:hover { background-color: #38a169; }
.btn-del { background-color: #f56565; }
.btn-del:hover { background-color: #e53e3e; }
hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
</style>