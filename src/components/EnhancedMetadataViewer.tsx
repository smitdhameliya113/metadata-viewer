import React from 'react'
import {
    FileText,
    Calendar,
    HardDrive,
    Image as ImageIcon,
    Video,
    Music,
    Camera,
    MapPin,
    Type,
    AlertTriangle,
    Disc,
    Headphones,
    FileType,
    Hash,
    Code,
    Settings,
    Info,
    Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
    FileAnalysisResult,
    ImageMetadata,
    VideoMetadata,
    AudioMetadata,
    DocumentMetadata,
    GeneralMetadata
} from '@/types/metadata'
import { formatFileSize, formatDuration } from '@/lib/enhanced-metadata-extractor'

interface EnhancedMetadataViewerProps {
    analysisResult: FileAnalysisResult
}

// Type guards for enhanced metadata
interface EncodingInfo {
    process?: string
    bitsPerSample?: number
    colorComponents?: number
    subSampling?: string
}

interface JfifInfo {
    version?: string
    resolutionUnit?: string
    xResolution?: number
    yResolution?: number
}

interface MpegInfo {
    version?: string
    layer?: string
    channelMode?: string
    emphasis?: string
    copyrightFlag?: boolean
    originalMedia?: boolean
}

interface Id3Info {
    size?: number
}

interface PictureInfo {
    mimeType: string
    type: string
    description: string
    size: number
}

interface EnhancedFileMetadata {
    checksum?: string
    rawHeader?: string
    encoding?: EncodingInfo
    jfif?: JfifInfo
}

interface EnhancedImageMetadata extends ImageMetadata, EnhancedFileMetadata {
    megapixels?: number
    jpegQuality?: number
    iccProfile?: string
}

interface EnhancedAudioMetadata extends AudioMetadata, EnhancedFileMetadata {
    mpegInfo?: MpegInfo
    id3Info?: Id3Info
    streams?: unknown[]
    pictureInfo?: PictureInfo[]
}

export function EnhancedMetadataViewer({ analysisResult }: EnhancedMetadataViewerProps) {
    const { metadata, preview, thumbnail, category, errors, warnings } = analysisResult
    const enhancedMetadata = metadata as EnhancedFileMetadata

    const renderErrorsAndWarnings = () => {
        if (!errors && !warnings) return null

        return (
            <Card className="border-destructive/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Issues Detected
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {errors && errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    ))}
                    {warnings && warnings.map((warning, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{warning}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    const renderBasicInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Filename</label>
                            <p className="text-sm break-all font-mono">{metadata.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <label className="text-sm font-medium text-muted-foreground">Filesize:</label>
                            <span className="text-sm">{formatFileSize(metadata.size)}</span>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Filetype</label>
                            <p className="text-sm font-mono uppercase">{metadata.extension || 'Unknown'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Filetypeextension</label>
                            <p className="text-sm font-mono">{metadata.extension}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Mimetype</label>
                            <p className="text-sm font-mono">{metadata.mimeType || 'Unknown'}</p>
                        </div>
                        {metadata.detectedMimeType && metadata.detectedMimeType !== metadata.mimeType && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Detected Mimetype</label>
                                <p className="text-sm font-mono text-orange-600">{metadata.detectedMimeType}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        {enhancedMetadata.checksum && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    Checksum
                                </label>
                                <p className="text-sm font-mono break-all">{enhancedMetadata.checksum}</p>
                            </div>
                        )}
                        {metadata.realFileType && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Real File Type</label>
                                <p className="text-sm font-mono">{metadata.realFileType}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <label className="text-sm font-medium text-muted-foreground">Modified:</label>
                            <span className="text-sm">
                                {metadata.lastModified.toLocaleDateString()} {metadata.lastModified.toLocaleTimeString()}
                            </span>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Category</label>
                            <p className="text-sm capitalize">{category}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const renderTechnicalInfo = () => {
        if (!enhancedMetadata.rawHeader && !enhancedMetadata.encoding) return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Technical Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {enhancedMetadata.encoding && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Encoding Process</label>
                            <p className="text-sm">{enhancedMetadata.encoding.process}</p>
                            {enhancedMetadata.encoding.bitsPerSample && (
                                <div className="mt-1">
                                    <label className="text-xs font-medium text-muted-foreground">Bits Per Sample:</label>
                                    <span className="text-sm ml-2">{enhancedMetadata.encoding.bitsPerSample}</span>
                                </div>
                            )}
                            {enhancedMetadata.encoding.colorComponents && (
                                <div className="mt-1">
                                    <label className="text-xs font-medium text-muted-foreground">Color Components:</label>
                                    <span className="text-sm ml-2">{enhancedMetadata.encoding.colorComponents}</span>
                                </div>
                            )}
                            {enhancedMetadata.encoding.subSampling && (
                                <div className="mt-1">
                                    <label className="text-xs font-medium text-muted-foreground">Sub Sampling:</label>
                                    <span className="text-sm ml-2">{enhancedMetadata.encoding.subSampling}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {enhancedMetadata.jfif && (
                        <div>
                            <h4 className="text-sm font-medium mb-2">JFIF Information</h4>
                            <div className="pl-4 space-y-1">
                                {enhancedMetadata.jfif.version && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">JFIF Version:</label>
                                        <span className="text-sm ml-2">{enhancedMetadata.jfif.version}</span>
                                    </div>
                                )}
                                {enhancedMetadata.jfif.resolutionUnit && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Resolution Unit:</label>
                                        <span className="text-sm ml-2">{enhancedMetadata.jfif.resolutionUnit}</span>
                                    </div>
                                )}
                                {enhancedMetadata.jfif.xResolution && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">X Resolution:</label>
                                        <span className="text-sm ml-2">{enhancedMetadata.jfif.xResolution}</span>
                                    </div>
                                )}
                                {enhancedMetadata.jfif.yResolution && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Y Resolution:</label>
                                        <span className="text-sm ml-2">{enhancedMetadata.jfif.yResolution}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {enhancedMetadata.rawHeader && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Raw Header</label>
                            <div className="mt-1 p-2 bg-muted rounded-md">
                                <p className="text-xs font-mono break-all">{enhancedMetadata.rawHeader}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const renderImageInfo = () => {
        const imageData = metadata as EnhancedImageMetadata
        if (category !== 'image') return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Image Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageData.dimensions && (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Image Width:</label>
                                    <p className="text-sm">{imageData.dimensions.width}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Image Height:</label>
                                    <p className="text-sm">{imageData.dimensions.height}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Image Size:</label>
                                    <p className="text-sm">{imageData.dimensions.width}x{imageData.dimensions.height}</p>
                                </div>
                            </>
                        )}
                        {imageData.megapixels && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Megapixels:</label>
                                <p className="text-sm">{imageData.megapixels}</p>
                            </div>
                        )}
                    </div>

                    {imageData.exif && (
                        <div className="space-y-4">
                            {/* Camera Information */}
                            {(imageData.exif.make || imageData.exif.model) && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <Camera className="h-4 w-4" />
                                        Camera Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                                        {imageData.exif.make && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Make:</label>
                                                <p className="text-sm">{imageData.exif.make}</p>
                                            </div>
                                        )}
                                        {imageData.exif.model && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Model:</label>
                                                <p className="text-sm">{imageData.exif.model}</p>
                                            </div>
                                        )}
                                        {imageData.exif.software && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Software:</label>
                                                <p className="text-sm">{imageData.exif.software}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            {(imageData.exif.dateTimeOriginal || imageData.exif.dateTime) && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4" />
                                        Date Information
                                    </h4>
                                    <div className="pl-6 space-y-1">
                                        {imageData.exif.dateTimeOriginal && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Date Time Original:</label>
                                                <p className="text-sm">{imageData.exif.dateTimeOriginal.toLocaleString().replace(',', '')}</p>
                                            </div>
                                        )}
                                        {imageData.exif.dateTime && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Modify Date:</label>
                                                <p className="text-sm">{imageData.exif.dateTime.toLocaleString().replace(',', '')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* GPS Information */}
                            {imageData.exif.gps && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </h4>
                                    <div className="pl-6 space-y-1">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">Coordinates:</label>
                                            <p className="text-sm font-mono">
                                                {imageData.exif.gps.latitude.toFixed(6)}, {imageData.exif.gps.longitude.toFixed(6)}
                                            </p>
                                        </div>
                                        {imageData.exif.gps.altitude && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Altitude:</label>
                                                <p className="text-sm">{imageData.exif.gps.altitude}m</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const renderAudioInfo = () => {
        const audioData = metadata as EnhancedAudioMetadata
        if (category !== 'audio') return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Audio Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Technical Info */}
                    <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Settings className="h-4 w-4" />
                            Technical Information
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                            {audioData.duration && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Duration:</label>
                                    <p className="text-sm">{formatDuration(audioData.duration)} (approx)</p>
                                </div>
                            )}
                            {audioData.bitrate && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Audiobitrate:</label>
                                    <p className="text-sm">{Math.round(audioData.bitrate / 1000)} kbps</p>
                                </div>
                            )}
                            {audioData.sampleRate && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Samplerate:</label>
                                    <p className="text-sm">{audioData.sampleRate}</p>
                                </div>
                            )}
                            {audioData.channels && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Channels:</label>
                                    <p className="text-sm">{audioData.channels === 2 ? 'Stereo' : audioData.channels === 1 ? 'Mono' : audioData.channels}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MPEG Information */}
                    {audioData.mpegInfo && (
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4" />
                                MPEG Information
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                                {audioData.mpegInfo.version && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Mpegaudioversion:</label>
                                        <p className="text-sm">{audioData.mpegInfo.version}</p>
                                    </div>
                                )}
                                {audioData.mpegInfo.layer && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Audiolayer:</label>
                                        <p className="text-sm">{audioData.mpegInfo.layer}</p>
                                    </div>
                                )}
                                {audioData.mpegInfo.channelMode && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Channelmode:</label>
                                        <p className="text-sm">{audioData.mpegInfo.channelMode}</p>
                                    </div>
                                )}
                                {audioData.mpegInfo.emphasis && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Emphasis:</label>
                                        <p className="text-sm">{audioData.mpegInfo.emphasis}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Copyrightflag:</label>
                                    <p className="text-sm">{audioData.mpegInfo.copyrightFlag ? 'true' : 'false'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Originalmedia:</label>
                                    <p className="text-sm">{audioData.mpegInfo.originalMedia ? 'true' : 'false'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ID3 Information */}
                    {audioData.id3Info && (
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Disc className="h-4 w-4" />
                                ID3 Information
                            </h4>
                            <div className="pl-6">
                                {audioData.id3Info.size && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Id3size:</label>
                                        <span className="text-sm ml-2">{audioData.id3Info.size}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Track Information */}
                    {(audioData.title || audioData.artist || audioData.album) && (
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Headphones className="h-4 w-4" />
                                Track Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                                {audioData.title && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Title:</label>
                                        <p className="text-sm">{audioData.title}</p>
                                    </div>
                                )}
                                {audioData.artist && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Artist:</label>
                                        <p className="text-sm">{audioData.artist}</p>
                                    </div>
                                )}
                                {audioData.album && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Album:</label>
                                        <p className="text-sm">{audioData.album}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Picture Information */}
                    {audioData.pictureInfo && audioData.pictureInfo.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Eye className="h-4 w-4" />
                                Picture Information
                            </h4>
                            <div className="pl-6 space-y-2">
                                {audioData.pictureInfo.map((pic, index) => (
                                    <div key={index} className="border rounded p-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Picturemimetype:</label>
                                                <p className="text-sm">{pic.mimeType}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Picturetype:</label>
                                                <p className="text-sm">{pic.type}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Picturedescription:</label>
                                                <p className="text-sm">{pic.description}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Picture:</label>
                                                <p className="text-sm">(Binary data {pic.size} bytes)</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const renderVideoInfo = () => {
        const videoData = metadata as VideoMetadata
        if (category !== 'video') return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Video Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {videoData.duration && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Duration:</label>
                                <p className="text-sm">{formatDuration(videoData.duration)}</p>
                            </div>
                        )}
                        {videoData.dimensions && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Resolution:</label>
                                <p className="text-sm">{videoData.dimensions.width} × {videoData.dimensions.height}</p>
                            </div>
                        )}
                        {videoData.frameRate && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Frame Rate:</label>
                                <p className="text-sm">{videoData.frameRate} fps</p>
                            </div>
                        )}
                        {videoData.bitrate && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Bitrate:</label>
                                <p className="text-sm">{Math.round(videoData.bitrate / 1000)} kbps</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderDocumentInfo = () => {
        const docData = metadata as DocumentMetadata
        if (category !== 'document') return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileType className="h-5 w-5" />
                        Document Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docData.title && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Title:</label>
                                <p className="text-sm">{docData.title}</p>
                            </div>
                        )}
                        {docData.author && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Author:</label>
                                <p className="text-sm">{docData.author}</p>
                            </div>
                        )}
                        {docData.pageCount && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Pages:</label>
                                <p className="text-sm">{docData.pageCount}</p>
                            </div>
                        )}
                        {docData.creationDate && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Created:</label>
                                <p className="text-sm">{docData.creationDate.toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderTextInfo = () => {
        const textData = metadata as GeneralMetadata
        if (category !== 'text') return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Text File Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {textData.lineCount && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Lines:</label>
                                <p className="text-sm">{textData.lineCount.toLocaleString()}</p>
                            </div>
                        )}
                        {textData.wordCount && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Words:</label>
                                <p className="text-sm">{textData.wordCount.toLocaleString()}</p>
                            </div>
                        )}
                        {textData.characterCount && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Characters:</label>
                                <p className="text-sm">{textData.characterCount.toLocaleString()}</p>
                            </div>
                        )}
                        {textData.charset && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Encoding:</label>
                                <p className="text-sm">{textData.charset}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderPreview = () => {
        if (!preview && !thumbnail) return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        {thumbnail && (
                            <div className="mb-4">
                                <img
                                    src={thumbnail}
                                    alt="Album artwork"
                                    className="max-w-32 max-h-32 object-cover rounded-md border"
                                />
                            </div>
                        )}
                        {preview && (
                            <>
                                {category === 'image' && (
                                    <img
                                        src={preview}
                                        alt={metadata.name}
                                        className="max-w-full max-h-64 object-contain rounded-md border"
                                    />
                                )}
                                {category === 'video' && (
                                    <video
                                        src={preview}
                                        controls
                                        className="max-w-full max-h-64 rounded-md border"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                                {category === 'audio' && (
                                    <div className="w-full max-w-md">
                                        <audio
                                            src={preview}
                                            controls
                                            className="w-full"
                                        >
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {renderErrorsAndWarnings()}
            {renderPreview()}
            {renderBasicInfo()}
            {renderTechnicalInfo()}
            {renderImageInfo()}
            {renderAudioInfo()}
            {renderVideoInfo()}
            {renderDocumentInfo()}
            {renderTextInfo()}
        </div>
    )
}