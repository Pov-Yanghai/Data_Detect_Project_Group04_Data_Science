// 'use client'

// import { useEffect, useState } from 'react'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { trainModel } from '@/lib/api'

// interface UploadedFile {
//   name: string
//   filepath: string
//   columns: string[]
//   rowCount: number
// }

// const MODELS = [
//   { id: 'linear_regression', name: 'Linear Regression', description: 'Best for linear relationships' },
//   { id: 'random_forest', name: 'Random Forest', description: 'Good for complex non-linear patterns' },
//   { id: 'svm', name: 'Support Vector Machine', description: 'Effective for both regression and classification' },
// ]

// export default function MLIntegrationPage() {
//   const [isLoading, setIsLoading] = useState(true)
//   const [isTraining, setIsTraining] = useState(false)
//   const [error, setError] = useState<string>('')
//   const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
//   const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
//   const [selectedTarget, setSelectedTarget] = useState<string>('')
//   const [selectedModel, setSelectedModel] = useState<string>('')
//   const [trainingResults, setTrainingResults] = useState<any>(null)

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
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load file data')
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     loadData()
//   }, [])

//   const handleFeatureToggle = (feature: string) => {
//     setSelectedFeatures(prev =>
//       prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
//     )
//   }

//   const handleTrainModel = async () => {
//     if (!uploadedFile || !selectedModel || selectedFeatures.length === 0 || !selectedTarget) {
//       setError('Please select model, features, and target variable')
//       return
//     }

//     if (selectedFeatures.includes(selectedTarget)) {
//       setError('Target variable cannot be in features')
//       return
//     }

//     setIsTraining(true)
//     setError('')
//     try {
//       const results = await trainModel(uploadedFile.filepath, selectedModel, selectedFeatures, selectedTarget)
//       setTrainingResults(results)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Model training failed')
//     } finally {
//       setIsTraining(false)
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="p-6 text-center">
//         <p className="text-muted-foreground">Loading...</p>
//       </div>
//     )
//   }

//   if (error && !trainingResults) {
//     return (
//       <div className="p-6">
//         <div className="rounded-lg bg-red-50 p-4 border border-red-200">
//           <p className="text-red-900 font-medium">Error: {error}</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6 p-6">
//       <section>
//         <h2 className="text-3xl font-bold text-foreground">ML Model Training</h2>
//         <p className="mt-2 text-muted-foreground">
//           Train machine learning models to predict outcomes
//         </p>
//       </section>

//       {error && (
//         <div className="rounded-lg bg-red-50 p-4 border border-red-200">
//           <p className="text-red-900 text-sm">{error}</p>
//         </div>
//       )}

//       {!trainingResults ? (
//         <>
//           {/* Model Selection */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Select Model</CardTitle>
//               <CardDescription>Choose the machine learning model to train</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-4 md:grid-cols-3">
//                 {MODELS.map(model => (
//                   <button
//                     key={model.id}
//                     onClick={() => setSelectedModel(model.id)}
//                     className={`p-4 rounded-lg border-2 text-left transition-all ${
//                       selectedModel === model.id
//                         ? 'border-primary bg-primary/5'
//                         : 'border-border hover:border-muted-foreground/50'
//                     }`}
//                   >
//                     <h4 className="font-medium text-foreground">{model.name}</h4>
//                     <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
//                   </button>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Feature Selection */}
//           {uploadedFile && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Select Features</CardTitle>
//                 <CardDescription>Choose columns to use as input features</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                   {uploadedFile.columns.map(col => (
//                     <button
//                       key={col}
//                       onClick={() => handleFeatureToggle(col)}
//                       disabled={col === selectedTarget}
//                       className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
//                         selectedFeatures.includes(col)
//                           ? 'border-primary bg-primary/5'
//                           : 'border-border hover:border-muted-foreground/50'
//                       }`}
//                     >
//                       <div className="flex items-center justify-between">
//                         <span className="font-medium text-foreground">{col}</span>
//                         {selectedFeatures.includes(col) && <span className="text-primary">✓</span>}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//                 <p className="text-sm text-muted-foreground mt-4">
//                   Selected: {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''}
//                 </p>
//               </CardContent>
//             </Card>
//           )}

//           {/* Target Variable Selection */}
//           {uploadedFile && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Select Target Variable</CardTitle>
//                 <CardDescription>Choose the variable to predict</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                   {uploadedFile.columns.map(col => (
//                     <button
//                       key={col}
//                       onClick={() => setSelectedTarget(col)}
//                       className={`p-3 rounded-lg border-2 text-left transition-all ${
//                         selectedTarget === col ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
//                       }`}
//                     >
//                       <div className="flex items-center justify-between">
//                         <span className="font-medium text-foreground">{col}</span>
//                         {selectedTarget === col && <span className="text-primary">✓</span>}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Training Controls */}
//           <div className="flex gap-4">
//             <Button
//               onClick={handleTrainModel}
//               disabled={isTraining || !selectedModel || selectedFeatures.length === 0 || !selectedTarget}
//               size="lg"
//               className="flex-1"
//             >
//               {isTraining ? 'Training Model...' : 'Start Training'}
//             </Button>
//           </div>
//         </>
//       ) : (
//         <>
//           {/* Training Results */}
//           <Card className="border-green-200 bg-green-50">
//             <CardContent className="pt-6">
//               <p className="text-green-900 font-medium">✓ Model training completed successfully!</p>
//             </CardContent>
//           </Card>

//           {/* Model Information */}
//           <div className="grid gap-4 md:grid-cols-2">
//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium text-muted-foreground">Model Type</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg font-bold text-foreground">
//                   {MODELS.find(m => m.id === selectedModel)?.name}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium text-muted-foreground">Training Samples</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg font-bold text-foreground">{trainingResults.training_samples.toLocaleString()}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium text-muted-foreground">Test Samples</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg font-bold text-foreground">{trainingResults.test_samples.toLocaleString()}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium text-muted-foreground">Test R² Score</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg font-bold text-foreground">
//                   {(trainingResults.metrics.test.r2 * 100).toFixed(2)}%
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Performance Metrics */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Performance Metrics</CardTitle>
//               <CardDescription>Training and testing metrics</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-6 md:grid-cols-2">
//                 <div className="space-y-3">
//                   <h4 className="font-medium text-foreground">Training Metrics</h4>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">MSE:</span>
//                       <span className="font-medium">{trainingResults.metrics.train.mse.toFixed(4)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">RMSE:</span>
//                       <span className="font-medium">{trainingResults.metrics.train.rmse.toFixed(4)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">MAE:</span>
//                       <span className="font-medium">{trainingResults.metrics.train.mae.toFixed(4)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">R² Score:</span>
//                       <span className="font-medium">{trainingResults.metrics.train.r2.toFixed(4)}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <h4 className="font-medium text-foreground">Testing Metrics</h4>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">MSE:</span>
//                       <span className="font-medium">{trainingResults.metrics.test.mse.toFixed(4)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">RMSE:</span>
//                       <span className="font-medium">{trainingResults.metrics.test.rmse.toFixed(4)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">MAE:</span>
//                       <span className="font-medium">{trainingResults.metrics.test.mae.toFixed(4)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">R² Score:</span>
//                       <span className="font-medium">{trainingResults.metrics.test.r2.toFixed(4)}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Feature Importance */}
//           {trainingResults.feature_importance && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Feature Importance</CardTitle>
//                 <CardDescription>How important each feature is for predictions</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   {Object.entries(trainingResults.feature_importance).map(([feature, importance]: [string, any]) => (
//                     <div key={feature}>
//                       <div className="flex justify-between mb-1">
//                         <span className="text-sm font-medium text-foreground">{feature}</span>
//                         <span className="text-sm text-muted-foreground">{(importance * 100).toFixed(1)}%</span>
//                       </div>
//                       <div className="w-full bg-muted rounded-full h-2">
//                         <div
//                           className="bg-primary h-2 rounded-full"
//                           style={{ width: `${importance * 100}%` }}
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Sample Predictions */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Sample Predictions</CardTitle>
//               <CardDescription>First 20 predictions on test set</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Actual</TableHead>
//                       <TableHead>Predicted</TableHead>
//                       <TableHead>Error</TableHead>
//                       <TableHead>Error %</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {trainingResults.predictions.map((pred: any, idx: number) => (
//                       <TableRow key={idx}>
//                         <TableCell>{pred.actual.toFixed(2)}</TableCell>
//                         <TableCell>{pred.predicted.toFixed(2)}</TableCell>
//                         <TableCell className={pred.error < 0 ? 'text-green-600' : 'text-red-600'}>
//                           {pred.error.toFixed(2)}
//                         </TableCell>
//                         <TableCell>{Math.abs(pred.error_percentage).toFixed(2)}%</TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Action Buttons */}
//           <div className="flex gap-4">
//             <Button
//               onClick={() => {
//                 setTrainingResults(null)
//                 setSelectedModel('')
//                 setSelectedFeatures([])
//                 setSelectedTarget('')
//               }}
//               variant="outline"
//               size="lg"
//               className="flex-1"
//             >
//               Train Another Model
//             </Button>
//           </div>
//         </>
//       )}
//     </div>
//   )
// }
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { trainModel } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface UploadedFile {
  name: string
  filepath: string
  columns: string[]
  rowCount: number
}

const MODELS = [
  { id: 'linear_regression', name: 'Linear Regression', description: 'Best for linear relationships' },
  { id: 'random_forest', name: 'Random Forest', description: 'Good for complex non-linear patterns' },
  { id: 'svm', name: 'Support Vector Machine', description: 'Effective for both regression and classification' },
]

export default function MLIntegrationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isTraining, setIsTraining] = useState(false)
  const [error, setError] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [trainingResults, setTrainingResults] = useState<any>(null)

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

        // ✅ Safety check: if columns is missing/invalid, prompt re-upload
        if (!file.columns || !Array.isArray(file.columns) || file.columns.length === 0) {
          setError('File data is incomplete. Please re-upload your file.')
          setIsLoading(false)
          return
        }

        setUploadedFile(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }

  const handleTrainModel = async () => {
    if (!uploadedFile || !selectedModel || selectedFeatures.length === 0 || !selectedTarget) {
      setError('Please select model, features, and target variable')
      return
    }

    if (selectedFeatures.includes(selectedTarget)) {
      setError('Target variable cannot be in features')
      return
    }

    setIsTraining(true)
    setError('')
    try {
      const results = await trainModel(uploadedFile.filepath, selectedModel, selectedFeatures, selectedTarget)
      setTrainingResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Model training failed')
    } finally {
      setIsTraining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // ✅ Show a clear re-upload prompt instead of crashing
  if (error && !trainingResults) {
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-900 font-medium">Error: {error}</p>
        </div>
        {error.includes('re-upload') && (
          <Button onClick={() => {
            sessionStorage.removeItem('uploadedFile')
            router.push('/dashboard/upload')
          }}>
            Go to Upload Page
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">ML Model Training</h2>
        <p className="mt-2 text-muted-foreground">
          Train machine learning models to predict outcomes
        </p>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-900 text-sm">{error}</p>
        </div>
      )}

      {!trainingResults ? (
        <>
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Model</CardTitle>
              <CardDescription>Choose the machine learning model to train</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedModel === model.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <h4 className="font-medium text-foreground">{model.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Selection */}
          {uploadedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Select Features</CardTitle>
                <CardDescription>Choose columns to use as input features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {/* ✅ Safe .map() — columns is guaranteed to be a valid array here */}
                  {uploadedFile.columns.map(col => (
                    <button
                      key={col}
                      onClick={() => handleFeatureToggle(col)}
                      disabled={col === selectedTarget}
                      className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedFeatures.includes(col)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{col}</span>
                        {selectedFeatures.includes(col) && <span className="text-primary">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Selected: {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Target Variable Selection */}
          {uploadedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Select Target Variable</CardTitle>
                <CardDescription>Choose the variable to predict</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {uploadedFile.columns.map(col => (
                    <button
                      key={col}
                      onClick={() => setSelectedTarget(col)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedTarget === col ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{col}</span>
                        {selectedTarget === col && <span className="text-primary">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Controls */}
          <div className="flex gap-4">
            <Button
              onClick={handleTrainModel}
              disabled={isTraining || !selectedModel || selectedFeatures.length === 0 || !selectedTarget}
              size="lg"
              className="flex-1"
            >
              {isTraining ? 'Training Model...' : 'Start Training'}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Training Results */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-900 font-medium">✓ Model training completed successfully!</p>
            </CardContent>
          </Card>

          {/* Model Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Model Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">
                  {MODELS.find(m => m.id === selectedModel)?.name}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Training Samples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">{trainingResults.training_samples.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Test Samples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">{trainingResults.test_samples.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Test R² Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">
                  {(trainingResults.metrics.test.r2 * 100).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Training and testing metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Training Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MSE:</span>
                      <span className="font-medium">{trainingResults.metrics.train.mse.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RMSE:</span>
                      <span className="font-medium">{trainingResults.metrics.train.rmse.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MAE:</span>
                      <span className="font-medium">{trainingResults.metrics.train.mae.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">R² Score:</span>
                      <span className="font-medium">{trainingResults.metrics.train.r2.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Testing Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MSE:</span>
                      <span className="font-medium">{trainingResults.metrics.test.mse.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RMSE:</span>
                      <span className="font-medium">{trainingResults.metrics.test.rmse.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MAE:</span>
                      <span className="font-medium">{trainingResults.metrics.test.mae.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">R² Score:</span>
                      <span className="font-medium">{trainingResults.metrics.test.r2.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Importance */}
          {trainingResults.feature_importance && (
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance</CardTitle>
                <CardDescription>How important each feature is for predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(trainingResults.feature_importance).map(([feature, importance]: [string, any]) => (
                    <div key={feature}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{feature}</span>
                        <span className="text-sm text-muted-foreground">{(importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${importance * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Predictions</CardTitle>
              <CardDescription>First 20 predictions on test set</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Actual</TableHead>
                      <TableHead>Predicted</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Error %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingResults.predictions.map((pred: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{pred.actual.toFixed(2)}</TableCell>
                        <TableCell>{pred.predicted.toFixed(2)}</TableCell>
                        <TableCell className={pred.error < 0 ? 'text-green-600' : 'text-red-600'}>
                          {pred.error.toFixed(2)}
                        </TableCell>
                        <TableCell>{Math.abs(pred.error_percentage).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setTrainingResults(null)
                setSelectedModel('')
                setSelectedFeatures([])
                setSelectedTarget('')
              }}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Train Another Model
            </Button>
          </div>
        </>
      )}
    </div>
  )
}