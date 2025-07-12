import type { FileMetadata, ImageMetadata, VideoMetadata, AudioMetadata } from '@/types/metadata'

export function extractBasicFileMetadata(file: File): FileMetadata {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''

    return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        extension,
        mimeType: file.type
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileTypeCategory(mimeType: string, extension: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'

    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']

    if (documentExtensions.includes(extension)) return 'document'
    if (imageExtensions.includes(extension)) return 'image'
    if (videoExtensions.includes(extension)) return 'video'
    if (audioExtensions.includes(extension)) return 'audio'

    return 'other'
}

export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
    const basicMetadata = extractBasicFileMetadata(file)

    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            resolve({
                ...basicMetadata,
                dimensions: {
                    width: img.width,
                    height: img.height
                }
            })
        }
        img.onerror = () => {
            resolve(basicMetadata as ImageMetadata)
        }
        img.src = URL.createObjectURL(file)
    })
}

export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
    const basicMetadata = extractBasicFileMetadata(file)

    return new Promise((resolve) => {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
            resolve({
                ...basicMetadata,
                duration: video.duration,
                dimensions: {
                    width: video.videoWidth,
                    height: video.videoHeight
                }
            })
            URL.revokeObjectURL(video.src)
        }
        video.onerror = () => {
            resolve(basicMetadata as VideoMetadata)
        }
        video.src = URL.createObjectURL(file)
    })
}

export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
    const basicMetadata = extractBasicFileMetadata(file)

    return new Promise((resolve) => {
        const audio = new Audio()
        audio.onloadedmetadata = () => {
            resolve({
                ...basicMetadata,
                duration: audio.duration
            })
            URL.revokeObjectURL(audio.src)
        }
        audio.onerror = () => {
            resolve(basicMetadata as AudioMetadata)
        }
        audio.src = URL.createObjectURL(file)
    })
}

export function formatDuration(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function getFileIcon(category: string): string {
    switch (category) {
        case 'image': return '🖼️'
        case 'video': return '🎬'
        case 'audio': return '🎵'
        case 'document': return '📄'
        default: return '📁'
    }
}