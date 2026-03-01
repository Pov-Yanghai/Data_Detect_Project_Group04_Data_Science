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

      {/* Success + Download */}
      {successMessage && cleanedFilepath && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-green-900 font-medium">✓ {successMessage}</p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              {isDownloading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Downloading...</>
              ) : '⬇ Download Cleaned CSV'}
            </button>
          </div>
        </div>
      )}

      {/* ✅ Quality Report — shown after cleaning */}
      {qualityReport && <QualityReport quality={qualityReport} />}

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

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Values by Column</CardTitle>
            <CardDescription>Count and percentage of missing values</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left"  dataKey="missing"    fill="#3b82f6" name="Missing Count" />
                <Bar yAxisId="right" dataKey="percentage" fill="#f59e0b" name="Percentage (%)" />
              </BarChart>
            </ResponsiveContainer>
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
                className="min-w-[160px]"
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
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-green-900 font-medium">✓ Your dataset has no missing values!</p>
              <button onClick={handleDownload} disabled={isDownloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium transition-colors">
                {isDownloading ? 'Downloading...' : '⬇ Download Dataset'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}