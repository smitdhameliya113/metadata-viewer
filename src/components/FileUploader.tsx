import React, { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
    onFilesSelect: (files: File[]) => void
    accept?: string
    multiple?: boolean
    maxSize?: number
}

export function FileUploader({
    onFilesSelect,
    accept = "*/*",
    multiple = true,
    maxSize = 50 * 1024 * 1024 // 50MB default
}: FileUploaderProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const validateFiles = useCallback((files: FileList) => {
        const validFiles: File[] = []
        const errors: string[] = []

        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                errors.push(`${file.name} is too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`)
            } else {
                validFiles.push(file)
            }
        })

        if (errors.length > 0) {
            setError(errors.join(', '))
        } else {
            setError(null)
        }

        return validFiles
    }, [maxSize])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = e.dataTransfer.files
        const validFiles = validateFiles(files)

        if (validFiles.length > 0) {
            onFilesSelect(validFiles)
        }
    }, [onFilesSelect, validateFiles])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            const validFiles = validateFiles(files)
            if (validFiles.length > 0) {
                onFilesSelect(validFiles)
            }
        }
    }, [onFilesSelect, validateFiles])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    return (
        <div className="w-full">
            <Card
                className={cn(
                    "relative border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-primary/50",
                    isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <Upload className={cn(
                        "h-12 w-12 mb-4 transition-colors",
                        isDragOver ? "text-primary" : "text-muted-foreground"
                    )} />

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                            {isDragOver ? "Drop files here" : "Upload files to view metadata"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Drag and drop files here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Supports images, videos, audio files, and documents
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        Browse Files
                    </Button>

                    <input
                        id="file-input"
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </CardContent>
            </Card>

            {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}