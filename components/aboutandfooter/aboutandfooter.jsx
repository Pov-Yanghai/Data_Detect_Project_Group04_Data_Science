import { useState } from "react";

// ── Team Data ────────────────────────────────────────────────
const team = [
  { name: "Pov Yanghai",     role: "UI/UX Designer",     initials: "PY" },
  { name: "Khean SievLinh",  role: "Frontend Developer", initials: "KS" },
  { name: "Ouk Vatana",      role: "Backend Developer",  initials: "OV" },
  { name: "Soy Dycheny",     role: "Data Engineer",      initials: "SD" },
  { name: "Deng Rithypanha", role: "ML Engineer",        initials: "DR" },
];

const avatarColors = [
  { bg: "bg-blue-500/15",    text: "text-blue-500",    ring: "ring-blue-500/30"    },
  { bg: "bg-violet-500/15",  text: "text-violet-500",  ring: "ring-violet-500/30"  },
  { bg: "bg-rose-500/15",    text: "text-rose-500",    ring: "ring-rose-500/30"    },
  { bg: "bg-amber-500/15",   text: "text-amber-500",   ring: "ring-amber-500/30"   },
  { bg: "bg-emerald-500/15", text: "text-emerald-500", ring: "ring-emerald-500/30" },
];

// ── Purpose items with icons ──────────────────────────────────
const purposeItems = [
  {
    number: "01",
    title: "Upload & Explore",
    description: "Upload datasets easily and explore data structure at a glance.",
    accent: "text-blue-500",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
  },
  {
    number: "02",
    title: "Select & Configure",
    description: "Pick features and target variables for model training — no code needed.",
    accent: "text-violet-500",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
  },
  {
    number: "03",
    title: "Train Models",
    description: "Run Linear Regression, Random Forest, or SVM with a single click.",
    accent: "text-rose-500",
    border: "border-rose-500/20",
    bg: "bg-rose-500/5",
  },
  {
    number: "04",
    title: "Visualize Results",
    description: "See metrics, predictions, and feature importance in real-time charts.",
    accent: "text-amber-500",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
];

// ── Member Card ───────────────────────────────────────────────
function MemberCard({ member, colorScheme, index }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`relative w-24 h-24 rounded-full overflow-hidden ring-2 ${colorScheme.ring} ${colorScheme.bg} flex items-center justify-center`}>
        {!imgError ? (
          <img
            src="/profile.png"
            alt={member.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={`text-xl font-bold tracking-tight ${colorScheme.text}`}>
            {member.initials}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground leading-tight">{member.name}</p>
        <p className={`mt-1 text-xs font-medium ${colorScheme.text}`}>{member.role}</p>
      </div>
    </div>
  );
}

// ── About Us Section ──────────────────────────────────────────
export function AboutUs() {
  return (
    <section className="bg-muted/30 py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            The Team
          </p>
          <h2 className="text-4xl font-bold text-foreground">Meet Group 4</h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed">
            We are a passionate team of five dedicated to simplifying data science workflows.
            Each of us contributes to creating a robust platform that transforms messy datasets into actionable insights.
          </p>
        </div>

        {/* Team Cards */}
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((member, i) => (
            <MemberCard
              key={member.name}
              member={member}
              colorScheme={avatarColors[i % avatarColors.length]}
              index={i}
            />
          ))}
        </div>

        {/* ── Our Purpose — redesigned ─────────────────────────── */}
        <div className="mt-20">
          {/* Section label + headline */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Our Purpose
            </p>
            <h3 className="text-3xl font-bold text-foreground">
              Making Data Science Accessible
            </h3>
            <p className="mt-4 max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">DataClean</span> was born from the challenge of working
              with unorganized datasets. We remove barriers so you can focus on insights, not formatting.
            </p>
          </div>

          {/* 4-column step cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {purposeItems.map((item) => (
              <div
                key={item.number}
                className={`relative rounded-2xl border ${item.border} ${item.bg} p-6 hover:shadow-md transition-shadow duration-200`}
              >
                {/* Large muted step number */}
                <span className={`text-4xl font-black ${item.accent} opacity-20 leading-none select-none`}>
                  {item.number}
                </span>
                <h4 className={`mt-3 text-sm font-semibold ${item.accent}`}>
                  {item.title}
                </h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom closing sentence */}
          <p className="mt-10 text-center text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            By bridging the gap between raw data and actionable insights, we empower students, researchers,
            and professionals to make smarter decisions quickly and confidently.
          </p>
        </div>
        {/* ── end Our Purpose ─────────────────────────────────── */}

      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-sm font-bold text-foreground tracking-tight">DataClean</span>
            <span className="text-xs text-muted-foreground">Built by Group 4</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {team.map((m) => (
              <span key={m.name} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {m.name}
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Group 4. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}

export default function Preview() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <AboutUs />
      <Footer />
    </div>
  );
}