'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FeatureHighlights } from '@/components/landing/feature-highlights'
import { FileUploadDialog } from '@/components/dialogs/file-upload-dialog'
import  { AboutUs, Footer} from '@/components/aboutandfooter/aboutandfooter'
export default function LandingPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      {/* Header Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
              src="/logo.png"
              alt="DataClean Logo"
              className="h-15 w-auto object-contain border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              />
            </div>
            <Button 
              variant="default"
              onClick={() => setShowUploadDialog(true)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-balance text-5xl font-bold text-foreground sm:text-6xl">
              Automated Data Processing & Detection Tool
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Unlock insights from your data with intelligent analysis, automated detection, and professional visualization
            </p>
            <div className="mt-8">
              <Button 
                size="lg"
                onClick={() => setShowUploadDialog(true)}
                className="text-base"
              >
                Upload Dataset
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeatureHighlights />

       <AboutUs />
       <Footer />

      {/* File Upload Dialog */}
      <FileUploadDialog 
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
    </main>
  )
}
