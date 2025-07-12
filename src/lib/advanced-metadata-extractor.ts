import { fileTypeFromBuffer } from 'file-type'
import { parseBuffer } from 'music-metadata'
import { parse as parseExif } from 'exifr'
import { PDFDocument } from 'pdf-lib'
import type {
    FileAnalysisResult,
    MetadataType,
    FileMetadata,
    ImageMetadata,
    AudioMetadata,
    VideoMetadata,
    DocumentMetadata,
    ExifData,
    GeneralMetadata
} from '@/types/metadata'

export async function analyzeFile(file: File): Promise<FileAnalysisResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
        // Get file buffer for analysis
        const buffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)

        // Detect real file type
        const detectedType = await fileTypeFromBuffer(uint8Array)
        // const mimeFromExtension = lookup(file.name) || undefined

        // Determine category
        const category = determineFileCategory(detectedType?.mime || file.type, file.name)

        // Base metadata
        const baseMetadata = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            extension: file.name.split('.').pop()?.toLowerCase() || '',
            mimeType: file.type,
            detectedMimeType: detectedType?.mime,
            realFileType: detectedType?.ext
        }

        let metadata: MetadataType
        let preview: string | undefined
        let thumbnail: string | undefined

        // Extract metadata based on category
        switch (category) {
            case 'image':
                metadata = await extractAdvancedImageMetadata(file, buffer, baseMetadata)
                preview = URL.createObjectURL(file)
                break

            case 'audio': {
                const audioResult = await extractAdvancedAudioMetadata(file, buffer, baseMetadata)
                metadata = audioResult.metadata
                if (audioResult.albumArt) {
                    thumbnail = audioResult.albumArt
                }
                preview = URL.createObjectURL(file)
                break
            }

            case 'video':
                metadata = await extractAdvancedVideoMetadata(file, baseMetadata)
                preview = URL.createObjectURL(file)
                break

            case 'document':
                metadata = await extractAdvancedDocumentMetadata(file, buffer, baseMetadata)
                break

            case 'text':
                metadata = await extractTextMetadata(file, buffer, baseMetadata)
                break

            default:
                metadata = baseMetadata
        }

        // Validate detected vs actual file type
        if (detectedType && detectedType.mime !== file.type && file.type !== '') {
            warnings.push(`File type mismatch: detected ${detectedType.mime}, but file extension suggests ${file.type}`)
        }

        return {
            metadata,
            preview,
            thumbnail,
            category,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        }

    } catch (error) {
        errors.push(`Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`)

        return {
            metadata: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified),
                extension: file.name.split('.').pop()?.toLowerCase() || '',
                mimeType: file.type
            },
            category: 'other',
            errors
        }
    }
}

async function extractAdvancedImageMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: FileMetadata
): Promise<ImageMetadata> {
    try {
        // Extract EXIF data using exifr
        const exifData = await parseExif(buffer, {
            gps: true,
            pick: [
                // Camera info
                'Make', 'Model', 'Software',
                // Photo settings  
                'ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'FocalLengthIn35mmFormat',
                'Flash', 'WhiteBalance', 'MeteringMode', 'ExposureMode', 'SceneCaptureType',
                // Dates
                'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
                // GPS
                'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSSpeed', 'GPSImgDirection', 'GPSDateStamp',
                // Image properties
                'Orientation', 'ColorSpace', 'PixelXDimension', 'PixelYDimension',
                'XResolution', 'YResolution', 'ResolutionUnit',
                // Lens info
                'LensModel', 'LensMake', 'LensSerialNumber',
                // Additional
                'ExposureCompensation', 'MaxApertureValue', 'SubjectDistance',
                'LightSource', 'Saturation', 'Contrast', 'Sharpness', 'BrightnessValue', 'ExposureProgram'
            ]
        })

        // Get image dimensions
        const img = new Image()
        const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
            img.onload = () => resolve({ width: img.width, height: img.height })
            img.onerror = () => resolve({ width: 0, height: 0 })
            img.src = URL.createObjectURL(file)
        })

        // Convert EXIF data to our format
        const processedExif: ExifData | undefined = exifData ? {
            make: exifData.Make,
            model: exifData.Model,
            software: exifData.Software,
            iso: exifData.ISO,
            fNumber: exifData.FNumber,
            exposureTime: exifData.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)}` : undefined,
            focalLength: exifData.FocalLength,
            focalLengthIn35mm: exifData.FocalLengthIn35mmFormat,
            flash: exifData.Flash ? `Flash ${exifData.Flash}` : undefined,
            whiteBalance: exifData.WhiteBalance,
            meteringMode: exifData.MeteringMode,
            exposureMode: exifData.ExposureMode,
            sceneType: exifData.SceneCaptureType,
            dateTime: exifData.DateTime,
            dateTimeOriginal: exifData.DateTimeOriginal,
            dateTimeDigitized: exifData.DateTimeDigitized,
            gps: (exifData.GPSLatitude && exifData.GPSLongitude) ? {
                latitude: exifData.GPSLatitude,
                longitude: exifData.GPSLongitude,
                altitude: exifData.GPSAltitude,
                speed: exifData.GPSSpeed,
                direction: exifData.GPSImgDirection,
                timestamp: exifData.GPSDateStamp
            } : undefined,
            orientation: exifData.Orientation,
            colorSpace: exifData.ColorSpace,
            pixelXDimension: exifData.PixelXDimension,
            pixelYDimension: exifData.PixelYDimension,
            xResolution: exifData.XResolution,
            yResolution: exifData.YResolution,
            resolutionUnit: exifData.ResolutionUnit,
            lensModel: exifData.LensModel,
            lensMake: exifData.LensMake,
            lensSerialNumber: exifData.LensSerialNumber,
            exposureBias: exifData.ExposureCompensation,
            maxAperture: exifData.MaxApertureValue,
            subjectDistance: exifData.SubjectDistance,
            lightSource: exifData.LightSource,
            saturation: exifData.Saturation,
            contrast: exifData.Contrast,
            sharpness: exifData.Sharpness,
            brightnessValue: exifData.BrightnessValue,
            exposureProgram: exifData.ExposureProgram
        } : undefined

        return {
            ...base,
            dimensions,
            exif: processedExif
        } as ImageMetadata

    } catch (error) {
        console.warn('Failed to extract image metadata:', error)
        return base as ImageMetadata
    }
}

async function extractAdvancedAudioMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: FileMetadata
): Promise<{ metadata: AudioMetadata, albumArt?: string }> {
    try {
        const metadata = await parseBuffer(new Uint8Array(buffer), {
            mimeType: file.type,
            size: file.size
        })

        const common = metadata.common
        const format = metadata.format

        let albumArt: string | undefined
        if (common.picture && common.picture.length > 0) {
            const picture = common.picture[0]
            const blob = new Blob([picture.data], { type: picture.format })
            albumArt = URL.createObjectURL(blob)
        }

        const audioMetadata: AudioMetadata = {
            ...base,
            duration: format.duration,
            bitrate: format.bitrate,
            sampleRate: format.sampleRate,
            channels: format.numberOfChannels,
            codecProfile: format.codecProfile,

            title: common.title,
            artist: common.artist,
            album: common.album,
            albumArtist: common.albumartist,
            year: common.year,
            date: common.date,
            genre: common.genre,
            track: common.track?.no ? { no: common.track.no, of: common.track.of || undefined } : undefined,
            disk: common.disk?.no ? { no: common.disk.no, of: common.disk.of || undefined } : undefined,

            composer: common.composer?.[0],
            conductor: common.conductor?.[0],
            lyricist: common.lyricist?.[0],
            writer: common.writer?.[0],
            publisher: common.publisher?.[0],
            label: common.label?.[0],
            copyright: common.copyright?.[0],
            encodedBy: common.encodedby,
            comment: common.comment?.map(c => typeof c === 'string' ? c : c.text || ''),
            lyrics: common.lyrics?.map(l => typeof l === 'string' ? l : l.text || ''),

            format: {
                container: format.container,
                codec: format.codec,
                lossless: format.lossless,
                numberOfChannels: format.numberOfChannels,
                bitsPerSample: format.bitsPerSample,
                sampleRate: format.sampleRate,
                duration: format.duration,
                bitrate: format.bitrate
            },

            picture: common.picture?.map(pic => ({
                format: pic.format,
                data: pic.data.buffer,
                description: pic.description,
                type: pic.type
            })),

            isrc: common.isrc?.[0],
            barcode: common.barcode?.[0],
            catalognumber: common.catalognumber?.[0],
            musicbrainz: {
                artistId: common.musicbrainz_artistid?.[0],
                albumId: common.musicbrainz_albumid?.[0],
                trackId: common.musicbrainz_trackid?.[0],
                releaseGroupId: common.musicbrainz_releasegroupid?.[0]
            }
        }

        return { metadata: audioMetadata, albumArt }

    } catch (error) {
        console.warn('Failed to extract audio metadata:', error)
        return { metadata: base as AudioMetadata }
    }
}

async function extractAdvancedVideoMetadata(
    file: File,
    base: FileMetadata
): Promise<VideoMetadata> {
    try {
        // Use HTML5 video element for basic metadata
        const video = document.createElement('video')

        const videoData = await new Promise<VideoMetadata>((resolve) => {
            video.onloadedmetadata = () => {
                resolve({
                    ...base,
                    duration: video.duration,
                    dimensions: {
                        width: video.videoWidth,
                        height: video.videoHeight
                    }
                } as VideoMetadata)
            }
            video.onerror = () => resolve(base as VideoMetadata)
            video.src = URL.createObjectURL(file)
        })

        URL.revokeObjectURL(video.src)
        return videoData

    } catch (error) {
        console.warn('Failed to extract video metadata:', error)
        return base as VideoMetadata
    }
}

async function extractAdvancedDocumentMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: FileMetadata
): Promise<DocumentMetadata> {
    try {
        if (file.type === 'application/pdf' || base.extension === 'pdf') {
            const pdfDoc = await PDFDocument.load(buffer)
            const pageCount = pdfDoc.getPageCount()

            // Try to get PDF metadata
            const title = pdfDoc.getTitle()
            const author = pdfDoc.getAuthor()
            const subject = pdfDoc.getSubject()
            const creator = pdfDoc.getCreator()
            const producer = pdfDoc.getProducer()
            const creationDate = pdfDoc.getCreationDate()
            const modificationDate = pdfDoc.getModificationDate()
            const keywords = pdfDoc.getKeywords()

            return {
                ...base,
                pageCount,
                title: title || undefined,
                author: author || undefined,
                subject: subject || undefined,
                creator: creator || undefined,
                producer: producer || undefined,
                creationDate: creationDate || undefined,
                modificationDate: modificationDate || undefined,
                keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
                pdfVersion: '1.4', // Default, could be enhanced
                isEncrypted: false // Could be enhanced to detect encryption
            } as DocumentMetadata
        }

        return base as DocumentMetadata

    } catch (error) {
        console.warn('Failed to extract document metadata:', error)
        return base as DocumentMetadata
    }
}

async function extractTextMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: FileMetadata
): Promise<GeneralMetadata> {
    try {
        const text = new TextDecoder().decode(buffer)
        const lines = text.split('\n')
        const words = text.split(/\s+/).filter(word => word.length > 0)

        // Detect BOM
        const hasBom = buffer.byteLength >= 3 &&
            new Uint8Array(buffer, 0, 3).every((byte, i) => byte === [0xEF, 0xBB, 0xBF][i])

        // Detect line endings
        let lineEndings = 'unknown'
        if (text.includes('\r\n')) lineEndings = 'CRLF (Windows)'
        else if (text.includes('\n')) lineEndings = 'LF (Unix)'
        else if (text.includes('\r')) lineEndings = 'CR (Mac)'

        return {
            ...base,
            charset: 'UTF-8', // Simplified detection
            lineEndings,
            bom: hasBom,
            wordCount: words.length,
            lineCount: lines.length,
            characterCount: text.length
        } as GeneralMetadata

    } catch (error) {
        console.warn('Failed to extract text metadata:', error)
        return base as GeneralMetadata
    }
}

function determineFileCategory(mimeType: string, filename: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'text' | 'other' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('text/')) return 'text'

    const extension = filename.split('.').pop()?.toLowerCase() || ''

    const documentExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages']
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico']
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v']
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']
    const textExts = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h']

    if (documentExts.includes(extension)) return 'document'
    if (archiveExts.includes(extension)) return 'archive'
    if (imageExts.includes(extension)) return 'image'
    if (videoExts.includes(extension)) return 'video'
    if (audioExts.includes(extension)) return 'audio'
    if (textExts.includes(extension)) return 'text'

    return 'other'
}

// Utility functions
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        case 'archive': return '📦'
        case 'text': return '📝'
        default: return '📁'
    }
}