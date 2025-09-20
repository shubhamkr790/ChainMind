'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { ipfsService, IPFSUploadResponse, IPFSFileMetadata } from '@/services/ipfsService'
import { toast } from 'react-hot-toast'

interface UploadedFile extends IPFSUploadResponse {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'failed'
  error?: string
  metadata?: IPFSFileMetadata
}

interface FileManagerProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  onFileRemoved?: (ipfsHash: string) => void
  maxFiles?: number
  maxSizeInMB?: number
  allowedTypes?: string[]
  allowDirectoryUpload?: boolean
  showPreview?: boolean
  enableSharing?: boolean
  initialFiles?: UploadedFile[]
}

export default function FileManager({
  onFilesUploaded,
  onFileRemoved,
  maxFiles = 10,
  maxSizeInMB = 100,
  allowedTypes,
  allowDirectoryUpload = true,
  showPreview = true,
  enableSharing = true,
  initialFiles = []
}: FileManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setIsUploading(true)
    const newFiles: UploadedFile[] = []

    try {
      for (const file of acceptedFiles) {
        // Validate file
        try {
          ipfsService.validateFile(file, maxSizeInMB, allowedTypes)
        } catch (error: any) {
          toast.error(`${file.name}: ${error.message}`)
          continue
        }

        // Create initial file entry
        const uploadingFile: UploadedFile = {
          file,
          progress: 0,
          status: 'uploading',
          ipfsHash: '',
          pinSize: 0,
          timestamp: ''
        }

        newFiles.push(uploadingFile)
        setUploadedFiles(prev => [...prev, uploadingFile])

        try {
          // Upload to IPFS
          const metadata: IPFSFileMetadata = {
            name: file.name,
            keyvalues: {
              originalName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date().toISOString(),
              category: 'user-upload'
            }
          }

          const result = await ipfsService.uploadFile(
            file,
            metadata,
            (progress) => {
              setUploadedFiles(prev =>
                prev.map(f =>
                  f.file === file ? { ...f, progress } : f
                )
              )
            }
          )

          // Update file with successful upload
          const completedFile: UploadedFile = {
            ...uploadingFile,
            ...result,
            status: 'completed',
            progress: 100,
            metadata
          }

          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === file ? completedFile : f
            )
          )

          toast.success(`${file.name} uploaded successfully`)

        } catch (error: any) {
          // Update file with error
          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === file 
                ? { ...f, status: 'failed', error: error.message }
                : f
            )
          )
          toast.error(`Failed to upload ${file.name}: ${error.message}`)
        }
      }

      if (onFilesUploaded) {
        onFilesUploaded(uploadedFiles.filter(f => f.status === 'completed'))
      }

    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [uploadedFiles, maxFiles, maxSizeInMB, allowedTypes, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes ? allowedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>) : undefined,
    maxSize: maxSizeInMB * 1024 * 1024,
    disabled: isUploading
  })

  const removeFile = async (file: UploadedFile) => {
    try {
      if (file.status === 'completed' && file.ipfsHash) {
        // Unpin from IPFS
        await ipfsService.unpinFile(file.ipfsHash)
        if (onFileRemoved) {
          onFileRemoved(file.ipfsHash)
        }
      }
      
      setUploadedFiles(prev => prev.filter(f => f !== file))
      toast.success(`${file.file.name} removed`)
    } catch (error: any) {
      console.error('Failed to remove file:', error)
      toast.error(`Failed to remove ${file.file.name}`)
    }
  }

  const downloadFile = async (file: UploadedFile) => {
    if (file.status !== 'completed' || !file.ipfsHash) return

    try {
      const blob = await ipfsService.getFileBlob(file.ipfsHash)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Failed to download file:', error)
      toast.error(`Failed to download ${file.file.name}`)
    }
  }

  const shareFile = async (file: UploadedFile) => {
    if (file.status !== 'completed' || !file.ipfsHash) return

    const shareUrl = ipfsService.getGatewayUrl(file.ipfsHash)
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Share link copied to clipboard')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('zip') || fileType.includes('tar')) return '📦'
    if (fileType.includes('json')) return '📊'
    if (fileType.includes('python')) return '🐍'
    return '📄'
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'text-yellow-400 bg-yellow-400/10'
      case 'completed': return 'text-green-400 bg-green-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return <ClockIcon className="w-4 h-4" />
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />
      case 'failed': return <ExclamationTriangleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const calculateStorageCost = (sizeInBytes: number) => {
    return ipfsService.calculateStorageCost(sizeInBytes).toFixed(4)
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-brand-400 text-lg">Drop files here...</p>
        ) : isUploading ? (
          <div className="space-y-2">
            <p className="text-white text-lg">Uploading files...</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mx-auto max-w-xs">
              <div
                className="bg-gradient-to-r from-brand-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-white text-lg mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {allowedTypes
                ? `Supports: ${allowedTypes.join(', ')} `
                : 'All file types supported '
              }
              (Max {maxSizeInMB}MB per file, {maxFiles} files max)
            </p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Select Files
              </button>
              {allowDirectoryUpload && (
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  <FolderIcon className="w-4 h-4 inline mr-2" />
                  Select Folder
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-white">Uploaded Files ({uploadedFiles.length})</h4>
          
          <div className="space-y-2">
            <AnimatePresence>
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={`${file.file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gray-800/50 rounded-lg border border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">
                        {getFileIcon(file.file.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-white truncate">
                          {file.file.name}
                        </h5>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{formatFileSize(file.file.size)}</span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(file.status)}`}>
                            {getStatusIcon(file.status)}
                            {file.status}
                          </div>
                          {file.status === 'completed' && (
                            <span className="text-green-400">
                              ~${calculateStorageCost(file.file.size)}/month
                            </span>
                          )}
                        </div>
                        
                        {file.status === 'failed' && file.error && (
                          <p className="text-red-400 text-xs mt-1">{file.error}</p>
                        )}
                        
                        {file.status === 'completed' && file.ipfsHash && (
                          <p className="text-brand-400 text-xs mt-1 font-mono">
                            IPFS: {file.ipfsHash.slice(0, 20)}...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Progress bar for uploading files */}
                      {file.status === 'uploading' && (
                        <div className="w-20 h-2 bg-gray-700 rounded-full">
                          <div
                            className="h-2 bg-brand-500 rounded-full transition-all duration-200"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Action buttons for completed files */}
                      {file.status === 'completed' && (
                        <>
                          {showPreview && (
                            <button
                              onClick={() => window.open(ipfsService.getGatewayUrl(file.ipfsHash), '_blank')}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title="View File"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Download File"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          
                          {enableSharing && (
                            <button
                              onClick={() => shareFile(file)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title="Share File"
                            >
                              <ShareIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(file)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Remove File"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Total: {uploadedFiles.length} files, {' '}
                {formatFileSize(uploadedFiles.reduce((acc, f) => acc + f.file.size, 0))}
              </span>
              <span className="text-green-400">
                Est. storage cost: ~$
                {uploadedFiles
                  .filter(f => f.status === 'completed')
                  .reduce((acc, f) => acc + parseFloat(calculateStorageCost(f.file.size)), 0)
                  .toFixed(4)}/month
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
