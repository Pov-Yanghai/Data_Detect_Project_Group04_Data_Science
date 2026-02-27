'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { uploadFile } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<Array<Record<string, string>>>([])
  const [columns, setColumns] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      processFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      alert('Please upload a CSV or Excel file')
      return
    }
    setFile(selectedFile)
    
    // Simulate file reading and preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      setColumns(headers)
      
      const preview = lines.slice(1, 11).map(line => {
        const values = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || ''
        })
        return row
      })
      setPreviewData(preview)
    }
    reader.readAsText(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90))
      }, 200)

      const response = await uploadFile(file)
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Store upload metadata in sessionStorage
      sessionStorage.setItem('uploadedFile', JSON.stringify({
        name: response.filename,
        filepath: response.filepath,
        size: response.size,
        columns: response.columns,
        rowCount: response.rowCount,
        preview: response.preview,
      }))

      // Navigate to overview page
      setTimeout(() => {
        router.push('/dashboard/overview')
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Upload Dataset</h2>
        <p className="mt-2 text-muted-foreground">
          Upload a CSV or Excel file to begin analysis
        </p>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm border border-red-200">
          <p className="font-medium text-red-900">Error: {error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select File</CardTitle>
              <CardDescription>Drag and drop or click to select</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="mb-4 text-4xl">📁</div>
                <p className="font-medium text-foreground">
                  {file ? file.name : 'Drag your file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click below to browse
                </p>
              </div>

              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="block mt-4">
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Uploading...</p>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
                </div>
              )}

              {file && (
                <div className="mt-4 space-y-2">
                  <div className="rounded-lg bg-green-50 p-3 text-sm">
                    <p className="font-medium text-green-900">✓ File selected</p>
                    <p className="text-green-700">{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? `Uploading ${uploadProgress}%` : 'Upload & Proceed'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accepted Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">CSV Files</p>
                <p className="text-muted-foreground">Comma-separated values</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Excel Files</p>
                <p className="text-muted-foreground">.xlsx and .xls formats</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Header row required</p>
              <p>✓ Max 100 MB file size</p>
              <p>✓ Consistent column format</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview (First 10 Rows)</CardTitle>
            <CardDescription>{columns.length} columns detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={`${idx}-${col}`} className="text-sm">
                          {row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
