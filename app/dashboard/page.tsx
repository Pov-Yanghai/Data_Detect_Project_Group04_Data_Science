'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const fileData = sessionStorage.getItem('uploadedFile')
    if (!fileData) {
      router.push('/')
    }
  }, [router])

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <section>
        <h2 className="text-3xl font-bold text-foreground">Welcome to Your Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Select a section from the sidebar to begin analyzing your data
        </p>
      </section>

      {/* Quick Start Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <CardTitle>Data Overview</CardTitle>
                <CardDescription>View dataset statistics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Get a quick summary of your dataset including row count, column information, and data quality metrics.
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/overview'}
              variant="default"
            >
              Explore →
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <CardTitle>Missing Values</CardTitle>
                <CardDescription>Analyze data gaps</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Identify and visualize missing values in your dataset with column-wise analysis and intelligent recommendations.
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/missing-values'}
              variant="default"
            >
              Analyze →
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <CardTitle>Outlier Detection</CardTitle>
                <CardDescription>Find anomalies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Detect outliers and unusual data points using statistical methods like Z-score and IQR analysis.
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/outlier-detection'}
              variant="default"
            >
              Detect →
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📈</span>
              <div>
                <CardTitle>Distribution Analysis</CardTitle>
                <CardDescription>Analyze data patterns</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Explore data distribution and skewness patterns with interactive visualizations and insights.
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/distribution'}
              variant="default"
            >
              Explore →
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Info Section */}
      <section className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="font-semibold text-foreground">💡 Pro Tips</h3>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>• Start with Data Overview to understand your dataset structure</li>
          <li>• Use Missing Values analysis to identify data quality issues</li>
          <li>• Apply Outlier Detection to find anomalies before modeling</li>
          <li>• Analyze Distribution to prepare data for machine learning</li>
        </ul>
      </section>
    </div>
  )
}
