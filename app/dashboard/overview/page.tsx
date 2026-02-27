'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { analyzeData } from '@/lib/api'

interface UploadedFile {
  name: string
  filepath: string
  columns: string[]
  rowCount: number
}

export default function OverviewPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const fileData = sessionStorage.getItem('uploadedFile')
        if (!fileData) {
          setError('No file uploaded')
          setIsLoading(false)
          return
        }

        const file = JSON.parse(fileData) as UploadedFile
        setUploadedFile(file)

        // Fetch analysis from backend
        const analysis = await analyzeData(file.filepath)
        setStats(analysis)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading data analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-900 font-medium">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!stats || !uploadedFile) {
    return <div className="p-6 text-center text-muted-foreground">No data available</div>
  }

  const summary = stats.summary

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Data Overview</h2>
        <p className="mt-2 text-muted-foreground">
          Summary statistics and basic information about your dataset
        </p>
        <p className="mt-1 text-sm text-muted-foreground">File: {uploadedFile.name}</p>
      </section>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.rows.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.columns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duplicate Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.duplicates}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.duplicate_percentage.toFixed(2)}% of data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.memory_usage.toFixed(2)} MB</div>
          </CardContent>
        </Card>
      </div>

      {/* Column Information */}
      <Card>
        <CardHeader>
          <CardTitle>Column Information</CardTitle>
          <CardDescription>Data types and details for each column</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Missing Values</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.column_names.map((col: string) => {
                  const missingCount = stats.missing_values.missing_count[col] || 0
                  const missingPct = stats.missing_values.missing_percentage[col] || 0
                  const hasIssues = missingPct > 10

                  return (
                    <TableRow key={col}>
                      <TableCell className="font-medium">{col}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{summary.column_types[col]}</Badge>
                      </TableCell>
                      <TableCell>
                        {missingCount > 0 ? (
                          <span className="text-sm">
                            {missingCount} ({missingPct.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-sm text-green-600">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasIssues ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Needs Attention</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Good</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quality Report */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Report</CardTitle>
          <CardDescription>Recommendations for improving your dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 border border-blue-200">
                <div className="mt-0.5 text-blue-600">ℹ️</div>
                <p className="text-sm text-blue-900">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
