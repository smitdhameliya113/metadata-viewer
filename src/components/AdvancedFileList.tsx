import React from 'react'
import { X, Eye, Download, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { FileAnalysisResult } from '@/types/metadata'
import { formatFileSize, getFileIcon } from '@/lib/advanced-metadata-extractor'

interface FileItem {
    file: File
    analysisResult: FileAnalysisResult
}

interface AdvancedFileListProps {
    files: FileItem[]
    selectedFile: number | null
    onSelectFile: (index: number) => void
    onRemoveFile: (index: number) => void
    onDownloadFile: (file: File) => void
}

export function AdvancedFileList({
    files,
    selectedFile,
    onSelectFile,
    onRemoveFile,
    onDownloadFile
}: AdvancedFileListProps) {
    if (files.length === 0) {
        return null
    }

    return (
        <Card>
            <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {files.map((fileItem, index) => {
                        const { file, analysisResult } = fileItem
                        const { metadata, category, errors, warnings } = analysisResult
                        const isSelected = selectedFile === index
                        const hasIssues = (errors && errors.length > 0) || (warnings && warnings.length > 0)

                        return (
                            <div
                                key={`${file.name}-${index}`}
                                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                  ${isSelected
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                    }
                `}
                                onClick={() => onSelectFile(index)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="text-2xl flex-shrink-0">
                                        {getFileIcon(category)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm truncate">{file.name}</p>
                                            {isSelected && (
                                                <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                                            )}
                                            {hasIssues && (
                                                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{formatFileSize(metadata.size)}</span>
                                            <span>•</span>
                                            <span className="capitalize">{category}</span>
                                            <span>•</span>
                                            <span className="uppercase">.{metadata.extension}</span>
                                            {metadata.detectedMimeType && metadata.detectedMimeType !== metadata.mimeType && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-orange-500">Type mismatch</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDownloadFile(file)
                                        }}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onRemoveFile(index)
                                        }}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}