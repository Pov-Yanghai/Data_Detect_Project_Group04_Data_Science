'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const OverviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const MissingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
    <path d="M15 12h3M15 18h3" strokeOpacity="0.3" />
    <circle cx="8" cy="12" r="1.2" fill="currentColor" stroke="none" opacity="0.4" />
    <circle cx="8" cy="18" r="1.2" fill="currentColor" stroke="none" opacity="0.4" />
  </svg>
)

const OutlierIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" strokeWidth="2" />
  </svg>
)

const DistributionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18" />
    <path d="M5 20 Q7 8 12 8 Q17 8 19 20" />
    <path d="M12 8v3" strokeOpacity="0.4" />
  </svg>
)

const MLIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v4M12 11l-5 6M12 11l5 6" />
  </svg>
)

const navItems = [
  { id: 'overview',     label: 'Data Overview',        href: '/dashboard/overview',          icon: <OverviewIcon /> },
  { id: 'missing',      label: 'Missing Values',        href: '/dashboard/missing-values',    icon: <MissingIcon /> },
  { id: 'outliers',     label: 'Outlier Detection',     href: '/dashboard/outlier-detection', icon: <OutlierIcon /> },
  { id: 'distribution', label: 'Distribution Analysis', href: '/dashboard/distribution',      icon: <DistributionIcon /> },
  { id: 'ml',           label: 'ML Integration',        href: '/dashboard/ml-integration',    icon: <MLIcon /> },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleNewUpload = () => {
    sessionStorage.removeItem('uploadedFile')
    router.push('/')
  }

  const UploadIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )

  const HomeIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )

  return (
    <aside
      className={`flex flex-col border-r border-border bg-card transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-border px-4 py-5">
        {!isCollapsed && (
          <img
          src="/logo.png"
          alt="DataClean Logo"
          className="h-20 w-auto object-contain border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
/>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-7 w-7 p-0 shrink-0"
        >
          {isCollapsed ? '→' : '←'}
        </Button>
      </div>

      {/* Upload new file button */}
      <div className="px-3 py-4 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewUpload}
          className={`w-full gap-2 h-9 ${isCollapsed ? 'px-0 justify-center' : 'justify-start'}`}
        >
          <UploadIcon />
          {!isCollapsed && <span>Upload New File</span>}
        </Button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.id} href={item.href}>
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className={`w-full gap-2.5 ${isCollapsed ? 'px-0 justify-center' : 'justify-start'}`}
          onClick={() => {
            sessionStorage.clear()
            router.push('/')
          }}
        >
          <HomeIcon />
          {!isCollapsed && <span>Back to Home</span>}
        </Button>
      </div>
    </aside>
  )
}