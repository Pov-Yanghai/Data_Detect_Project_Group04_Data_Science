'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FeatureHighlights } from '@/components/landing/feature-highlights'
import { FileUploadDialog } from '@/components/dialogs/file-upload-dialog'
import { AboutUs, Footer } from '@/components/aboutandfooter/aboutandfooter'

/* ─── Floating Particle Canvas ─────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const DOTS = 60
    const dots = Array.from({ length: DOTS }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99,179,237,0.45)'
        ctx.fill()
      })
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(99,179,237,${0.12 * (1 - dist / 110)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

/* ─── Animated Counter ──────────────────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = target / 60
      const tick = () => {
        start = Math.min(start + step, target)
        setCount(Math.floor(start))
        if (start < target) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Scroll Reveal Hook ────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/* ─── Stats Strip ───────────────────────────────────────────────────────────── */
function StatsStrip() {
  const { ref, visible } = useReveal()
  const stats = [
    { label: 'Datasets Processed', value: 124000, suffix: '+' },
    { label: 'Avg. Time Saved', value: 73, suffix: '%' },
    { label: 'Supported Formats', value: 40, suffix: '+' },
    { label: 'Accuracy Rate', value: 99, suffix: '%' },
  ]
  return (
    <div
      ref={ref}
      className="border-y border-blue-900/40 bg-[#0a1628]/80 backdrop-blur-sm"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{ transitionDelay: `${i * 100}ms`, opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
          >
            <p className="text-3xl font-bold text-blue-300 tracking-tight font-mono">
              {visible ? <Counter target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Nav links config ──────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'About',    id: 'about'    },
]

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeNav, setActiveNav] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Smooth scroll with sticky-nav offset
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveNav(id)
  }

  // Highlight active link while scrolling
  useEffect(() => {
    const onScroll = () => {
      for (const { id } of [...NAV_LINKS].reverse()) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 80) {
          setActiveNav(id)
          return
        }
      }
      setActiveNav('')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --bg-deep: #050d1a;
          --bg-mid: #071020;
          --accent: #3b82f6;
          --accent-glow: rgba(59,130,246,0.35);
        }

        body { background: var(--bg-deep); }

        .dc-nav {
          font-family: 'DM Sans', sans-serif;
          background: rgba(7,16,32,0.85);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(59,130,246,0.18);
        }

        .dc-hero-title {
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #e2e8f0 0%, #93c5fd 50%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dc-btn-primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: 1px solid rgba(99,179,237,0.3);
          box-shadow: 0 0 20px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .dc-btn-primary:hover {
          box-shadow: 0 0 36px rgba(59,130,246,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .dc-btn-primary:active { transform: translateY(0); }

        .dc-pill {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 999px;
          border: 1px solid rgba(59,130,246,0.4);
          background: rgba(59,130,246,0.08);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #93c5fd;
          font-family: 'Space Mono', monospace;
        }

        .dc-grid-bg {
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .dc-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }

        .dc-hero-badge { animation: fade-in 0.6s ease both; animation-delay: 0.1s; }
        .dc-hero-h1    { animation: fade-up 0.75s ease both; animation-delay: 0.25s; }
        .dc-hero-sub   { animation: fade-up 0.75s ease both; animation-delay: 0.45s; }
        .dc-hero-cta   { animation: fade-up 0.75s ease both; animation-delay: 0.6s; }
        .dc-hero-card  { animation: fade-up 0.9s ease both; animation-delay: 0.75s; }

        .dc-float      { animation: float-slow 6s ease-in-out infinite; }
        .dc-upload-btn { animation: pulse-ring 2.5s ease-out infinite; }

        .dc-nav-link {
          position: relative;
          font-family: 'DM Sans', sans-serif;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }
        .dc-nav-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 1.5px;
          background: #3b82f6;
          transition: width 0.25s ease;
        }
        .dc-nav-link:hover { color: #e2e8f0 !important; }
        .dc-nav-link:hover::after { width: 100%; }
        .dc-nav-link.active { color: #60a5fa !important; font-weight: 600; }
        .dc-nav-link.active::after { width: 100%; }
      `}</style>

      <main
        className="min-h-screen dc-grid-bg"
        style={{ background: 'var(--bg-deep)', fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Navigation ── */}
        <nav className="dc-nav sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className="flex items-center justify-between h-16"
              style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3">
                 <img
                  src="/logo.png"
                  alt="DataClean Logo"
                  className="h-12 w-22 object-contain rounded-lg"
                   style={{ filter: 'brightness(1.1)' }}
                 />
              </div>

              {/* Links + CTA */}
              <div className="flex items-center gap-6">
                {NAV_LINKS.map(({ label, id }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`dc-nav-link${activeNav === id ? ' active' : ''}`}
                    style={{ color: activeNav === id ? '#60a5fa' : '#94a3b8' }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className="dc-btn-primary px-5 py-2 rounded-lg text-sm text-white"
                  onClick={() => setShowUploadDialog(true)}
                >
                  Get Started →
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden border-b border-blue-900/30 min-h-[90vh] flex items-center">
          <div
            className="dc-glow-orb"
            style={{ width: 600, height: 600, top: -100, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)' }}
          />
          <div
            className="dc-glow-orb"
            style={{ width: 320, height: 320, bottom: 0, right: '10%', background: 'radial-gradient(circle, rgba(99,179,237,0.12) 0%, transparent 70%)' }}
          />
          <ParticleCanvas />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-28">
            <div className="text-center max-w-4xl mx-auto">
              <div className="dc-hero-badge mb-6">
                <span className="dc-pill">✦ AI-Powered Data Intelligence</span>
              </div>

              <h1 className="dc-hero-title dc-hero-h1 text-5xl sm:text-6xl lg:text-7xl leading-[1.08]">
                Automated Data<br />
                <span style={{ color: '#60a5fa', WebkitTextFillColor: '#60a5fa' }}>Processing</span>{' '}
                &amp; Detection
              </h1>

              <p className="dc-hero-sub mt-7 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Unlock insights from your data with intelligent analysis, automated
                anomaly detection, and professional-grade visualizations — in seconds.
              </p>

              <div className="dc-hero-cta mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  className="dc-btn-primary dc-upload-btn px-8 py-3.5 rounded-xl text-white text-base"
                  onClick={() => setShowUploadDialog(true)}
                >
                  Upload Dataset
                </button>
                <button
                  className="px-8 py-3.5 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:border-blue-600 hover:text-white transition-all duration-200"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  View Demo →
                </button>
              </div>

              {/* Floating preview card */}
              <div className="dc-hero-card dc-float mt-16 mx-auto max-w-xl">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(10,22,44,0.7)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-900/30">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="ml-3 text-xs text-slate-500" style={{ fontFamily: "'Space Mono', monospace" }}>
                      dataclean — analysis.py
                    </span>
                  </div>
                  <div className="p-5 text-left text-sm" style={{ fontFamily: "'Space Mono', monospace", lineHeight: 1.7 }}>
                    <p><span className="text-blue-400">import</span> <span className="text-green-300">dataclean</span> <span className="text-blue-400">as</span> dc</p>
                    <p className="mt-1"><span className="text-slate-500"># Auto-detect anomalies in your dataset</span></p>
                    <p className="mt-1">
                      <span className="text-purple-300">result</span> <span className="text-white">=</span>{' '}
                      <span className="text-green-300">dc</span>.<span className="text-yellow-300">analyze</span>
                      <span className="text-white">(</span><span className="text-orange-300">"sales_data.csv"</span><span className="text-white">)</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-green-300">dc</span>.<span className="text-yellow-300">visualize</span>
                      <span className="text-white">(result, format=</span><span className="text-orange-300">"dashboard"</span><span className="text-white">)</span>
                    </p>
                    <p className="mt-3 text-green-400">✓ 1,240 rows processed · 3 anomalies found · Report ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Strip ── */}
        <StatsStrip />

        {/* ── Features Section ── */}
        <div id="features" className="relative">
          <div
            className="dc-glow-orb"
            style={{ width: 500, height: 500, top: '50%', left: '-10%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)' }}
          />
          <FeatureHighlights />
        </div>

        {/* ── About Section ── */}
        <div id="about">
          <AboutUs />
        </div>

        <Footer />

        {/* ── File Upload Dialog ── */}
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
        />
      </main>
    </>
  )
}