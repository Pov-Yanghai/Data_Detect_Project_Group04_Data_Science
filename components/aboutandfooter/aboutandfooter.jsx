import { useState, useEffect, useRef } from "react";

// ── Scroll Reveal Hook ────────────────────────────────────────
function useReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Team Data ────────────────────────────────────────────────
const team = [
  { name: "Pov Yanghai",     role: "UI/UX Designer",     initials: "PY" },
  { name: "Khean SievLinh",  role: "Frontend Developer", initials: "KS" },
  { name: "Ouk Vatana",      role: "Backend Developer",  initials: "OV" },
  { name: "Soy Dycheny",     role: "Data Engineer",      initials: "SD" },
  { name: "Deng Rithypanha", role: "ML Engineer",        initials: "DR" },
];

const avatarColors = [
  { bg: "#1e3a5f", text: "#60a5fa", ring: "rgba(96,165,250,0.35)",  glow: "rgba(59,130,246,0.25)"  },
  { bg: "#2d1b4e", text: "#a78bfa", ring: "rgba(167,139,250,0.35)", glow: "rgba(139,92,246,0.25)"  },
  { bg: "#4a1930", text: "#fb7185", ring: "rgba(251,113,133,0.35)", glow: "rgba(244,63,94,0.25)"   },
  { bg: "#3d2c0a", text: "#fbbf24", ring: "rgba(251,191,36,0.35)",  glow: "rgba(245,158,11,0.25)"  },
  { bg: "#0d3326", text: "#34d399", ring: "rgba(52,211,153,0.35)",  glow: "rgba(16,185,129,0.25)"  },
];

const purposeItems = [
  {
    number: "01",
    title: "Upload & Explore",
    description: "Upload datasets easily and explore data structure at a glance.",
    accent: "#60a5fa",
    border: "rgba(96,165,250,0.2)",
    bg: "rgba(59,130,246,0.06)",
    glow: "rgba(59,130,246,0.15)",
    icon: "⬆",
  },
  {
    number: "02",
    title: "Select & Configure",
    description: "Pick features and target variables for model training — no code needed.",
    accent: "#a78bfa",
    border: "rgba(167,139,250,0.2)",
    bg: "rgba(139,92,246,0.06)",
    glow: "rgba(139,92,246,0.15)",
    icon: "⚙",
  },
  {
    number: "03",
    title: "Train Models",
    description: "Run Linear Regression, Random Forest, or SVM with a single click.",
    accent: "#fb7185",
    border: "rgba(251,113,133,0.2)",
    bg: "rgba(244,63,94,0.06)",
    glow: "rgba(244,63,94,0.15)",
    icon: "⚡",
  },
  {
    number: "04",
    title: "Visualize Results",
    description: "See metrics, predictions, and feature importance in real-time charts.",
    accent: "#fbbf24",
    border: "rgba(251,191,36,0.2)",
    bg: "rgba(245,158,11,0.06)",
    glow: "rgba(245,158,11,0.15)",
    icon: "◈",
  },
];

// ── Member Card ───────────────────────────────────────────────
function MemberCard({ member, colorScheme, index, parentVisible }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${index * 90}ms, transform 0.6s ease ${index * 90}ms`,
        background: hovered
          ? `linear-gradient(135deg, rgba(10,22,44,0.95), rgba(15,28,58,0.98))`
          : "rgba(8,18,36,0.7)",
        border: `1px solid ${hovered ? colorScheme.ring : "rgba(59,130,246,0.1)"}`,
        borderRadius: 16,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        cursor: "default",
        boxShadow: hovered ? `0 12px 40px ${colorScheme.glow}, 0 0 0 1px ${colorScheme.ring}` : "0 2px 12px rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          overflow: "hidden",
          background: colorScheme.bg,
          border: `2px solid ${colorScheme.ring}`,
          boxShadow: hovered ? `0 0 20px ${colorScheme.glow}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "box-shadow 0.3s ease",
          flexShrink: 0,
        }}
      >
        {!imgError ? (
          <img
            src="/profile.png"
            alt={member.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: colorScheme.text }}>
            {member.initials}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>
          {member.name}
        </p>
        <p style={{ marginTop: 4, fontSize: 11, fontWeight: 500, color: colorScheme.text, fontFamily: "'Space Mono', monospace" }}>
          {member.role}
        </p>
      </div>
    </div>
  );
}

// ── Purpose Card ──────────────────────────────────────────────
function PurposeCard({ item, index, parentVisible }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${index * 100}ms, transform 0.6s ease ${index * 100}ms`,
        background: hovered ? `${item.bg}` : "rgba(7,16,32,0.5)",
        border: `1px solid ${hovered ? item.border : "rgba(59,130,246,0.08)"}`,
        borderRadius: 16,
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered ? `0 8px 32px ${item.glow}` : "none",
        transition2: "all 0.3s ease",
        backdropFilter: "blur(8px)",
        cursor: "default",
      }}
    >
      {/* Big muted number */}
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 52,
        fontWeight: 900,
        color: item.accent,
        opacity: 0.12,
        lineHeight: 1,
        userSelect: "none",
        display: "block",
      }}>
        {item.number}
      </span>

      {/* Icon */}
      <div style={{ marginTop: -8, fontSize: 20, color: item.accent }}>{item.icon}</div>

      <h4 style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: item.accent, fontFamily: "'DM Sans', sans-serif" }}>
        {item.title}
      </h4>
      <p style={{ marginTop: 6, fontSize: 12, color: "#94a3b8", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
        {item.description}
      </p>

      {/* Corner glow on hover */}
      {hovered && (
        <div style={{
          position: "absolute",
          top: 0, right: 0,
          width: 80, height: 80,
          background: `radial-gradient(circle at top right, ${item.glow}, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

// ── About Us Section ──────────────────────────────────────────
export function AboutUs() {
  const headingReveal = useReveal();
  const teamReveal    = useReveal();
  const purposeReveal = useReveal();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      <section style={{
        background: "linear-gradient(180deg, #050d1a 0%, #060e1d 100%)",
        borderTop: "1px solid rgba(59,130,246,0.15)",
        padding: "96px 0 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Ambient orb */}
        <div style={{
          position: "absolute",
          width: 600,
          height: 400,
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Heading ── */}
          <div
            ref={headingReveal.ref}
            style={{
              textAlign: "center",
              marginBottom: 56,
              opacity: headingReveal.visible ? 1 : 0,
              transform: headingReveal.visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#3b82f6",
              display: "inline-block",
              padding: "4px 14px",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 999,
              background: "rgba(59,130,246,0.07)",
              marginBottom: 16,
            }}>
              ✦ The Team
            </span>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #e2e8f0 0%, #93c5fd 60%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.1,
              margin: 0,
            }}>
              Meet Group 4
            </h2>
            <p style={{
              marginTop: 16,
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: 15,
              color: "#64748b",
              lineHeight: 1.7,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              A passionate team of five dedicated to simplifying data science workflows —
              transforming messy datasets into actionable insights.
            </p>
          </div>

          {/* ── Team Cards ── */}
          <div
            ref={teamReveal.ref}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            {team.map((member, i) => (
              <MemberCard
                key={member.name}
                member={member}
                colorScheme={avatarColors[i % avatarColors.length]}
                index={i}
                parentVisible={teamReveal.visible}
              />
            ))}
          </div>

          {/* ── Divider ── */}
          <div style={{
            margin: "72px 0 56px",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)",
          }} />

          {/* ── Our Purpose ── */}
          <div ref={purposeReveal.ref}>
            <div style={{
              textAlign: "center",
              marginBottom: 44,
              opacity: purposeReveal.visible ? 1 : 0,
              transform: purposeReveal.visible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#a78bfa",
                display: "inline-block",
                padding: "4px 14px",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 999,
                background: "rgba(139,92,246,0.07)",
                marginBottom: 16,
              }}>
                ✦ Our Purpose
              </span>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#e2e8f0",
                margin: 0,
              }}>
                Making Data Science <span style={{ color: "#a78bfa" }}>Accessible</span>
              </h3>
              <p style={{
                marginTop: 14,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
                fontSize: 14,
                color: "#64748b",
                lineHeight: 1.7,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <strong style={{ color: "#93c5fd" }}>DataClean</strong> was born from the challenge of working
                with unorganized datasets. We remove barriers so you can focus on insights, not formatting.
              </p>
            </div>

            {/* 4-column step cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}>
              {purposeItems.map((item, i) => (
                <PurposeCard
                  key={item.number}
                  item={item}
                  index={i}
                  parentVisible={purposeReveal.visible}
                />
              ))}
            </div>

            {/* Closing line */}
            <p style={{
              marginTop: 36,
              textAlign: "center",
              fontSize: 12,
              color: "#475569",
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
              fontFamily: "'DM Sans', sans-serif",
              opacity: purposeReveal.visible ? 1 : 0,
              transition: "opacity 0.8s ease 0.5s",
            }}>
              By bridging the gap between raw data and actionable insights, we empower students, researchers,
              and professionals to make smarter decisions — quickly and confidently.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer style={{
      background: "#030912",
      borderTop: "1px solid rgba(59,130,246,0.12)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}>
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: "#60a5fa",
              letterSpacing: "0.06em",
            }}>
              DataClean
            </span>
            <span style={{ fontSize: 11, color: "#334155", letterSpacing: "0.04em" }}>
              Built by Group 4
            </span>
          </div>

          {/* Team names */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: "center" }}>
            {team.map((m, i) => (
              <span
                key={m.name}
                style={{
                  fontSize: 11,
                  color: avatarColors[i].text,
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                  cursor: "default",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ fontSize: 11, color: "#1e293b", fontFamily: "'Space Mono', monospace" }}>
            © {new Date().getFullYear()} Group 4. All rights reserved.
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.03)",
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}>
          {["Privacy Policy", "Terms of Use", "Contact"].map(link => (
            <span
              key={link}
              style={{
                fontSize: 11,
                color: "#1e3a5f",
                cursor: "pointer",
                transition: "color 0.2s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#3b82f6")}
              onMouseLeave={e => (e.currentTarget.style.color = "#1e3a5f")}
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function Preview() {
  return (
    <div style={{ minHeight: "100vh", background: "#050d1a" }}>
      <AboutUs />
      <Footer />
    </div>
  );
}