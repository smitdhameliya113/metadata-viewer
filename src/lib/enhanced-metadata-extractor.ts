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

// Enhanced metadata interface with more technical details
export interface EnhancedFileMetadata extends FileMetadata {
    checksum?: string
    rawHeader?: string
    encoding?: {
        process?: string
        bitsPerSample?: number
        colorComponents?: number
        subSampling?: string
    }
    jfif?: {
        version?: string
        resolutionUnit?: string
        xResolution?: number
        yResolution?: number
    }
}

export interface EnhancedImageMetadata extends Omit<ImageMetadata, 'thumbnail'> {
    megapixels?: number
    colorSpace?: string
    bitsPerSample?: number
    compression?: string
    jpegQuality?: number
    iccProfile?: string
    thumbnail?: {
        data: ArrayBuffer
        width: number
        height: number
        size?: number
    }
}

export interface EnhancedAudioMetadata extends AudioMetadata {
    mpegInfo?: {
        version?: string
        layer?: string
        channelMode?: string
        emphasis?: string
        copyrightFlag?: boolean
        originalMedia?: boolean
    }
    id3Info?: {
        version?: string
        size?: number
        flags?: string[]
    }
    streams?: Array<{
        index: number
        codecName: string
        codecLongName: string
        codecType: string
        sampleFormat?: string
        channelLayout?: string
        timeBase?: string
        startTime?: number
        durationTs?: number
        bitRate?: number
    }>
    pictureInfo?: {
        mimeType: string
        type: string
        description: string
        size: number
    }[]
}

// Calculate MD5 checksum
async function calculateChecksum(buffer: ArrayBuffer): Promise<string> {
    try {
        const hashBuffer = await crypto.subtle.digest('MD5', buffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
        console.warn('MD5 not supported, using simple hash')
        // Fallback to simple hash
        const uint8Array = new Uint8Array(buffer)
        let hash = 0
        for (let i = 0; i < uint8Array.length; i++) {
            hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff
        }
        return Math.abs(hash).toString(16).padStart(8, '0')
    }
}

// Extract raw header bytes
function extractRawHeader(buffer: ArrayBuffer, length: number = 64): string {
    const uint8Array = new Uint8Array(buffer.slice(0, length))
    return Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
        .join(' ')
}

export async function analyzeFileEnhanced(file: File): Promise<FileAnalysisResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
        const buffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)

        // Calculate checksum
        const checksum = await calculateChecksum(buffer)

        // Extract raw header
        const rawHeader = extractRawHeader(buffer)

        // Detect real file type
        const detectedType = await fileTypeFromBuffer(uint8Array)

        // Determine category
        const category = determineFileCategory(detectedType?.mime || file.type, file.name)

        // Base metadata with enhanced info
        const baseMetadata: EnhancedFileMetadata = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            extension: file.name.split('.').pop()?.toLowerCase() || '',
            mimeType: file.type,
            detectedMimeType: detectedType?.mime,
            realFileType: detectedType?.ext,
            checksum,
            rawHeader
        }

        let metadata: MetadataType
        let preview: string | undefined
        let thumbnail: string | undefined

        // Extract metadata based on category
        switch (category) {
            case 'image':
                metadata = await extractEnhancedImageMetadata(file, buffer, baseMetadata)
                preview = URL.createObjectURL(file)
                break

            case 'audio': {
                const audioResult = await extractEnhancedAudioMetadata(file, buffer, baseMetadata)
                metadata = audioResult.metadata
                if (audioResult.albumArt) {
                    thumbnail = audioResult.albumArt
                }
                preview = URL.createObjectURL(file)
                break
            }

            case 'video':
                metadata = await extractEnhancedVideoMetadata(file, baseMetadata)
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

async function extractEnhancedImageMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: EnhancedFileMetadata
): Promise<EnhancedImageMetadata> {
    try {
        // Get image dimensions
        const img = new Image()
        const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
            img.onload = () => resolve({ width: img.width, height: img.height })
            img.onerror = () => resolve({ width: 0, height: 0 })
            img.src = URL.createObjectURL(file)
        })

        // Calculate megapixels
        const megapixels = dimensions.width && dimensions.height ?
            Number(((dimensions.width * dimensions.height) / 1_000_000).toFixed(1)) : undefined

        // Extract comprehensive EXIF data
        const exifData = await parseExif(buffer, {
            gps: true,
            icc: true,
            jfif: true,
            ihdr: true,
            pick: [
                // Camera info
                'Make', 'Model', 'Software', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
                // Technical
                'ImageWidth', 'ImageHeight', 'BitsPerSample', 'Compression', 'PhotometricInterpretation',
                'Orientation', 'SamplesPerPixel', 'PlanarConfiguration', 'YCbCrSubSampling',
                'YCbCrPositioning', 'XResolution', 'YResolution', 'ResolutionUnit',
                // Camera settings
                'ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'FocalLengthIn35mmFormat',
                'ExposureProgram', 'MeteringMode', 'LightSource', 'Flash', 'ExposureMode',
                'WhiteBalance', 'DigitalZoomRatio', 'SceneCaptureType', 'GainControl',
                'Contrast', 'Saturation', 'Sharpness', 'DeviceSettingDescription',
                // GPS
                'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSSpeed', 'GPSImgDirection',
                // Lens
                'LensModel', 'LensMake', 'LensSerialNumber', 'LensSpecification',
                // Color
                'ColorSpace', 'WhitePoint', 'PrimaryChromaticities',
                // JFIF
                'JFIFVersion', 'ResolutionUnit', 'XResolution', 'YResolution'
            ]
        })

        // Analyze JPEG structure for more details
        interface JpegAnalysisResult {
            encoding?: {
                process?: string
                bitsPerSample?: number
                colorComponents?: number
                subSampling?: string
            }
            jfif?: {
                version?: string
                resolutionUnit?: string
                xResolution?: number
                yResolution?: number
            }
        }

        let jpegInfo: JpegAnalysisResult = {}
        if (file.type === 'image/jpeg' || base.extension === 'jpg' || base.extension === 'jpeg') {
            jpegInfo = analyzeJPEGStructure(buffer)
        }

        const processedExif: ExifData | undefined = exifData ? {
            make: exifData.Make,
            model: exifData.Model,
            software: exifData.Software,
            iso: exifData.ISO,
            fNumber: exifData.FNumber,
            exposureTime: exifData.ExposureTime ? formatExposureTime(exifData.ExposureTime) : undefined,
            focalLength: exifData.FocalLength,
            focalLengthIn35mm: exifData.FocalLengthIn35mmFormat,
            flash: formatFlash(exifData.Flash),
            whiteBalance: formatWhiteBalance(exifData.WhiteBalance),
            meteringMode: formatMeteringMode(exifData.MeteringMode),
            exposureMode: formatExposureMode(exifData.ExposureMode),
            sceneType: formatSceneType(exifData.SceneCaptureType),
            dateTime: exifData.DateTime,
            dateTimeOriginal: exifData.DateTimeOriginal,
            dateTimeDigitized: exifData.DateTimeDigitized,
            gps: (exifData.GPSLatitude && exifData.GPSLongitude) ? {
                latitude: exifData.GPSLatitude,
                longitude: exifData.GPSLongitude,
                altitude: exifData.GPSAltitude
            } : undefined,
            orientation: exifData.Orientation,
            colorSpace: formatColorSpace(exifData.ColorSpace),
            pixelXDimension: exifData.ImageWidth || dimensions.width,
            pixelYDimension: exifData.ImageHeight || dimensions.height,
            xResolution: exifData.XResolution,
            yResolution: exifData.YResolution,
            resolutionUnit: formatResolutionUnit(exifData.ResolutionUnit),
            lensModel: exifData.LensModel,
            lensMake: exifData.LensMake,
            lensSerialNumber: exifData.LensSerialNumber
        } : undefined

        return {
            ...base,
            dimensions,
            megapixels,
            exif: processedExif,
            colorSpace: formatColorSpace(exifData?.ColorSpace),
            bitsPerSample: exifData?.BitsPerSample,
            compression: formatCompression(exifData?.Compression),
            encoding: jpegInfo.encoding,
            jfif: jpegInfo.jfif
        } as EnhancedImageMetadata

    } catch (error) {
        console.warn('Failed to extract enhanced image metadata:', error)
        return base as EnhancedImageMetadata
    }
}

async function extractEnhancedAudioMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: EnhancedFileMetadata
): Promise<{ metadata: EnhancedAudioMetadata, albumArt?: string }> {
    try {
        const metadata = await parseBuffer(new Uint8Array(buffer), {
            mimeType: file.type,
            size: file.size
        })

        const common = metadata.common
        const format = metadata.format
        const native = metadata.native

        let albumArt: string | undefined
        let pictureInfo: Array<{
            mimeType: string
            type: string
            description: string
            size: number
        }> = []

        if (common.picture && common.picture.length > 0) {
            const picture = common.picture[0]
            const blob = new Blob([picture.data], { type: picture.format })
            albumArt = URL.createObjectURL(blob)

            pictureInfo = common.picture.map(pic => ({
                mimeType: pic.format,
                type: pic.type || 'Cover',
                description: pic.description || 'Cover',
                size: pic.data.length
            }))
        }

        // Extract detailed MP3 information
        let mpegInfo: {
            version?: string
            layer?: string
            channelMode?: string
            emphasis?: string
            copyrightFlag?: boolean
            originalMedia?: boolean
        } = {}
        let id3Info: {
            version?: string
            size?: number
            flags?: string[]
        } = {}

        if (format.container === 'MPEG' || file.type === 'audio/mpeg') {
            mpegInfo = {
                version: format.codec?.includes('Layer III') ? 'MPEG-1' : 'MPEG',
                layer: format.codec?.includes('Layer III') ? '3' : 'Unknown',
                channelMode: format.numberOfChannels === 2 ? 'Stereo' : 'Mono',
                emphasis: 'None',
                copyrightFlag: false,
                originalMedia: true
            }
        }

        // Get ID3 information
        if (native.ID3v2 || native.ID3v1) {
            const id3v2 = native.ID3v2?.[0]
            if (id3v2) {
                id3Info = {
                    version: '2.3',
                    size: 0, // Would need deeper parsing
                    flags: []
                }
            }
        }

        const audioMetadata: EnhancedAudioMetadata = {
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

            mpegInfo,
            id3Info,
            pictureInfo,

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
        console.warn('Failed to extract enhanced audio metadata:', error)
        return { metadata: base as EnhancedAudioMetadata }
    }
}

async function extractEnhancedVideoMetadata(
    file: File,
    base: EnhancedFileMetadata
): Promise<VideoMetadata> {
    try {
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
        console.warn('Failed to extract enhanced video metadata:', error)
        return base as VideoMetadata
    }
}

async function extractAdvancedDocumentMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: EnhancedFileMetadata
): Promise<DocumentMetadata> {
    try {
        if (file.type === 'application/pdf' || base.extension === 'pdf') {
            const pdfDoc = await PDFDocument.load(buffer)
            const pageCount = pdfDoc.getPageCount()

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
                pdfVersion: '1.4',
                isEncrypted: false
            } as DocumentMetadata
        }

        return base as DocumentMetadata

    } catch (error) {
        console.warn('Failed to extract advanced document metadata:', error)
        return base as DocumentMetadata
    }
}

async function extractTextMetadata(
    file: File,
    buffer: ArrayBuffer,
    base: EnhancedFileMetadata
): Promise<GeneralMetadata> {
    try {
        const text = new TextDecoder().decode(buffer)
        const lines = text.split('\n')
        const words = text.split(/\s+/).filter(word => word.length > 0)

        const hasBom = buffer.byteLength >= 3 &&
            new Uint8Array(buffer, 0, 3).every((byte, i) => byte === [0xEF, 0xBB, 0xBF][i])

        let lineEndings = 'unknown'
        if (text.includes('\r\n')) lineEndings = 'CRLF (Windows)'
        else if (text.includes('\n')) lineEndings = 'LF (Unix)'
        else if (text.includes('\r')) lineEndings = 'CR (Mac)'

        return {
            ...base,
            charset: 'UTF-8',
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

// Helper functions for formatting EXIF data
function formatExposureTime(exposureTime: number): string {
    if (exposureTime >= 1) return `${exposureTime}s`
    return `1/${Math.round(1 / exposureTime)}s`
}

function formatFlash(flash?: number): string | undefined {
    if (flash === undefined) return undefined
    const flashFired = flash & 0x01
    return flashFired ? 'Flash fired' : 'Flash did not fire'
}

function formatWhiteBalance(wb?: number): string | undefined {
    if (wb === undefined) return undefined
    return wb === 0 ? 'Auto' : 'Manual'
}

function formatMeteringMode(mode?: number): string | undefined {
    const modes: Record<number, string> = {
        1: 'Average',
        2: 'Center-weighted average',
        3: 'Spot',
        4: 'Multi-spot',
        5: 'Pattern',
        6: 'Partial'
    }
    return mode ? modes[mode] : undefined
}

function formatExposureMode(mode?: number): string | undefined {
    const modes: Record<number, string> = {
        0: 'Auto exposure',
        1: 'Manual exposure',
        2: 'Auto bracket'
    }
    return mode !== undefined ? modes[mode] : undefined
}

function formatSceneType(scene?: number): string | undefined {
    const scenes: Record<number, string> = {
        0: 'Standard',
        1: 'Landscape',
        2: 'Portrait',
        3: 'Night scene'
    }
    return scene !== undefined ? scenes[scene] : undefined
}

function formatColorSpace(colorSpace?: number): string | undefined {
    if (colorSpace === 1) return 'sRGB'
    if (colorSpace === 65535) return 'Uncalibrated'
    return colorSpace ? `ColorSpace ${colorSpace}` : undefined
}

function formatResolutionUnit(unit?: number): string | undefined {
    const units: Record<number, string> = {
        1: 'None',
        2: 'inches',
        3: 'cm'
    }
    return unit ? units[unit] : undefined
}

function formatCompression(compression?: number): string | undefined {
    const compressions: Record<number, string> = {
        1: 'Uncompressed',
        6: 'JPEG'
    }
    return compression ? compressions[compression] : undefined
}

function analyzeJPEGStructure(buffer: ArrayBuffer): {
    encoding?: {
        process?: string
        bitsPerSample?: number
        colorComponents?: number
        subSampling?: string
    }
    jfif?: {
        version?: string
        resolutionUnit?: string
        xResolution?: number
        yResolution?: number
    }
} {
    const view = new DataView(buffer)
    let offset = 0
    const result: {
        encoding?: {
            process?: string
            bitsPerSample?: number
            colorComponents?: number
            subSampling?: string
        }
        jfif?: {
            version?: string
            resolutionUnit?: string
            xResolution?: number
            yResolution?: number
        }
    } = { encoding: {}, jfif: {} }

    try {
        // Check for JPEG SOI marker
        if (view.getUint16(0) !== 0xFFD8) return result

        offset = 2
        while (offset < buffer.byteLength - 1) {
            const marker = view.getUint16(offset)

            if ((marker & 0xFF00) !== 0xFF00) break

            const markerType = marker & 0xFF
            offset += 2

            if (markerType === 0xE0) { // APP0 - JFIF
                const length = view.getUint16(offset)
                const identifier = new TextDecoder().decode(buffer.slice(offset + 2, offset + 7))

                if (identifier === 'JFIF\0') {
                    const majorVersion = view.getUint8(offset + 7)
                    const minorVersion = view.getUint8(offset + 8)
                    const units = view.getUint8(offset + 9)
                    const xDensity = view.getUint16(offset + 10)
                    const yDensity = view.getUint16(offset + 12)

                    result.jfif = {
                        version: `${majorVersion}.${minorVersion.toString().padStart(2, '0')}`,
                        resolutionUnit: units === 0 ? 'None' : units === 1 ? 'inches' : 'cm',
                        xResolution: xDensity,
                        yResolution: yDensity
                    }
                }
                offset += length
            } else if (markerType === 0xC0) { // SOF0 - Start of Frame
                const length = view.getUint16(offset)
                const precision = view.getUint8(offset + 2)
                const components = view.getUint8(offset + 7)

                result.encoding = {
                    process: 'Baseline DCT, Huffman coding',
                    bitsPerSample: precision,
                    colorComponents: components,
                    subSampling: components === 3 ? 'YCbCr4:2:0 (2 2)' : undefined
                }

                offset += length
            } else {
                const length = view.getUint16(offset)
                offset += length
            }
        }
    } catch (error) {
        console.warn('Error analyzing JPEG structure:', error)
    }

    return result
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