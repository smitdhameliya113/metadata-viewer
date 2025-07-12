import React from 'react'
import {
    FileText,
    Calendar,
    HardDrive,
    Image as ImageIcon,
    Video,
    Music,
    Clock,
    Monitor,
    Camera,
    MapPin,
    User,
    BookOpen
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MetadataType, ImageMetadata, VideoMetadata, AudioMetadata } from '@/types/metadata'
import { formatFileSize, formatDuration, getFileTypeCategory } from '@/lib/metadata-extractor'

interface MetadataViewerProps {
    metadata: MetadataType
    filePreview?: string
}

export function MetadataViewer({ metadata, filePreview }: MetadataViewerProps) {
    const category = getFileTypeCategory(metadata.mimeType || '', metadata.extension)

    const renderBasicInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Name:</span>
                            <span className="text-sm text-muted-foreground break-all">{metadata.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            <span className="text-sm font-medium">Size:</span>
                            <span className="text-sm text-muted-foreground">{formatFileSize(metadata.size)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Type:</span>
                            <span className="text-sm text-muted-foreground">{metadata.type || 'Unknown'}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Extension:</span>
                            <span className="text-sm text-muted-foreground uppercase">.{metadata.extension}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Modified:</span>
                            <span className="text-sm text-muted-foreground">
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
        if (category !== 'image') return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Image Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {imageData.dimensions && (
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span className="text-sm font-medium">Dimensions:</span>
                            <span className="text-sm text-muted-foreground">
                                {imageData.dimensions.width} × {imageData.dimensions.height} pixels
                            </span>
                        </div>
                    )}
                    {imageData.exif && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Camera Information
                            </h4>
                            <div className="pl-6 space-y-1">
                                {imageData.exif.make && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Camera:</span>
                                        <span className="text-sm text-muted-foreground">{imageData.exif.make} {imageData.exif.model || ''}</span>
                                    </div>
                                )}
                                {imageData.exif.lensModel && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Lens:</span>
                                        <span className="text-sm text-muted-foreground">{imageData.exif.lensModel}</span>
                                    </div>
                                )}
                                {imageData.exif.iso && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">ISO:</span>
                                        <span className="text-sm text-muted-foreground">{imageData.exif.iso}</span>
                                    </div>
                                )}
                                {imageData.exif.focalLength && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Focal Length:</span>
                                        <span className="text-sm text-muted-foreground">{imageData.exif.focalLength}</span>
                                    </div>
                                )}
                                {imageData.exif.fNumber && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Aperture:</span>
                                        <span className="text-sm text-muted-foreground">f/{imageData.exif.fNumber}</span>
                                    </div>
                                )}
                                {imageData.exif.exposureTime && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Shutter Speed:</span>
                                        <span className="text-sm text-muted-foreground">{imageData.exif.exposureTime}</span>
                                    </div>
                                )}
                                {imageData.exif.gps && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-medium">Location:</span>
                                        <span className="text-sm text-muted-foreground">
                                            {imageData.exif.gps.latitude.toFixed(6)}, {imageData.exif.gps.longitude.toFixed(6)}
                                        </span>
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
                        Video Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {videoData.duration && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">Duration:</span>
                            <span className="text-sm text-muted-foreground">{formatDuration(videoData.duration)}</span>
                        </div>
                    )}
                    {videoData.dimensions && (
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span className="text-sm font-medium">Resolution:</span>
                            <span className="text-sm text-muted-foreground">
                                {videoData.dimensions.width} × {videoData.dimensions.height}
                            </span>
                        </div>
                    )}
                    {videoData.codec && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Codec:</span>
                            <span className="text-sm text-muted-foreground">{videoData.codec}</span>
                        </div>
                    )}
                    {videoData.bitrate && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Bitrate:</span>
                            <span className="text-sm text-muted-foreground">{Math.round(videoData.bitrate / 1000)} kbps</span>
                        </div>
                    )}
                    {videoData.frameRate && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Frame Rate:</span>
                            <span className="text-sm text-muted-foreground">{videoData.frameRate} fps</span>
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
                        Audio Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {audioData.duration && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">Duration:</span>
                            <span className="text-sm text-muted-foreground">{formatDuration(audioData.duration)}</span>
                        </div>
                    )}
                    {(audioData.title || audioData.artist || audioData.album) && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Track Information
                            </h4>
                            <div className="pl-6 space-y-1">
                                {audioData.title && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Title:</span>
                                        <span className="text-sm text-muted-foreground">{audioData.title}</span>
                                    </div>
                                )}
                                {audioData.artist && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm font-medium">Artist:</span>
                                        <span className="text-sm text-muted-foreground">{audioData.artist}</span>
                                    </div>
                                )}
                                {audioData.album && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Album:</span>
                                        <span className="text-sm text-muted-foreground">{audioData.album}</span>
                                    </div>
                                )}
                                {audioData.year && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Year:</span>
                                        <span className="text-sm text-muted-foreground">{audioData.year}</span>
                                    </div>
                                )}
                                {audioData.genre && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Genre:</span>
                                        <span className="text-sm text-muted-foreground">{audioData.genre}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {(audioData.bitrate || audioData.sampleRate) && (
                        <div className="space-y-1">
                            {audioData.bitrate && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Bitrate:</span>
                                    <span className="text-sm text-muted-foreground">{Math.round(audioData.bitrate / 1000)} kbps</span>
                                </div>
                            )}
                            {audioData.sampleRate && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Sample Rate:</span>
                                    <span className="text-sm text-muted-foreground">{audioData.sampleRate} Hz</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const renderPreview = () => {
        if (!filePreview) return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        {category === 'image' && (
                            <img
                                src={filePreview}
                                alt={metadata.name}
                                className="max-w-full max-h-64 object-contain rounded-md border"
                            />
                        )}
                        {category === 'video' && (
                            <video
                                src={filePreview}
                                controls
                                className="max-w-full max-h-64 rounded-md border"
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                        {category === 'audio' && (
                            <audio
                                src={filePreview}
                                controls
                                className="w-full max-w-md"
                            >
                                Your browser does not support the audio tag.
                            </audio>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {renderPreview()}
            {renderBasicInfo()}
            {renderImageInfo()}
            {renderVideoInfo()}
            {renderAudioInfo()}
        </div>
    )
}