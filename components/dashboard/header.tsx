'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function DashboardHeader() {
  const [fileName, setFileName] = useState<string>('')

  useEffect(() => {
    const fileData = sessionStorage.getItem('uploadedFile')
    if (fileData) {
      const { name } = JSON.parse(fileData)
      setFileName(name)
    }
  }, [])

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {fileName ? `Dataset: ${fileName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fileName && 'Analyze and process your data with advanced tools'}
          </p>
        </div>
      </div>
    </header>
  )
}
