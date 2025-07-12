import React, { useState, useCallback, useEffect } from 'react'
import { Header } from '@/components/Header'
import { FileUploader } from '@/components/FileUploader'
import { AdvancedFileList } from '@/components/AdvancedFileList'
import { EnhancedMetadataViewer } from '@/components/EnhancedMetadataViewer'
import type { FileAnalysisResult } from '@/types/metadata'
import { analyzeFileEnhanced } from '@/lib/enhanced-metadata-extractor'

interface FileItem {
  file: File
  analysisResult: FileAnalysisResult
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  // Initialize dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev
      localStorage.setItem('darkMode', String(newMode))
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return newMode
    })
  }, [])

  const processFile = useCallback(async (file: File, index: number, total: number): Promise<FileItem> => {
    setProcessingStatus(`Analyzing ${file.name} (${index + 1}/${total})...`)

    try {
      const analysisResult = await analyzeFileEnhanced(file)
      return { file, analysisResult }
    } catch (error) {
      console.error('Error processing file:', error)

      // Create fallback analysis result
      const fallbackResult: FileAnalysisResult = {
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified),
          extension: file.name.split('.').pop()?.toLowerCase() || '',
          mimeType: file.type
        },
        category: 'other',
        errors: [`Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }

      return { file, analysisResult: fallbackResult }
    }
  }, [])

  const handleFilesSelect = useCallback(async (newFiles: File[]) => {
    setIsProcessing(true)
    setProcessingStatus('Starting analysis...')

    try {
      const processedFiles: FileItem[] = []

      // Process files one by one to show progress
      for (let i = 0; i < newFiles.length; i++) {
        const processedFile = await processFile(newFiles[i], i, newFiles.length)
        processedFiles.push(processedFile)

        // Update the files list progressively
        setFiles(prev => [...prev, processedFile])

        // Auto-select the first new file if no file is currently selected
        if (selectedFile === null && i === 0) {
          setSelectedFile(files.length)
        }
      }

      setProcessingStatus(`Successfully analyzed ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`)

      // Clear status after a delay
      setTimeout(() => setProcessingStatus(''), 2000)

    } catch (error) {
      console.error('Error processing files:', error)
      setProcessingStatus('Error occurred during analysis')
      setTimeout(() => setProcessingStatus(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }, [files.length, selectedFile, processFile])

  const handleSelectFile = useCallback((index: number) => {
    setSelectedFile(index)
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)

      // Clean up object URLs
      const fileItem = prev[index]
      if (fileItem?.analysisResult.preview) {
        URL.revokeObjectURL(fileItem.analysisResult.preview)
      }
      if (fileItem?.analysisResult.thumbnail) {
        URL.revokeObjectURL(fileItem.analysisResult.thumbnail)
      }

      // Adjust selected file index
      if (selectedFile === index) {
        setSelectedFile(newFiles.length > 0 ? Math.min(index, newFiles.length - 1) : null)
      } else if (selectedFile !== null && selectedFile > index) {
        setSelectedFile(selectedFile - 1)
      }

      return newFiles
    })
  }, [selectedFile])

  const handleDownloadFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const handleClearAll = useCallback(() => {
    // Clean up all object URLs
    files.forEach(fileItem => {
      if (fileItem.analysisResult.preview) {
        URL.revokeObjectURL(fileItem.analysisResult.preview)
      }
      if (fileItem.analysisResult.thumbnail) {
        URL.revokeObjectURL(fileItem.analysisResult.thumbnail)
      }
    })

    setFiles([])
    setSelectedFile(null)
  }, [files])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(fileItem => {
        if (fileItem.analysisResult.preview) {
          URL.revokeObjectURL(fileItem.analysisResult.preview)
        }
        if (fileItem.analysisResult.thumbnail) {
          URL.revokeObjectURL(fileItem.analysisResult.thumbnail)
        }
      })
    }
  }, [files])

  const selectedFileItem = selectedFile !== null ? files[selectedFile] : null

  // Calculate statistics
  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0)
  const categories = files.reduce((acc, item) => {
    const category = item.analysisResult.category
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const hasErrors = files.some(item => item.analysisResult.errors && item.analysisResult.errors.length > 0)
  const hasWarnings = files.some(item => item.analysisResult.warnings && item.analysisResult.warnings.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Advanced File Metadata Analyzer
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Upload any file to extract comprehensive metadata including EXIF data, audio tags,
              document properties, and technical specifications. Supports images, videos, audio, documents, and more.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="max-w-4xl mx-auto">
            <FileUploader
              onFilesSelect={handleFilesSelect}
              accept="*/*"
              multiple={true}
            />

            {isProcessing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  {processingStatus}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Section */}
          {files.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{files.length}</div>
                  <div className="text-xs text-muted-foreground">Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{(totalSize / (1024 * 1024)).toFixed(1)}MB</div>
                  <div className="text-xs text-muted-foreground">Total Size</div>
                </div>
                {Object.entries(categories).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">{category}</div>
                  </div>
                ))}
                {hasErrors && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-destructive">!</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                )}
                {hasWarnings && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-500">⚠</div>
                    <div className="text-xs text-muted-foreground">Warnings</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File List and Metadata Viewer */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* File List */}
              <div className="lg:col-span-1">
                <AdvancedFileList
                  files={files}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  onRemoveFile={handleRemoveFile}
                  onDownloadFile={handleDownloadFile}
                />

                {files.length > 1 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-destructive hover:text-destructive/80 underline"
                    >
                      Clear all files
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata Viewer */}
              <div className="lg:col-span-2">
                {selectedFileItem ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {selectedFileItem.file.name}
                      </h3>
                      <div className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-md">
                        {selectedFileItem.analysisResult.category}
                      </div>
                    </div>
                    <EnhancedMetadataViewer analysisResult={selectedFileItem.analysisResult} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Select a file from the list to view its comprehensive metadata
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && !isProcessing && (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">🔍</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Ready to analyze files</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Upload any file to extract comprehensive metadata including technical details,
                  embedded information, and file properties.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Advanced Metadata Viewer - Built with React, TypeScript, and specialized metadata libraries</p>
            <p className="text-xs">
              Using: file-type, music-metadata, exifr, pdf-lib for comprehensive file analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
