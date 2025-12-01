<template>
    <main class="main-content">
      <header>
        <h2>Bucket: {{ currentBucket }}</h2>
        <div class="breadcrumbs">
           <span @click="navigateTo('')" class="crumb">🏠 Home</span>
           <span v-for="(part, index) in breadcrumbs" :key="index" class="crumb" @click="navigateTo(part.path)">
             / {{ part.name }}
           </span>
        </div>

        <div class="toolbar" v-if="files && files.length > 0">
             <label class="select-all">
                <input type="checkbox" :checked="selectedFiles.size === files.length" @change="selectAll(files)" />
                Select All ({{ selectedFiles.size }})
             </label>
             
             <div class="bulk-actions" v-if="selectedFiles.size > 0">
                <button @click="downloadSelectedZip" class="btn btn-download">📦 Zip</button>
                <button v-if="isAdmin" @click="deleteSelected" class="btn btn-del">🗑 Delete</button>
             </div>
        </div>
        
        <div 
          v-if="isAdmin"
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
        <div v-for="file in files" :key="file.name" class="card" :class="{ selected: selectedFiles.has(file.name) }">
           <div class="selection-overlay">
              <input type="checkbox" :checked="selectedFiles.has(file.name)" @click.stop="toggleSelection(file.name)" />
           </div>

           <div class="preview" @click="file.isFolder ? navigateTo(currentPath + file.name) : toggleSelection(file.name)" :class="{ 'is-folder': file.isFolder }">
             <img v-if="file.isFile && isImage(file.name)" :src="file.url" />
             <div v-else-if="file.isFolder" class="folder-icon">📁</div>
             <div v-else class="file-icon">📄</div>
           </div>
           
           <div class="info">
             <div class="filename" :title="file.name">{{ file.name.replace(currentPath, '') }}</div>
             <div class="file-meta" v-if="file.isFile">{{ (file.size / 1024).toFixed(2) }} KB</div>
             <div class="actions" v-if="file.isFile">
                <a :href="file.url" target="_blank" class="btn btn-view" title="View">👁</a>
                <button v-if="isAdmin" @click="shareFile(file.name, $event)" class="btn btn-share" title="Share">🔗</button>
                <button @click="downloadFile(file.url, file.name)" class="btn btn-download" title="Download">⬇</button>
                <button v-if="isAdmin" @click="deleteFile(file.name)" class="btn btn-del" title="Delete">🗑</button>
             </div>
             <div class="actions" v-else>
                <button @click="navigateTo(currentPath + file.name)" class="btn btn-view">Open</button>
             </div>
           </div>
        </div>
      </div>
    </main>
</template>

<script setup>
const { 
    currentBucket, 
    breadcrumbs, 
    navigateTo, 
    uploading, 
    uploadProgressText, 
    pendingFiles, 
    files, 
    currentPath, 
    isImage, 
    shareFile, 
    downloadFile, 
    deleteFile,
    refreshFiles,
    selectedFiles,
    toggleSelection,
    selectAll,
    downloadSelectedZip,
    deleteSelected
} = useBrowser()

const { isAdmin } = useAuth()
const isDragging = ref(false)
const fileInputRef = ref(null)

const triggerFileInput = () => { fileInputRef.value.click() }

const handleFileChange = (e) => {
    const fileList = e.target.files
    if (fileList.length > 0) processUpload([...fileList])
}

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
            const relativePath = file.fullPath || file.name
            const fullPath = currentPath.value + relativePath
            
            try {
                // 1. Get Presigned URL
                const { url } = await $fetch('/api/presigned', {
                    query: { 
                        bucket: currentBucket.value,
                        filename: fullPath
                    }
                })

                // 2. Upload directly to MinIO
                await fetch(url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream'
                    }
                })

            } catch (err) { console.error(`Failed ${file.name}`, err) } 
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
</script>

<style scoped>
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
.btn-share { background-color: #805ad5; }
.btn-share:hover { background-color: #6b46c1; }
hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
.breadcrumbs { display: flex; align-items: center; gap: 5px; margin-bottom: 10px; font-size: 1.1rem; }
.crumb { cursor: pointer; color: #4299e1; }
.crumb:hover { text-decoration: underline; }
.folder-icon { font-size: 3rem; color: #f6ad55; }
.preview.is-folder { cursor: pointer; background: #fffaf0; }
.preview.is-folder:hover { background: #feebc8; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #e2e8f0; border-radius: 8px; }
.select-all { display: flex; align-items: center; gap: 5px; font-weight: bold; cursor: pointer; }
.bulk-actions { display: flex; gap: 10px; }
.card { position: relative; }
.card.selected { box-shadow: 0 0 0 2px #4299e1; }
.selection-overlay { position: absolute; top: 5px; left: 5px; z-index: 10; }
.selection-overlay input { width: 18px; height: 18px; cursor: pointer; }
</style>
