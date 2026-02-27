import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'Missing Value Detection',
    description: 'Automatically identify and visualize missing data patterns across every column in your dataset.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" rx="2" />
        <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" strokeWidth="2.5" />
        <path d="M12 3v18M3 12h18" strokeOpacity="0.2" />
      </svg>
    ),
    color: 'text-blue-500',
    bg: 'bg-blue-500/8',
  },
  {
    title: 'Outlier Detection',
    description: 'Spot anomalies and unusual data points using IQR and Z-score statistical methods.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" strokeWidth="2" />
      </svg>
    ),
    color: 'text-rose-500',
    bg: 'bg-rose-500/8',
  },
  {
    title: 'Skewness Analysis',
    description: 'Analyze data distribution, detect skewed patterns, and understand variable behavior.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18" />
        <path d="M4 20 Q6 8 12 10 Q16 11 20 4" />
        <path d="M8 20v-3M12 20v-6M16 20v-4" strokeOpacity="0.35" />
      </svg>
    ),
    color: 'text-violet-500',
    bg: 'bg-violet-500/8',
  },
  {
    title: 'Smart Recommendations',
    description: 'Get intelligent, context-aware suggestions for data cleaning and preprocessing steps.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 22h4" />
        <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7.4V17H9v-1.6l-.7-.4A7 7 0 0 1 12 2z" />
      </svg>
    ),
    color: 'text-amber-500',
    bg: 'bg-amber-500/8',
  },
]

export function FeatureHighlights() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            What you get
          </p>
          <h2 className="text-3xl font-bold text-foreground">
            Everything you need to clean your data
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border border-border bg-card hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className={`w-9 h-9 rounded-lg ${feature.bg} ${feature.color} flex items-center justify-center mb-3`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  )
}