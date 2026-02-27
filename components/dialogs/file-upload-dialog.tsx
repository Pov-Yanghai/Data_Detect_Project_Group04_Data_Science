'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/api'

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FileUploadDialog({ open, onOpenChange }: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith('.csv') || dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      setFile(dropped)
      setError('')
    } else {
      setError('Please upload a CSV or Excel file.')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError('')

    // Tick progress while waiting for real upload
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 8, 85))
    }, 150)

    try {
      const response = await uploadFile(file)
      clearInterval(interval)
      setUploadProgress(100)

      //Store full response — filepath, columns, rowCount all included
      sessionStorage.setItem('uploadedFile', JSON.stringify({
        name: response.filename,
        filepath: response.filepath,
        size: response.size,
        columns: response.columns,
        rowCount: response.rowCount,
      }))

      setTimeout(() => {
        onOpenChange(false)
        router.push('/dashboard/overview')
      }, 400)

    } catch (err) {
      clearInterval(interval)
      setUploadProgress(0)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to get started with data analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('dialog-file-input')?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-muted/30 hover:border-muted-foreground/40'
            }`}
          >
            <div className="mb-2 text-2xl">{file ? '✅' : '📁'}</div>
            <p className="font-medium text-foreground">
              {file ? file.name : 'Drag and drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · click to change`
                : 'CSV or Excel · click to browse'}
            </p>
          </div>

          <input
            id="dialog-file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Progress */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => document.getElementById('dialog-file-input')?.click()}
              disabled={isUploading}
            >
              Browse
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? 'Uploading…' : 'Upload & Analyze'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}