export const useBrowser = () => {
    // --- State ---
    const newBucketName = useState('newBucketName', () => '')
    const uploading = useState('uploading', () => false)
    const currentBucket = useState('currentBucket', () => 'my-bucket')
    const currentPath = useState('currentPath', () => '')
    const uploadProgressText = useState('uploadProgressText', () => '')
    const selectedFiles = useState<Set<string>>('selectedFiles', () => new Set())
    const fileInputRef = ref(null) // Refs to DOM elements stay local usually, but we can expose a trigger

    // --- Data ---
    const { data: buckets, refresh: refreshBuckets, pending: pendingBuckets } = useFetch('/api/buckets')
    const { data: files, refresh: refreshFiles, pending: pendingFiles } = useFetch(
        () => `/api/files`,
        { query: { bucket: currentBucket, prefix: currentPath } }
    )

    const breadcrumbs = computed(() => {
        if (!currentPath.value) return []
        const parts = currentPath.value.split('/').filter(p => p)
        let path = ''
        return parts.map(p => {
            path += p + '/'
            return { name: p, path }
        })
    })

    // --- Actions ---
    const selectBucket = (name: string) => {
        currentBucket.value = name
        currentPath.value = ''
        selectedFiles.value.clear()
    }

    const navigateTo = (path: string) => {
        currentPath.value = path
        selectedFiles.value.clear()
    }

    const createBucket = async () => {
        if (!newBucketName.value) return
        try {
            await $fetch('/api/buckets', { method: 'POST', body: { name: newBucketName.value } })
            newBucketName.value = ''
            refreshBuckets()
        } catch (err: any) { alert(err.data?.message || 'Error') }
    }

    const deleteFile = async (filename: string) => {
        if (!confirm(`Delete ${filename}?`)) return
        try {
            await $fetch('/api/delete', { method: 'POST', body: { filename, bucketName: currentBucket.value } })
            refreshFiles()
        } catch (err) { alert('Delete failed') }
    }

    const shareFile = async (filename: string, event: Event) => {
        try {
            const { url } = await $fetch('/api/share', {
                method: 'POST',
                body: { filename, bucket: currentBucket.value }
            }) as { url: string }
            
            await navigator.clipboard.writeText(url)

            // Visual feedback
            const btn = event.target as HTMLElement
            const originalText = btn.innerText
            btn.innerText = '✅'
            setTimeout(() => btn.innerText = originalText, 2000)

        } catch (err) {
            console.error(err)
        }
    }

    const downloadFile = async (url: string, filename: string) => {
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

    const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name)

    // --- Bulk Actions ---
    const toggleSelection = (filename: string) => {
        if (selectedFiles.value.has(filename)) {
            selectedFiles.value.delete(filename)
        } else {
            selectedFiles.value.add(filename)
        }
    }

    const selectAll = (allFiles: any[]) => {
        if (selectedFiles.value.size === allFiles.length) {
            selectedFiles.value.clear()
        } else {
            allFiles.forEach(f => selectedFiles.value.add(f.name))
        }
    }

    const downloadSelectedZip = async () => {
        if (selectedFiles.value.size === 0) return
        try {
            const response = await fetch('/api/zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: currentBucket.value,
                    files: Array.from(selectedFiles.value)
                })
            })
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `files-${Date.now()}.zip`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        } catch (err) { alert('Zip download failed') }
    }

    const deleteSelected = async () => {
        if (selectedFiles.value.size === 0) return
        if (!confirm(`Delete ${selectedFiles.value.size} files?`)) return
        try {
            await $fetch('/api/delete', {
                method: 'POST',
                body: { 
                    filenames: Array.from(selectedFiles.value), 
                    bucketName: currentBucket.value 
                }
            })
            selectedFiles.value.clear()
            refreshFiles()
        } catch (err) { alert('Bulk delete failed') }
    }

    return {
        newBucketName,
        uploading,
        currentBucket,
        currentPath,
        uploadProgressText,
        buckets,
        files,
        pendingBuckets,
        pendingFiles,
        breadcrumbs,
        selectedFiles,
        selectBucket,
        navigateTo,
        createBucket,
        deleteFile,
        shareFile,
        downloadFile,
        isImage,
        refreshFiles,
        toggleSelection,
        selectAll,
        downloadSelectedZip,
        deleteSelected
    }
}
