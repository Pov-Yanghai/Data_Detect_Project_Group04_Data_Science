'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { analyzeData } from '@/lib/api'

interface UploadedFile {
  name: string
  filepath: string
  columns: string[]
  rowCount: number
}

export default function OutlierDetectionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [method, setMethod] = useState<'iqr' | 'zscore'>('iqr')

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

        const analysisResult = await analyzeData(file.filepath)
        setAnalysis(analysisResult)
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
        <p className="text-muted-foreground">Loading analysis...</p>
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

  if (!analysis) {
    return <div className="p-6 text-center text-muted-foreground">No data available</div>
  }

  const outlierData = method === 'iqr' ? analysis.outliers.iqr : analysis.outliers.zscore

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Outlier Detection</h2>
        <p className="mt-2 text-muted-foreground">
          Identify and analyze outliers in your dataset using statistical methods
        </p>
      </section>

      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Method</CardTitle>
          <CardDescription>Choose detection method to analyze outliers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setMethod('iqr')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                method === 'iqr'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              IQR Method
            </button>
            <button
              onClick={() => setMethod('zscore')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                method === 'zscore'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Z-Score Method
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {method === 'iqr'
              ? 'IQR (Interquartile Range) method identifies outliers as points beyond 1.5 × IQR from Q1/Q3'
              : 'Z-Score method identifies outliers as points with |z-score| > 3 (more than 3 standard deviations)'}
          </p>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outliers Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{outlierData.total_outliers}</div>
            <p className="text-xs text-muted-foreground mt-1">Using {method.toUpperCase()} method</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Affected Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Object.keys(outlierData.columns).length}</div>
            <p className="text-xs text-muted-foreground mt-1">columns with outliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Outliers by Column */}
      {Object.keys(outlierData.columns).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Outliers by Column</CardTitle>
            <CardDescription>Statistical details for outlier-containing columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Outlier Count</TableHead>
                    <TableHead>Percentage</TableHead>
                    {method === 'iqr' && (
                      <>
                        <TableHead>Lower Bound</TableHead>
                        <TableHead>Upper Bound</TableHead>
                      </>
                    )}
                    {method === 'zscore' && <TableHead>Z-Score Threshold</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(outlierData.columns).map(([col, data]: [string, any]) => (
                    <TableRow key={col}>
                      <TableCell className="font-medium">{col}</TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>{data.percentage.toFixed(2)}%</TableCell>
                      {method === 'iqr' && (
                        <>
                          <TableCell className="text-sm">{data.lower_bound.toFixed(2)}</TableCell>
                          <TableCell className="text-sm">{data.upper_bound.toFixed(2)}</TableCell>
                        </>
                      )}
                      {method === 'zscore' && <TableCell>{data.threshold}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-center text-green-900">✓ No outliers detected in your dataset!</p>
          </CardContent>
        </Card>
      )}

      {/* Methodology Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detection Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          {method === 'iqr' ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">IQR (Interquartile Range):</span> Divides data into quartiles.
              </p>
              <p>
                <span className="font-medium text-foreground">Formula:</span> Outliers = values {'<'} Q1 - 1.5×IQR or {'>'}
                Q3 + 1.5×IQR
              </p>
              <p>
                <span className="font-medium text-foreground">Best for:</span> Non-normal distributions, robust to extreme
                values
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Z-Score:</span> Measures how many standard deviations away
                from the mean.
              </p>
              <p>
                <span className="font-medium text-foreground">Formula:</span> Outliers = |z| {'>'} 3 (3 sigma rule)
              </p>
              <p>
                <span className="font-medium text-foreground">Best for:</span> Normal distributions, statistical analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
