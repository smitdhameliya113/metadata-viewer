export interface FileMetadata {
    name: string
    size: number
    type: string
    lastModified: Date
    extension: string
    mimeType?: string
    detectedMimeType?: string
    realFileType?: string
}

export interface ExifData {
    // Camera Information
    make?: string
    model?: string
    software?: string

    // Photo Settings
    iso?: number
    fNumber?: number
    exposureTime?: string
    focalLength?: number
    focalLengthIn35mm?: number
    flash?: string
    whiteBalance?: string
    meteringMode?: string
    exposureMode?: string
    sceneType?: string

    // Date/Time
    dateTime?: Date
    dateTimeOriginal?: Date
    dateTimeDigitized?: Date

    // GPS Information
    gps?: {
        latitude: number
        longitude: number
        altitude?: number
        speed?: number
        direction?: number
        timestamp?: Date
    }

    // Image Properties
    orientation?: number
    colorSpace?: string
    pixelXDimension?: number
    pixelYDimension?: number
    resolutionUnit?: string
    xResolution?: number
    yResolution?: number

    // Lens Information
    lensModel?: string
    lensMake?: string
    lensSerialNumber?: string

    // Additional Technical Data
    exposureBias?: number
    maxAperture?: number
    subjectDistance?: number
    lightSource?: string
    saturation?: string
    contrast?: string
    sharpness?: string
    brightnessValue?: number
    exposureProgram?: string
}

export interface ImageMetadata extends FileMetadata {
    dimensions?: {
        width: number
        height: number
    }
    colorDepth?: number
    hasAlpha?: boolean
    format?: string
    compression?: string
    exif?: ExifData
    thumbnail?: {
        data: ArrayBuffer
        width: number
        height: number
    }
}

export interface AudioMetadata extends FileMetadata {
    // Basic Audio Properties
    duration?: number
    bitrate?: number
    sampleRate?: number
    channels?: number
    codecProfile?: string

    // Track Information
    title?: string
    artist?: string
    album?: string
    albumArtist?: string
    year?: number
    date?: string
    genre?: string[]
    track?: {
        no: number
        of?: number
    }
    disk?: {
        no: number
        of?: number
    }

    // Extended Metadata
    composer?: string
    conductor?: string
    lyricist?: string
    writer?: string
    publisher?: string
    label?: string
    copyright?: string
    encodedBy?: string
    comment?: string[]
    lyrics?: string[]

    // Technical Information
    format?: {
        container?: string
        codec?: string
        lossless?: boolean
        numberOfChannels?: number
        bitsPerSample?: number
        sampleRate?: number
        duration?: number
        bitrate?: number
    }

    // Album Art
    picture?: {
        format: string
        data: ArrayBuffer
        description?: string
        type?: string
    }[]

    // Additional Tags
    isrc?: string
    barcode?: string
    catalognumber?: string
    musicbrainz?: {
        artistId?: string
        albumId?: string
        trackId?: string
        releaseGroupId?: string
    }
}

export interface VideoMetadata extends FileMetadata {
    duration?: number
    dimensions?: {
        width: number
        height: number
    }
    codec?: string
    container?: string
    bitrate?: number
    frameRate?: number
    aspectRatio?: string
    videoCodec?: string
    audioCodec?: string
    audioChannels?: number
    audioSampleRate?: number
    audioBitrate?: number
    hasSubtitles?: boolean
    createdAt?: Date
    modifiedAt?: Date
}

export interface DocumentMetadata extends FileMetadata {
    title?: string
    author?: string
    subject?: string
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
    pageCount?: number
    version?: string
    keywords?: string[]
    language?: string

    // PDF Specific
    pdfVersion?: string
    isEncrypted?: boolean
    permissions?: {
        printing?: boolean
        modifying?: boolean
        copying?: boolean
        annotating?: boolean
        fillingForms?: boolean
        extracting?: boolean
        assembling?: boolean
        degradedPrinting?: boolean
    }

    // Security
    hasUserPassword?: boolean
    hasOwnerPassword?: boolean
    encryptionAlgorithm?: string
}

export interface ArchiveMetadata extends FileMetadata {
    compressionMethod?: string
    compressionRatio?: number
    fileCount?: number
    uncompressedSize?: number
    isPasswordProtected?: boolean
    comment?: string
    createdWith?: string
    files?: {
        name: string
        size: number
        compressedSize: number
        crc32?: string
        lastModified?: Date
    }[]
}

export interface GeneralMetadata extends FileMetadata {
    charset?: string
    lineEndings?: string
    bom?: boolean
    language?: string
    wordCount?: number
    lineCount?: number
    characterCount?: number
}

export type MetadataType =
    | FileMetadata
    | ImageMetadata
    | VideoMetadata
    | AudioMetadata
    | DocumentMetadata
    | ArchiveMetadata
    | GeneralMetadata

export interface FileAnalysisResult {
    metadata: MetadataType
    preview?: string
    thumbnail?: string
    category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'text' | 'other'
    errors?: string[]
    warnings?: string[]
}