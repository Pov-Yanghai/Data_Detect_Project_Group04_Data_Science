'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyzeData } from '@/lib/api'

interface UploadedFile {
  name: string
  filepath: string
  columns: string[]
  rowCount: number
}

export default function DistributionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>('')

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
        
        // Set first numeric column as selected
        const numericCols = Object.entries(analysisResult.distributions)
          .filter(([_, data]: [string, any]) => data.count > 0)
          .map(([col, _]: [string, any]) => col)
        if (numericCols.length > 0) {
          setSelectedColumn(numericCols[0])
        }
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

  const distributions = analysis.distributions
  const distributionEntries = Object.entries(distributions).filter(([_, data]: [string, any]) => data.count > 0)
  
  const selectedDist = selectedColumn && distributions[selectedColumn]

  // Create histogram data (10 bins)
  const histogramData = selectedDist
    ? Array.from({ length: 10 }, (_, i) => {
        const min = selectedDist.min
        const max = selectedDist.max
        const range = (max - min) / 10
        const binMin = min + i * range
        const binMax = min + (i + 1) * range
        return {
          range: `${binMin.toFixed(0)}-${binMax.toFixed(0)}`,
          frequency: Math.floor((range / (max - min)) * selectedDist.count),
        }
      })
    : []

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Distribution Analysis</h2>
        <p className="mt-2 text-muted-foreground">
          Analyze the distribution and skewness of numeric columns
        </p>
      </section>

      {/* Column Selection */}
      {distributionEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Column</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {distributionEntries.map(([col, _]: [string, any]) => (
                <button
                  key={col}
                  onClick={() => setSelectedColumn(col)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedColumn === col
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDist && (
        <>
          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mean</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{selectedDist.mean.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Median</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{selectedDist.median.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Std Dev</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{selectedDist.std.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Skewness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{selectedDist.skewness.toFixed(2)}</div>
                <Badge className="mt-2 text-xs">{selectedDist.skew_category}</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution Histogram</CardTitle>
              <CardDescription>Frequency distribution of {selectedColumn}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>Complete statistical summary for {selectedColumn}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Count</p>
                    <p className="text-lg font-medium text-foreground">{selectedDist.count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Min</p>
                    <p className="text-lg font-medium text-foreground">{selectedDist.min.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max</p>
                    <p className="text-lg font-medium text-foreground">{selectedDist.max.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Range</p>
                    <p className="text-lg font-medium text-foreground">{(selectedDist.max - selectedDist.min).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Variance</p>
                    <p className="text-lg font-medium text-foreground">{(selectedDist.std ** 2).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kurtosis</p>
                    <p className="text-lg font-medium text-foreground">{selectedDist.kurtosis.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skewness Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About Skewness</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <span className="font-medium text-foreground">Skewness:</span> Measures asymmetry in distribution.
              </p>
              <p>
                <span className="font-medium text-foreground">Positive Skew:</span> Tail extends to the right, mean {'>'}
                median
              </p>
              <p>
                <span className="font-medium text-foreground">Negative Skew:</span> Tail extends to the left, mean {'<'}
                median
              </p>
              <p>
                <span className="font-medium text-foreground">Categories:</span> Normal: |skew| {'<'} 0.5, Moderate: 0.5-1,
                High: {'>'} 1
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* All Columns Overview */}
      {distributionEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Numeric Columns</CardTitle>
            <CardDescription>Statistical summary for all numeric columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Median</TableHead>
                    <TableHead>Skewness</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionEntries.map(([col, data]: [string, any]) => (
                    <TableRow key={col} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedColumn(col)}>
                      <TableCell className="font-medium">{col}</TableCell>
                      <TableCell>{data.mean.toFixed(2)}</TableCell>
                      <TableCell>{data.median.toFixed(2)}</TableCell>
                      <TableCell>{data.skewness.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            data.skew_category === 'Normal'
                              ? 'bg-green-100 text-green-800'
                              : data.skew_category === 'Moderately Skewed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {data.skew_category}
                        </Badge>
                      </TableCell>
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
