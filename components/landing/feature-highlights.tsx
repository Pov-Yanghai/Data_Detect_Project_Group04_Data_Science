'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ── Scroll Reveal Hook ────────────────────────────────────────
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

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
    accent: '#60a5fa',
    glow: 'rgba(59,130,246,0.22)',
    border: 'rgba(96,165,250,0.2)',
    bg: 'rgba(59,130,246,0.08)',
    tag: 'Core',
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
    accent: '#fb7185',
    glow: 'rgba(244,63,94,0.22)',
    border: 'rgba(251,113,133,0.2)',
    bg: 'rgba(244,63,94,0.08)',
    tag: 'Statistical',
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
    accent: '#a78bfa',
    glow: 'rgba(139,92,246,0.22)',
    border: 'rgba(167,139,250,0.2)',
    bg: 'rgba(139,92,246,0.08)',
    tag: 'Distribution',
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
    accent: '#fbbf24',
    glow: 'rgba(245,158,11,0.22)',
    border: 'rgba(251,191,36,0.2)',
    bg: 'rgba(245,158,11,0.08)',
    tag: 'AI-Powered',
  },
]

function FeatureCard({ feature, index, parentVisible }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${index * 100}ms, transform 0.65s ease ${index * 100}ms`,
        background: hovered
          ? `linear-gradient(145deg, rgba(10,22,44,0.98), rgba(12,24,48,1))`
          : 'rgba(7,16,32,0.6)',
        border: `1px solid ${hovered ? feature.border : 'rgba(59,130,246,0.08)'}`,
        borderRadius: 16,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered ? `0 16px 48px ${feature.glow}, 0 0 0 1px ${feature.border}` : '0 2px 12px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(10px)',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Top glow on hover */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        background: hovered ? `linear-gradient(90deg, transparent, ${feature.accent}, transparent)` : 'transparent',
        transition: 'background 0.3s ease',
      }} />

      {/* Corner orb */}
      <div style={{
        position: 'absolute',
        top: -20, right: -20,
        width: 100, height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${hovered ? feature.glow : 'transparent'}, transparent 70%)`,
        transition: 'background 0.4s ease',
        pointerEvents: 'none',
      }} />

      {/* Icon + tag row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 42, height: 42,
          borderRadius: 10,
          background: feature.bg,
          border: `1px solid ${feature.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: feature.accent,
          boxShadow: hovered ? `0 0 16px ${feature.glow}` : 'none',
          transition: 'box-shadow 0.3s ease',
          flexShrink: 0,
        }}>
          {feature.icon}
        </div>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: feature.accent,
          opacity: 0.7,
          padding: '3px 8px',
          border: `1px solid ${feature.border}`,
          borderRadius: 999,
          background: feature.bg,
        }}>
          {feature.tag}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        fontWeight: 700,
        color: hovered ? '#e2e8f0' : '#cbd5e1',
        lineHeight: 1.3,
        margin: 0,
        transition: 'color 0.25s ease',
      }}>
        {feature.title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: '#475569',
        lineHeight: 1.65,
        margin: 0,
      }}>
        {feature.description}
      </p>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0,
        height: 2,
        width: hovered ? '100%' : '0%',
        background: `linear-gradient(90deg, ${feature.accent}, transparent)`,
        borderRadius: '0 0 16px 16px',
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

export function FeatureHighlights() {
  const headingReveal = useReveal()
  const gridReveal = useReveal()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      <section style={{
        background: 'linear-gradient(180deg, #060e1d 0%, #050d1a 100%)',
        padding: '96px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient background orbs */}
        <div style={{
          position: 'absolute',
          width: 500, height: 300,
          top: 0, right: '5%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: 400, height: 300,
          bottom: 0, left: '5%',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

          {/* Heading */}
          <div
            ref={headingReveal.ref}
            style={{
              textAlign: 'center',
              marginBottom: 52,
              opacity: headingReveal.visible ? 1 : 0,
              transform: headingReveal.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
          >
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#3b82f6',
              display: 'inline-block',
              padding: '4px 14px',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 999,
              background: 'rgba(59,130,246,0.07)',
              marginBottom: 16,
            }}>
              ✦ What you get
            </span>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #93c5fd 60%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.15,
              margin: 0,
            }}>
              Everything you need to<br />clean your data
            </h2>
            <p style={{
              marginTop: 14,
              fontSize: 14,
              color: '#475569',
              fontFamily: "'DM Sans', sans-serif",
              maxWidth: 420,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}>
              Powerful analysis tools that turn raw, messy datasets into clean, trustworthy data — automatically.
            </p>
          </div>

          {/* Cards grid */}
          <div
            ref={gridReveal.ref}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {features.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={i}
                parentVisible={gridReveal.visible}
              />
            ))}
          </div>

        </div>
      </section>
    </>
  )
}