// 'use client'

// import { useEffect, useState } from 'react'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// import { analyzeData, cleanData } from '@/lib/api'

// interface UploadedFile {
//   name: string
//   filepath: string
//   columns: string[]
//   rowCount: number
// }

// const CLEANING_STRATEGIES = [
//   { id: 'drop_missing', label: 'Drop Rows with Missing Values', description: 'Remove any row containing missing data' },
//   { id: 'fill_mean', label: 'Fill with Mean', description: 'Fill numeric columns with their mean value' },
//   { id: 'fill_median', label: 'Fill with Median', description: 'Fill numeric columns with their median value' },
//   { id: 'fill_mode', label: 'Fill with Mode', description: 'Fill columns with their most frequent value' },
//   { id: 'forward_fill', label: 'Forward Fill', description: 'Forward fill then backward fill missing values' },
//   { id: 'interpolate', label: 'Interpolate', description: 'Interpolate missing numeric values' },
// ]

// export default function MissingValuesPage() {
//   const [isLoading, setIsLoading] = useState(true)
//   const [isCleaning, setIsCleaning] = useState(false)
//   const [error, setError] = useState<string>('')
//   const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
//   const [analysis, setAnalysis] = useState<any>(null)

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const fileData = sessionStorage.getItem('uploadedFile')
//         if (!fileData) {
//           setError('No file uploaded')
//           setIsLoading(false)
//           return
//         }

//         const file = JSON.parse(fileData) as UploadedFile
//         setUploadedFile(file)

//         const analysisResult = await analyzeData(file.filepath)
//         setAnalysis(analysisResult)
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load data')
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     loadData()
//   }, [])

//   const handleCleanData = async (method: string) => {
//     if (!uploadedFile || !analysis) return

//     setIsCleaning(true)
//     try {
//       const result = await cleanData(uploadedFile.filepath, method)
//       alert(`Data cleaning successful! Removed ${result.removedRows} rows.`)
      
//       const updatedFile = {
//         ...uploadedFile,
//         rowCount: result.cleanedData.length,
//       }
//       sessionStorage.setItem('uploadedFile', JSON.stringify(updatedFile))
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Data cleaning failed')
//     } finally {
//       setIsCleaning(false)
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="p-6 text-center">
//         <p className="text-muted-foreground">Loading analysis...</p>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="rounded-lg bg-red-50 p-4 border border-red-200">
//           <p className="text-red-900 font-medium">Error: {error}</p>
//         </div>
//       </div>
//     )
//   }

//   if (!analysis) {
//     return <div className="p-6 text-center text-muted-foreground">No data available</div>
//   }

//   const missingData = analysis.missing_values
//   const hasMissingValues = missingData.total_missing > 0
//   const chartData = missingData.columns.map((col: string) => ({
//     name: col,
//     missing: missingData.missing_count[col] || 0,
//     percentage: missingData.missing_percentage[col] || 0,
//   }))

//   return (
//     <div className="space-y-6 p-6">
//       <section>
//         <h2 className="text-3xl font-bold text-foreground">Missing Values Analysis</h2>
//         <p className="mt-2 text-muted-foreground">
//           Identify and handle missing data in your dataset
//         </p>
//       </section>

//       {/* Summary */}
//       <div className="grid gap-4 md:grid-cols-3">
//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Total Missing Cells</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold text-foreground">{missingData.total_missing.toLocaleString()}</div>
//             <p className="text-xs text-muted-foreground mt-1">
//               {((missingData.total_missing / missingData.total_cells) * 100).toFixed(2)}% of all data
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Affected Columns</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold text-foreground">{missingData.columns.length}</div>
//             <p className="text-xs text-muted-foreground mt-1">out of {Object.keys(missingData.missing_percentage).length} total</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <Badge className={hasMissingValues ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
//               {hasMissingValues ? 'Needs Attention' : 'Complete'}
//             </Badge>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Missing Values Chart */}
//       {chartData.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Missing Values by Column</CardTitle>
//             <CardDescription>Count and percentage of missing values</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
//                 <YAxis yAxisId="left" />
//                 <YAxis yAxisId="right" orientation="right" />
//                 <Tooltip />
//                 <Legend />
//                 <Bar yAxisId="left" dataKey="missing" fill="#3b82f6" name="Missing Count" />
//                 <Bar yAxisId="right" dataKey="percentage" fill="#f59e0b" name="Percentage (%)" />
//               </BarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       )}

//       {/* Column Details */}
//       {missingData.columns.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Affected Columns Details</CardTitle>
//             <CardDescription>Missing value information for each column</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {missingData.columns.map((col: string) => (
//                 <div key={col} className="rounded-lg border p-4">
//                   <h4 className="font-medium text-foreground">{col}</h4>
//                   <div className="mt-2 grid gap-2 text-sm">
//                     <p>
//                       <span className="text-muted-foreground">Missing Count:</span>{' '}
//                       <span className="font-medium">{missingData.missing_count[col]}</span>
//                     </p>
//                     <p>
//                       <span className="text-muted-foreground">Percentage:</span>{' '}
//                       <span className="font-medium">{missingData.missing_percentage[col].toFixed(2)}%</span>
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Cleaning Strategies */}
//       {hasMissingValues && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Data Cleaning Strategies</CardTitle>
//             <CardDescription>Choose a strategy to handle missing values</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {CLEANING_STRATEGIES.map((strategy) => (
//                 <div key={strategy.id} className="flex items-center justify-between rounded-lg border p-4">
//                   <div className="flex-1">
//                     <h4 className="font-medium text-foreground">{strategy.label}</h4>
//                     <p className="text-sm text-muted-foreground">{strategy.description}</p>
//                   </div>
//                   <Button
//                     onClick={() => handleCleanData(strategy.id)}
//                     disabled={isCleaning}
//                     size="sm"
//                     className="ml-4"
//                   >
//                     {isCleaning ? 'Processing...' : 'Apply'}
//                   </Button>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {!hasMissingValues && (
//         <Card className="border-green-200 bg-green-50">
//           <CardContent className="pt-6">
//             <p className="text-center text-green-900">✓ Your dataset has no missing values!</p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyzeData, cleanData } from '@/lib/api'

interface UploadedFile {
  name: string
  filepath: string
  columns: string[]
  rowCount: number
}

const CLEANING_STRATEGIES = [
  { id: 'drop_missing', label: 'Drop Rows with Missing Values', description: 'Remove any row containing missing data' },
  { id: 'fill_mean', label: 'Fill with Mean', description: 'Fill numeric columns with their mean value' },
  { id: 'fill_median', label: 'Fill with Median', description: 'Fill numeric columns with their median value' },
  { id: 'fill_mode', label: 'Fill with Mode', description: 'Fill columns with their most frequent value' },
  { id: 'forward_fill', label: 'Forward Fill', description: 'Forward fill then backward fill missing values' },
  { id: 'interpolate', label: 'Interpolate', description: 'Interpolate missing numeric values' },
]

export default function MissingValuesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaning, setIsCleaning] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)

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

  const handleCleanData = async (method: string) => {
    if (!uploadedFile || !analysis) return

    setIsCleaning(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await cleanData(uploadedFile.filepath, method)

      // ✅ Use correct response fields from the fixed API
      setSuccessMessage(
        `${result.summary} — ${result.cleanedRows} rows remaining (${result.removedRows} removed).`
      )

      // Update session with new row count
      const updatedFile = {
        ...uploadedFile,
        rowCount: result.cleanedRows,
      }
      sessionStorage.setItem('uploadedFile', JSON.stringify(updatedFile))
      setUploadedFile(updatedFile)

      // Re-analyze cleaned data to refresh the page stats
      const freshAnalysis = await analyzeData(uploadedFile.filepath)
      setAnalysis(freshAnalysis)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data cleaning failed')
    } finally {
      setIsCleaning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    )
  }

  if (error && !analysis) {
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

  const missingData = analysis.missing_values
  const hasMissingValues = missingData.total_missing > 0
  const chartData = missingData.columns.map((col: string) => ({
    name: col,
    missing: missingData.missing_count[col] || 0,
    percentage: missingData.missing_percentage[col] || 0,
  }))

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Missing Values Analysis</h2>
        <p className="mt-2 text-muted-foreground">
          Identify and handle missing data in your dataset
        </p>
      </section>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="text-green-900 font-medium">✓ {successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-900 font-medium">Error: {error}</p>
        </div>
      )}

      {/* Summary */}
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
            <p className="text-xs text-muted-foreground mt-1">out of {Object.keys(missingData.missing_percentage).length} total</p>
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

      {/* Missing Values Chart */}
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
                <Bar yAxisId="left" dataKey="missing" fill="#3b82f6" name="Missing Count" />
                <Bar yAxisId="right" dataKey="percentage" fill="#f59e0b" name="Percentage (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Column Details */}
      {missingData.columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Affected Columns Details</CardTitle>
            <CardDescription>Missing value information for each column</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {missingData.columns.map((col: string) => (
                <div key={col} className="rounded-lg border p-4">
                  <h4 className="font-medium text-foreground">{col}</h4>
                  <div className="mt-2 grid gap-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Missing Count:</span>{' '}
                      <span className="font-medium">{missingData.missing_count[col]}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Percentage:</span>{' '}
                      <span className="font-medium">{missingData.missing_percentage[col].toFixed(2)}%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleaning Strategies */}
      {hasMissingValues && (
        <Card>
          <CardHeader>
            <CardTitle>Data Cleaning Strategies</CardTitle>
            <CardDescription>Choose a strategy to handle missing values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CLEANING_STRATEGIES.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{strategy.label}</h4>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                  <Button
                    onClick={() => handleCleanData(strategy.id)}
                    disabled={isCleaning}
                    size="sm"
                    className="ml-4"
                  >
                    {isCleaning ? 'Processing...' : 'Apply'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasMissingValues && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-center text-green-900">✓ Your dataset has no missing values!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}