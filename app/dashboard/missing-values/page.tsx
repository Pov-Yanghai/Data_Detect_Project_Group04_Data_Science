'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts'
import { analyzeData, cleanData, downloadCleanedFile } from '@/lib/api'

interface UploadedFile {
  name: string
  filepath: string
  columns: string[]
  rowCount: number
}

const FILL_METHODS = [
  { id: 'fill_mean',    label: 'Mean' },
  { id: 'fill_median',  label: 'Median' },
  { id: 'fill_mode',    label: 'Mode' },
  { id: 'forward_fill', label: 'Forward Fill' },
  { id: 'interpolate',  label: 'Interpolate' },
  { id: 'drop_missing', label: 'Drop Row' },
]

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 36
  const stroke = 6
  const normalizedRadius = radius - stroke
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg height="80" width="80">
          <circle stroke="#e5e7eb" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx="40" cy="40" />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease', transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
            r={normalizedRadius}
            cx="40"
            cy="40"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  )
}

function QualityReport({ quality }: { quality: any }) {
  if (!quality) return null

  const overallColor =
    quality.overall_score >= 80 ? '#22c55e' :
    quality.overall_score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-4">
      {/* Score cards */}
      <Card className={`border-2 ${
        quality.overall_score >= 80 ? 'border-green-200 bg-green-50/50' :
        quality.overall_score >= 60 ? 'border-yellow-200 bg-yellow-50/50' :
        'border-red-200 bg-red-50/50'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Cleaning Quality Report</span>
            <Badge className={
              quality.overall_score >= 80 ? 'bg-green-100 text-green-800' :
              quality.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }>
              {quality.overall_score >= 80 ? 'Excellent' :
               quality.overall_score >= 60 ? 'Good' : 'Needs Work'}
            </Badge>
          </CardTitle>
          <CardDescription>Automatically measured after cleaning</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Score rings */}
          <div className="flex flex-wrap justify-around gap-6 mb-6">
            <ScoreRing score={quality.overall_score}      label="Overall Score"  color={overallColor} />
            <ScoreRing score={quality.completeness_score} label="Completeness"   color="#3b82f6" />
            <ScoreRing score={quality.consistency_score}  label="Consistency"    color="#8b5cf6" />
            <ScoreRing score={Math.min(quality.retention_pct, 100)} label="Row Retention" color="#f59e0b" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-background border p-3 text-center">
              <p className="text-xl font-bold text-foreground">{quality.missing_before.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Missing Before</p>
            </div>
            <div className="rounded-lg bg-background border p-3 text-center">
              <p className="text-xl font-bold text-green-600">{quality.missing_after.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Missing After</p>
            </div>
            <div className="rounded-lg bg-background border p-3 text-center">
              <p className="text-xl font-bold text-foreground">{quality.rows_before.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Rows Before</p>
            </div>
            <div className="rounded-lg bg-background border p-3 text-center">
              <p className={`text-xl font-bold ${quality.rows_removed > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                {quality.rows_after.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Rows After {quality.rows_removed > 0 && `(−${quality.rows_removed})`}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            {quality.recommendations.map((rec: string, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
                  rec.includes('great') || rec.includes('high')
                    ? 'bg-green-50 text-green-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {rec.includes('great') || rec.includes('high') ? '✓' : '⚠'}
                </span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-column summary */}
      {quality.column_summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-Column Cleaning Summary</CardTitle>
            <CardDescription>How many missing values were fixed in each column</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quality.column_summary.map((col: any) => (
                <div key={col.column} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-foreground truncate">{col.column}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${Math.min(col.pct_before, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{col.pct_before}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${col.missing_after === 0 ? 'bg-green-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min(col.pct_after, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{col.pct_after}%</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {col.missing_after === 0 ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">Fixed</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">{col.missing_after} left</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-400 inline-block"/>Before</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-green-400 inline-block"/>After (fixed)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-400 inline-block"/>After (remaining)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consistency checks */}
      {quality.consistency_checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution Consistency Check</CardTitle>
            <CardDescription>How much each column's mean and std shifted after cleaning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Column</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Mean Before</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Mean After</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Mean Shift</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Std Shift</th>
                    <th className="text-center py-2 pl-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quality.consistency_checks.map((check: any) => (
                    <tr key={check.column} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{check.column}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{check.mean_before}</td>
                      <td className="text-right py-2 px-2">{check.mean_after}</td>
                      <td className={`text-right py-2 px-2 font-medium ${
                        check.mean_shift > 10 ? 'text-red-600' :
                        check.mean_shift > 5  ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {check.mean_shift > 0 ? '+' : ''}{check.mean_shift}%
                      </td>
                      <td className={`text-right py-2 px-2 font-medium ${
                        check.std_shift > 15 ? 'text-red-600' :
                        check.std_shift > 10 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {check.std_shift > 0 ? '+' : ''}{check.std_shift}%
                      </td>
                      <td className="text-center py-2 pl-2">
                        <Badge className={
                          check.status === 'good'    ? 'bg-green-100 text-green-800' :
                          check.status === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                                                       'bg-red-100 text-red-800'
                        }>
                          {check.status === 'good' ? '✓ Good' :
                           check.status === 'caution' ? '⚠ Caution' : '✗ Warning'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function MissingValuesPage() {
  const [isLoading, setIsLoading]             = useState(true)
  const [applyingMethod, setApplyingMethod]   = useState<string>('')
  const [isDownloading, setIsDownloading]     = useState(false)
  const [error, setError]                     = useState<string>('')
  const [successMessage, setSuccessMessage]   = useState<string>('')
  const [uploadedFile, setUploadedFile]       = useState<UploadedFile | null>(null)
  const [analysis, setAnalysis]               = useState<any>(null)
  const [cleanedFilepath, setCleanedFilepath] = useState<string>('')
  const [qualityReport, setQualityReport]     = useState<any>(null)
  const [columnMethods, setColumnMethods]     = useState<Record<string, string>>({})
  const isCleaningRef                         = useRef(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const fileData = sessionStorage.getItem('uploadedFile')
        if (!fileData) { setError('No file uploaded'); setIsLoading(false); return }

        const file = JSON.parse(fileData) as UploadedFile
        setUploadedFile(file)

        const analysisResult = await analyzeData(file.filepath)
        setAnalysis(analysisResult)

        const defaults: Record<string, string> = {}
        analysisResult.missing_values.columns.forEach((col: string) => {
          defaults[col] = 'skip'
        })
        setColumnMethods(defaults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const setMethodForColumn = (col: string, method: string) =>
    setColumnMethods(prev => ({ ...prev, [col]: method }))

  const setMethodForAll = (method: string) =>
    setColumnMethods(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(col => { updated[col] = method })
      return updated
    })

  const handleApplySelected = async () => {
    if (!uploadedFile || !analysis || isCleaningRef.current) return

    const colsToClean = Object.entries(columnMethods).filter(([_, m]) => m !== 'skip')
    if (colsToClean.length === 0) {
      setError('No columns selected. Choose a method for at least one column.')
      return
    }

    isCleaningRef.current = true
    setError('')
    setSuccessMessage('')
    setQualityReport(null)

    try {
      let lastResult: any = null

      // Group by method and call once per method
      const methodGroups: Record<string, string[]> = {}
      colsToClean.forEach(([col, method]) => {
        if (!methodGroups[method]) methodGroups[method] = []
        methodGroups[method].push(col)
      })

      for (const [method, cols] of Object.entries(methodGroups)) {
        setApplyingMethod(method)
        lastResult = await cleanData(uploadedFile.filepath, method, cols)
      }

      if (lastResult) {
        setSuccessMessage(`Cleaned ${colsToClean.length} column${colsToClean.length > 1 ? 's' : ''} successfully`)
        setCleanedFilepath(lastResult.filepath)
        setQualityReport(lastResult.quality)  // ✅ show quality report

        const updatedFile = { ...uploadedFile, rowCount: lastResult.cleanedRows }
        sessionStorage.setItem('uploadedFile', JSON.stringify(updatedFile))
        setUploadedFile(updatedFile)

        const freshAnalysis = await analyzeData(lastResult.filepath)
        setAnalysis(freshAnalysis)

        const newDefaults: Record<string, string> = {}
        freshAnalysis.missing_values.columns.forEach((col: string) => {
          newDefaults[col] = 'skip'
        })
        setColumnMethods(newDefaults)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleaning failed')
    } finally {
      isCleaningRef.current = false
      setApplyingMethod('')
    }
  }

  const handleDownload = async () => {
    if (!uploadedFile) return
    setIsDownloading(true)
    setError('')
    try {
      await downloadCleanedFile(cleanedFilepath || uploadedFile.filepath, uploadedFile.name)
    } catch {
      setError('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) return <div className="p-6 text-center"><p className="text-muted-foreground">Loading analysis...</p></div>
  if (error && !analysis) return (
    <div className="p-6">
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-red-900 font-medium">Error: {error}</p>
      </div>
    </div>
  )
  if (!analysis) return <div className="p-6 text-center text-muted-foreground">No data available</div>

  const missingData      = analysis.missing_values
  const hasMissingValues = missingData.total_missing > 0
  const chartData        = missingData.columns.map((col: string) => ({
    name:       col,
    missing:    missingData.missing_count[col]      || 0,
    percentage: missingData.missing_percentage[col] || 0,
  }))
  const selectedCount = Object.values(columnMethods).filter(m => m !== 'skip').length

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Missing Values Analysis</h2>
        <p className="mt-2 text-muted-foreground">Identify and handle missing data in your dataset</p>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-900 font-medium">Error: {error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-green-900 font-medium">✓ {successMessage}</p>
        </div>
      )}

      {/* ✅ Quality Report — shown after cleaning */}
      {qualityReport && <QualityReport quality={qualityReport} />}

      {/* Download Section - Clean and Professional */}
      {cleanedFilepath && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Your Cleaned Dataset is Ready</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Download your processed dataset with all missing values handled according to your selected methods
                </p>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                size="lg"
                className="mt-2 min-w-50 h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Cleaned Dataset
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Missing Cells</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{missingData.total_missing.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((missingData.total_missing / missingData.total_cells) * 100).toFixed(2)}% of all data
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Affected Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{missingData.columns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {Object.keys(analysis.summary.column_types).length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={hasMissingValues ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
              {hasMissingValues ? 'Needs Attention' : 'Complete'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Chart - Professional Dashboard Style */}
      {chartData.length > 0 && (
        <Card className="border-2 shadow-sm">
          <CardHeader className="border-b bg-linear-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Missing Values by Column
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Distribution of missing data across your dataset columns
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {chartData.length} {chartData.length === 1 ? 'column' : 'columns'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Chart */}
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 30, left: 10, bottom: 80 }}
                >
                  <defs>
                    <linearGradient id="colorMissing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                    label={{ value: 'Missing Count', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontWeight: 600, fontSize: 12 } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                    label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontWeight: 600, fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="missing" 
                    fill="url(#colorMissing)" 
                    name="Missing Count"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="percentage" 
                    fill="url(#colorPercentage)" 
                    name="Percentage (%)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.max(...chartData.map((d: any) => d.missing)).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Highest Count</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {Math.max(...chartData.map((d: any) => d.percentage)).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Max Percentage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {(chartData.reduce((sum: number, d: any) => sum + d.missing, 0) / chartData.length).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Avg per Column</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {chartData.reduce((sum: number, d: any) => sum + d.missing, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Missing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-column method selector */}
      {hasMissingValues && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Choose Cleaning Method Per Column</CardTitle>
                <CardDescription className="mt-1">Select a method for each column — leave as "Skip" to ignore</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground self-center">Apply all:</span>
                {FILL_METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethodForAll(m.id)}
                    className="px-3 py-1 text-xs rounded-md border border-border hover:border-primary hover:text-primary transition-colors">
                    {m.label}
                  </button>
                ))}
                <button onClick={() => setMethodForAll('skip')}
                  className="px-3 py-1 text-xs rounded-md border border-border hover:border-red-400 hover:text-red-500 transition-colors">
                  Skip All
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missingData.columns.map((col: string) => {
                const missing    = missingData.missing_count[col] || 0
                const percentage = missingData.missing_percentage[col] || 0
                const selected   = columnMethods[col] || 'skip'

                return (
                  <div key={col} className={`rounded-lg border p-4 transition-colors ${
                    selected !== 'skip' ? 'border-blue-200 bg-blue-50/50' : 'border-border'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-foreground">{col}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {missing.toLocaleString()} missing · {percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="hidden sm:block w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setMethodForColumn(col, 'skip')}
                          className={`px-3 py-1.5 text-xs rounded-md font-medium border transition-all ${
                            selected === 'skip'
                              ? 'bg-slate-200 border-slate-400 text-slate-700'
                              : 'border-border text-muted-foreground hover:border-slate-400'
                          }`}>
                          Skip
                        </button>
                        {FILL_METHODS.map(method => (
                          <button key={method.id} onClick={() => setMethodForColumn(col, method.id)}
                            className={`px-3 py-1.5 text-xs rounded-md font-medium border transition-all ${
                              selected === method.id
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-border text-muted-foreground hover:border-blue-400 hover:text-blue-600'
                            }`}>
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedCount > 0
                  ? <><span className="font-medium text-foreground">{selectedCount}</span> column{selectedCount > 1 ? 's' : ''} selected</>
                  : 'No columns selected'}
              </p>
              <Button
                onClick={handleApplySelected}
                disabled={!!applyingMethod || selectedCount === 0}
                size="lg"
                className="min-w-40"
              >
                {applyingMethod ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Applying...
                  </span>
                ) : `Apply to ${selectedCount} Column${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No missing values */}
      {!hasMissingValues && (
        <Card className="border-2 border-green-200 bg-green-50/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-green-900">Perfect! No Missing Values Found</h3>
                <p className="text-sm text-green-700/80 max-w-md">
                  Your dataset is complete and ready to use
                </p>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                size="lg"
                className="mt-2 min-w-50 h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Dataset
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}