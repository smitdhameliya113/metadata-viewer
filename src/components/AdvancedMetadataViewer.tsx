import React from 'react'
import {
    FileText,
    Calendar,
    HardDrive,
    Image as ImageIcon,
    Video,
    Music,
    Monitor,
    Camera,
    MapPin,
    Type,
    AlertTriangle,
    Palette,
    Disc,
    Headphones,
    FileType
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
import { formatFileSize, formatDuration } from '@/lib/advanced-metadata-extractor'

interface AdvancedMetadataViewerProps {
    analysisResult: FileAnalysisResult
}

export function AdvancedMetadataViewer({ analysisResult }: AdvancedMetadataViewerProps) {
    const { metadata, preview, thumbnail, category, errors, warnings } = analysisResult

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
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-sm break-all">{metadata.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <label className="text-sm font-medium text-muted-foreground">Size:</label>
                            <span className="text-sm">{formatFileSize(metadata.size)}</span>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">MIME Type</label>
                            <p className="text-sm font-mono">{metadata.mimeType || 'Unknown'}</p>
                        </div>
                        {metadata.detectedMimeType && metadata.detectedMimeType !== metadata.mimeType && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Detected Type</label>
                                <p className="text-sm font-mono text-orange-600">{metadata.detectedMimeType}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Extension</label>
                            <p className="text-sm font-mono uppercase">.{metadata.extension}</p>
                        </div>
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
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const renderImageInfo = () => {
        const imageData = metadata as ImageMetadata
        if (category !== 'image' || !imageData.exif) return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Image Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {imageData.dimensions && (
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <label className="text-sm font-medium text-muted-foreground">Resolution:</label>
                            <span className="text-sm">
                                {imageData.dimensions.width} × {imageData.dimensions.height} pixels
                            </span>
                        </div>
                    )}

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
                                        {imageData.exif.lensModel && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Lens:</label>
                                                <p className="text-sm">{imageData.exif.lensModel}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Photo Settings */}
                            {(imageData.exif.iso || imageData.exif.fNumber || imageData.exif.exposureTime || imageData.exif.focalLength) && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <Palette className="h-4 w-4" />
                                        Photo Settings
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                                        {imageData.exif.iso && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">ISO:</label>
                                                <p className="text-sm">{imageData.exif.iso}</p>
                                            </div>
                                        )}
                                        {imageData.exif.fNumber && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Aperture:</label>
                                                <p className="text-sm">f/{imageData.exif.fNumber}</p>
                                            </div>
                                        )}
                                        {imageData.exif.exposureTime && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Shutter:</label>
                                                <p className="text-sm">{imageData.exif.exposureTime}s</p>
                                            </div>
                                        )}
                                        {imageData.exif.focalLength && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Focal Length:</label>
                                                <p className="text-sm">{imageData.exif.focalLength}mm</p>
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

                            {/* Dates */}
                            {(imageData.exif.dateTimeOriginal || imageData.exif.dateTime) && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4" />
                                        Dates
                                    </h4>
                                    <div className="pl-6 space-y-1">
                                        {imageData.exif.dateTimeOriginal && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Taken:</label>
                                                <p className="text-sm">{imageData.exif.dateTimeOriginal.toLocaleString()}</p>
                                            </div>
                                        )}
                                        {imageData.exif.dateTime && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Modified:</label>
                                                <p className="text-sm">{imageData.exif.dateTime.toLocaleString()}</p>
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
        const audioData = metadata as AudioMetadata
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
                            <Headphones className="h-4 w-4" />
                            Technical Information
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                            {audioData.duration && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Duration:</label>
                                    <p className="text-sm">{formatDuration(audioData.duration)}</p>
                                </div>
                            )}
                            {audioData.bitrate && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Bitrate:</label>
                                    <p className="text-sm">{Math.round(audioData.bitrate / 1000)} kbps</p>
                                </div>
                            )}
                            {audioData.sampleRate && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Sample Rate:</label>
                                    <p className="text-sm">{audioData.sampleRate} Hz</p>
                                </div>
                            )}
                            {audioData.channels && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Channels:</label>
                                    <p className="text-sm">{audioData.channels}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Track Information */}
                    {(audioData.title || audioData.artist || audioData.album) && (
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Disc className="h-4 w-4" />
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
                                {audioData.albumArtist && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Album Artist:</label>
                                        <p className="text-sm">{audioData.albumArtist}</p>
                                    </div>
                                )}
                                {audioData.year && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Year:</label>
                                        <p className="text-sm">{audioData.year}</p>
                                    </div>
                                )}
                                {audioData.genre && audioData.genre.length > 0 && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Genre:</label>
                                        <p className="text-sm">{audioData.genre.join(', ')}</p>
                                    </div>
                                )}
                                {audioData.track && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Track:</label>
                                        <p className="text-sm">
                                            {audioData.track.no}{audioData.track.of ? ` of ${audioData.track.of}` : ''}
                                        </p>
                                    </div>
                                )}
                                {audioData.composer && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Composer:</label>
                                        <p className="text-sm">{audioData.composer}</p>
                                    </div>
                                )}
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
                        {docData.subject && (
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Subject:</label>
                                <p className="text-sm">{docData.subject}</p>
                            </div>
                        )}
                        {docData.keywords && docData.keywords.length > 0 && (
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Keywords:</label>
                                <p className="text-sm">{docData.keywords.join(', ')}</p>
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
                        {textData.lineEndings && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Line Endings:</label>
                                <p className="text-sm">{textData.lineEndings}</p>
                            </div>
                        )}
                        {textData.bom !== undefined && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">BOM:</label>
                                <p className="text-sm">{textData.bom ? 'Yes' : 'No'}</p>
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
            {renderImageInfo()}
            {renderAudioInfo()}
            {renderVideoInfo()}
            {renderDocumentInfo()}
            {renderTextInfo()}
        </div>
    )
}