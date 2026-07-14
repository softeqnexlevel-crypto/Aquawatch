// frontend/src/components/LandingPage.jsx
//
// ── Design notes (read before editing) ─────────────────────────────────────
// Brand: Aqua Systemtech — remote monitoring & chemical-dosing control for
// industrial RO / borehole water treatment plants (Kenya).
// Grounded in the real product photography supplied: steel RO skids, blue
// process piping, HMI touch-panels, field engineers with tablets, and the
// existing droplet+circuit mark (teal → blue gradient).
//
// Token system:
//   Colour   — teal #0EA8A0, blue #0077B6, navy #0A2540, amber #F5A623,
//              steel #64748B, foam-tinted surfaces via existing --card/--background
//   Type     — Space Grotesk (display), Inter (body), IBM Plex Mono (data/eyebrows)
//   Signature— a "schematic line": a P&ID-style pipe/circuit trace (teal→blue,
//              animated flow) that threads through the hero and reappears once
//              more at "How it works" — echoing the droplet mark's circuit
//              lines and the blue pipework in the plant photos.
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  Droplets, FlaskConical, Wrench, FileText,
  ArrowRight, Moon, Sun, Gauge, TrendingUp,
  Menu, X, CheckCircle, BarChart3, ChevronDown,
  Users, Shield, Zap, Clock, Star, Radio, Target,
  Quote, Layers, Phone, Mail
} from "lucide-react";
import { LoginModal } from "./Login";
import { useAuth } from "../contexts/AuthContext";

// ── Real plant photography ──────────────────────────────────────────────────
// Drop the four files from /assets/gallery (shared alongside this component)
// into your project at the path below — adjust the import paths if your
// asset folder is laid out differently.
import plantTabletMonitor from "../assets/gallery/plant-tablet-monitor.png";
import controlRoomDesk from "../assets/gallery/control-room-desk.png";
import roSkidHmi from "../assets/gallery/ro-skid-hmi.png";
import fieldEngineerTablet from "../assets/gallery/field-engineer-tablet.png";

// ── Real brand logo ─────────────────────────────────────────────────────────
// Drop both files from /assets/logo (shared alongside this component) into
// your project at the path below.
//   aqua-systemtech-mark.png  — icon-only crop, used in the compact nav/footer mark
//   aqua-systemtech-logo-full.png — full lockup (icon + wordmark), used where there's room
import logoMark from "../assets/logo/aqua-systemtech-mark.png";
import logoFull from "../assets/logo/aqua-systemtech-logo-full.png";

// ── Brand tokens ───────────────────────────────────────────────────────────
const BRAND = {
  teal: "#0EA8A0",
  tealDeep: "#0B8983",
  blue: "#0077B6",
  navy: "#0A2540",
  amber: "#F5A623",
  steel: "#64748B",
};

const FONT_DISPLAY = "'Space Grotesk', 'Inter', sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'SFMono-Regular', monospace";

// ── Brand mark: real logo (icon crop by default, full lockup optional) ─────
function BrandMark({ size = 28, full = false }) {
  if (full) {
    return <img src={logoFull} alt="Aqua Systemtech" style={{ height: size, width: "auto", display: "block" }} />;
  }
  return <img src={logoMark} alt="Aqua Systemtech" style={{ height: size, width: "auto", display: "block" }} />;
}

// ── Signature element: animated schematic / pipe-trace line ────────────────
function SchematicLine({ className = "", flipY = false }) {
  const uid = useRef(`sl-${Math.random().toString(36).slice(2, 9)}`).current;
  return (
    <svg
      className={`schematic-line ${className}`}
      viewBox="0 0 900 220"
      preserveAspectRatio="none"
      style={{ transform: flipY ? "scaleY(-1)" : "none" }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={BRAND.teal} stopOpacity="0" />
          <stop offset="0.15" stopColor={BRAND.teal} stopOpacity="0.9" />
          <stop offset="0.6" stopColor={BRAND.blue} stopOpacity="0.9" />
          <stop offset="1" stopColor={BRAND.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 180 L140 180 L140 90 L320 90 L320 150 L520 150 L520 40 L700 40 L700 110 L900 110"
        fill="none"
        stroke={`url(#${uid})`}
        strokeWidth="2"
        strokeDasharray="6 10"
        className="schematic-flow"
      />
      {[140, 320, 520, 700].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={[180, 90, 150, 40][i] === 180 ? 90 : [90, 150, 40, 110][i]}
          r="4"
          fill={i % 2 === 0 ? BRAND.teal : BRAND.blue}
          opacity="0.85"
        />
      ))}
    </svg>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", prefix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(ease * target));
          if (p < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── FAQ item ──────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 10, background: "var(--card)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", fontFamily: FONT_BODY }}>{q}</span>
        <ChevronDown size={16} style={{ color: open ? BRAND.teal : "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.65, fontFamily: FONT_BODY }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ── Small reusable bits ─────────────────────────────────────────────────────
function Eyebrow({ children, dark = false }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "5px 12px", borderRadius: 6,
      background: dark ? "rgba(255,255,255,0.08)" : `${BRAND.teal}14`,
      border: `1px solid ${dark ? "rgba(255,255,255,0.16)" : BRAND.teal + "35"}`,
      marginBottom: 16
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: BRAND.teal }} />
      <span style={{
        fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600,
        color: dark ? "#8FE0D9" : BRAND.tealDeep,
        textTransform: "uppercase", letterSpacing: "0.12em"
      }}>{children}</span>
    </div>
  );
}

// ── Main LandingPage ────────────────────────────────────────────────────────
function LandingPage({ onGetStarted, darkMode, onToggleDark }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, logout } = useAuth();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "Pricing", id: "pricing" },
    { label: "How it Works", id: "how-it-works" },
    { label: "FAQ", id: "faq" },
    { label: "Contact", id: "contact" },
  ];

  const PLANS = [
    {
      name: "Starter", price: 150, per: "month", color: BRAND.blue,
      features: ["Up to 3 boreholes", "Real-time dashboard", "Basic reporting", "Email support"],
      cta: "Get Started",
    },
    {
      name: "Professional", price: 450, per: "month", color: BRAND.teal, highlight: true,
      features: ["Up to 15 boreholes", "Advanced analytics", "Chemical dosing AI", "Priority support", "Custom alerts", "CSV/PDF export"],
      cta: "Start Free Trial",
    },
    {
      name: "Enterprise", price: null, per: "custom", color: BRAND.navy,
      features: ["Unlimited boreholes", "On-premise deployment", "SLA guarantee", "Dedicated account manager", "API access", "Training & onboarding"],
      cta: "Contact Sales",
    },
  ];

  const FAQS = [
    { q: "How quickly can I get started?", a: "Most customers are up and running within 48 hours. Our team handles sensor installation and data pipeline setup." },
    { q: "Does Aqua Systemtech work with existing SCADA systems?", a: "Yes — we integrate with Modbus, OPC-UA, and most industrial protocols via our API gateway." },
    { q: "Is my data stored securely?", a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are ISO 27001 certified." },
    { q: "Can I export reports to Excel or PDF?", a: "Yes, every report and chart can be exported to CSV, XLSX, or PDF with one click from the Analytics module." },
    { q: "What roles and permissions are supported?", a: "We support Admin, Operator, and Client roles out of the box. Admins access every page; Operators see Dashboard, Maintenance and Reports; Clients see Dashboard and Analytics in read-only mode." },
    { q: "Is there a free trial?", a: "The Professional plan includes a 14-day free trial — no credit card required." },
  ];

  const ABOUT_PILLARS = [
    { icon: Radio, label: "Remote monitoring", desc: "Live telemetry from every skid, pump and dosing line — no site visit required." },
    { icon: BarChart3, label: "Continuous analysis", desc: "Recovery, conductivity and dosing trends surfaced the moment they drift." },
    { icon: Zap, label: "Real-time insight", desc: "Data lands on your dashboard in seconds, not end-of-shift reports." },
    { icon: Target, label: "Proactive management", desc: "Threshold alerts catch problems before they become downtime." },
  ];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", color: "var(--foreground)", overflowX: "hidden", fontFamily: FONT_BODY }}>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, background: "var(--card)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)", zIndex: 50, padding: "12px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div onClick={() => scrollTo('hero')} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
            <BrandMark size={30} />
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", fontFamily: FONT_DISPLAY, letterSpacing: "-0.01em" }}>
              Aqua <span style={{ color: BRAND.teal }}>Systemtech</span>
            </span>
          </div>

          <div className="desktop-nav" style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)} style={{ fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY }}>{l.label}</button>
              ))}
            </div>
            <button onClick={onToggleDark} style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}{darkMode ? "Light" : "Dark"}
            </button>
            {user ? (
              <button onClick={logout} style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
            ) : (
              <button onClick={() => setLoginOpen(true)} style={{ background: BRAND.blue, color: "white", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn" style={{ display: "none", background: "none", border: "none", cursor: "pointer" }}>
            {mobileMenuOpen ? <X size={22} color="var(--foreground)" /> : <Menu size={22} color="var(--foreground)" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{ position: "absolute", top: 60, left: 0, right: 0, background: "var(--card)", borderBottom: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 12, zIndex: 50 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)} style={{ fontSize: 14, padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "var(--foreground)" }}>{l.label}</button>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onToggleDark} style={{ flex: 1, background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", padding: 10, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>{darkMode ? "Light mode" : "Dark mode"}</button>
              <button onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }} style={{ flex: 1, background: BRAND.blue, border: "none", color: "white", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="hero" style={{ position: "relative", padding: "64px 24px 40px", overflow: "hidden" }}>
        <SchematicLine className="hero-schematic" />
        <div className="hero-grid" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <Eyebrow>Live plant telemetry</Eyebrow>

            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
              Every reading your<br />
              <span style={{ color: BRAND.blue }}>RO plant</span> takes,<br />
              on one <span style={{ color: BRAND.teal }}>screen</span>.
            </h1>
            <p style={{ fontSize: 15.5, color: "var(--muted-foreground)", lineHeight: 1.65, marginBottom: 28, maxWidth: 480 }}>
              Aqua Systemtech turns your borehole and RO instrumentation into a single live dashboard —
              flow, recovery, antiscalant dosing and tank levels, tracked and alerted on automatically.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button onClick={() => setLoginOpen(true)} style={{ background: BRAND.blue, color: "white", border: "none", padding: "12px 26px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                Sign In <ArrowRight size={14} />
              </button>
              <button onClick={() => scrollTo('contact')} style={{ background: "transparent", color: BRAND.tealDeep, border: `1.5px solid ${BRAND.teal}`, padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                Talk to Sales <ArrowRight size={12} />
              </button>
            </div>

            <div className="hero-stats" style={{ display: "flex", gap: 32, marginTop: 46, flexWrap: "wrap" }}>
              {[
                { short: "1.2B+", label: "Litres Managed" },
                { short: "99.9%", label: "System Uptime" },
                { short: "15%", label: "Chemical Savings" },
                { short: "200+", label: "Facilities" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 24, fontWeight: 700, color: BRAND.blue }}>{s.short}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview card with instrument-style callouts */}
          <div style={{ position: "relative" }}>
            <div className="hero-callout" style={{ position: "absolute", top: -18, left: -10, zIndex: 2 }}>
              <div style={calloutStyle(BRAND.teal)}>RECOVERY <b style={{ fontFamily: FONT_MONO }}>94.2%</b></div>
            </div>
            <div className="hero-callout" style={{ position: "absolute", bottom: 64, right: -14, zIndex: 2 }}>
              <div style={calloutStyle(BRAND.blue)}>DOSING <b style={{ fontFamily: FONT_MONO }}>2.66 mg/L</b></div>
            </div>

            <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 24px 48px -16px rgba(10,37,64,0.35)" }}>
              <img
                src={roSkidHmi}
                alt="Aqua Systemtech RO skid with HMI touch panel"
                style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI bar ── */}
      <section style={{ background: `linear-gradient(120deg, ${BRAND.navy}, ${BRAND.blue} 65%, ${BRAND.teal})`, padding: "38px 24px" }}>
        <div className="kpi-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, textAlign: "center" }}>
          {[
            { label: "Litres Managed", target: 1200, suffix: "M+" },
            { label: "System Uptime", target: 99, suffix: ".9%" },
            { label: "Chemical Savings", target: 15, suffix: "%" },
            { label: "Facilities", target: 200, suffix: "+" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 34, fontWeight: 700, color: "white", lineHeight: 1 }}>
                <AnimatedCounter target={s.target} suffix={s.suffix} duration={1800} />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 7 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 48, alignItems: "center" }}>
            <div>
              <Eyebrow>About us</Eyebrow>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700, color: "var(--foreground)", marginBottom: 16, letterSpacing: "-0.01em" }}>
                Built for people who run the plant, not just watch it.
              </h2>
              <p style={{ fontSize: 14.5, color: "var(--muted-foreground)", lineHeight: 1.7 }}>
                We specialize in remote monitoring and analysis of aqua systems, ensuring efficient
                operation through real-time data insights and proactive management. Every dashboard
                is built around instruments you already have on site — no rip-and-replace required.
              </p>
            </div>
            <div className="about-pillars" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {ABOUT_PILLARS.map((p, i) => (
                <div key={i} style={{ padding: 18, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${BRAND.teal}16`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <p.icon size={17} color={BRAND.tealDeep} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--foreground)", marginBottom: 5 }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery: real deployments ── */}
      <section id="gallery" style={{ padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Eyebrow>In the field</Eyebrow>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              Real skids. Real dashboards.
            </h2>
          </div>
          <div className="gallery-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16, height: 480 }}>
            <div style={{ gridRow: "1 / 3", position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={roSkidHmi} alt="RO skid with HMI touch panel" style={galleryImgStyle} />
              <div style={galleryCaptionStyle}>RO skid + HMI control panel</div>
            </div>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={controlRoomDesk} alt="Control room monitoring desk" style={galleryImgStyle} />
              <div style={galleryCaptionStyle}>Control room dashboard</div>
            </div>
            <div className="gallery-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
                <img src={fieldEngineerTablet} alt="Field engineer checking dosing reading on tablet" style={galleryImgStyle} />
                <div style={galleryCaptionStyle}>Field readings on tablet</div>
              </div>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
                <img src={plantTabletMonitor} alt="Engineer monitoring plant KPIs on tablet" style={galleryImgStyle} />
                <div style={galleryCaptionStyle}>Daily KPI checks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.blue})`, borderRadius: 24, padding: "44px 40px" }}>
          <Eyebrow dark>Get in touch</Eyebrow>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: "white", marginBottom: 10, letterSpacing: "-0.01em" }}>
            Talk to the team
          </h2>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.78)", marginBottom: 28, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            Questions about deployment, pricing, or integrating with your existing SCADA setup — reach us directly.
          </p>
          <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="tel:+254728536124" style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontSize: 14, textDecoration: "none", fontFamily: FONT_MONO, background: "rgba(255,255,255,0.1)", padding: "10px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)" }}>
              <Phone size={14} /> +254 728 536124
            </a>
            <a href="mailto:info@aquasystemtech.co.ke" style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontSize: 14, textDecoration: "none", fontFamily: FONT_MONO, background: "rgba(255,255,255,0.1)", padding: "10px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)" }}>
              <Mail size={14} /> info@aquasystemtech.co.ke
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "72px 24px", background: "var(--card)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>Capabilities</Eyebrow>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "var(--foreground)", marginBottom: 12, letterSpacing: "-0.01em" }}>Precision control</h2>
          <p style={{ fontSize: 15, color: "var(--muted-foreground)", maxWidth: 600, margin: "0 auto 40px" }}>Everything you need for industrial-grade water treatment management</p>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { icon: Droplets, title: "Real-time Borehole", desc: "Continuous monitoring of draw-down levels, pump efficiency, and recharge rates." },
              { icon: FlaskConical, title: "Chemical Dosing", desc: "Antiscalant dosing held automatically within its 2.0–3.2 mg/L target band, with instant alerts on drift." },
              { icon: Wrench, title: "Smart Maintenance", desc: "Predictive failure modeling improves MTBF by up to 30%." },
              { icon: FileText, title: "Compliance", desc: "Automated audit trails and environmental reporting templates." },
              { icon: Shield, title: "Role-based Access", desc: "Admin, Operator, and Client roles — each with tailored page visibility." },
              { icon: Users, title: "Team Management", desc: "Add, deactivate, and manage users with full audit history." },
              { icon: Zap, title: "AI Optimization", desc: "Machine-learning dosing schedules adapt to seasonal water quality shifts." },
              { icon: Clock, title: "24/7 Uptime", desc: "Redundant cloud infrastructure with 99.9% SLA guarantee." },
            ].map((cap, i) => (
              <div key={i} style={{ textAlign: "left", padding: 20, background: "var(--background)", borderRadius: 14, border: "1px solid var(--border)", transition: "border-color 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ width: 42, height: 42, background: `${BRAND.blue}14`, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <cap.icon size={19} color={BRAND.blue} />
                </div>
                <h3 style={{ fontSize: 14.5, fontWeight: 600, color: "var(--foreground)", marginBottom: 6, fontFamily: FONT_DISPLAY }}>{cap.title}</h3>
                <p style={{ fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.55 }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>Pricing</Eyebrow>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "var(--foreground)", marginBottom: 10, letterSpacing: "-0.01em" }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 15, color: "var(--muted-foreground)", maxWidth: 500, margin: "0 auto 40px" }}>Scale as you grow — no hidden fees.</p>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, alignItems: "start" }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? `linear-gradient(150deg, ${BRAND.navy}, ${BRAND.blue})` : "var(--card)",
                borderRadius: 18, padding: 28,
                border: plan.highlight ? "none" : "1px solid var(--border)",
                position: "relative",
                transform: plan.highlight ? "scale(1.03)" : "none",
                boxShadow: plan.highlight ? "0 22px 42px -14px rgba(0,119,182,0.35)" : "none"
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: BRAND.amber, color: "#1a1410", fontSize: 10, fontWeight: 700, padding: "3px 14px", borderRadius: 20, letterSpacing: "0.08em", fontFamily: FONT_MONO }}>MOST POPULAR</div>
                )}
                <div style={{ fontSize: 17, fontWeight: 700, color: plan.highlight ? "white" : "var(--foreground)", marginBottom: 8, fontFamily: FONT_DISPLAY }}>{plan.name}</div>
                <div style={{ marginBottom: 20 }}>
                  {plan.price ? (
                    <>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 34, fontWeight: 700, color: plan.highlight ? "white" : BRAND.blue }}>${plan.price}</span>
                      <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)" }}>/{plan.per}</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 25, fontWeight: 700, color: plan.highlight ? "white" : BRAND.blue }}>Custom</span>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, textAlign: "left" }}>
                      <CheckCircle size={13} color={plan.highlight ? "white" : BRAND.teal} />
                      <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.9)" : "var(--foreground)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setLoginOpen(true)} style={{
                  width: "100%", padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: plan.highlight ? "none" : `1.5px solid ${BRAND.blue}`,
                  background: plan.highlight ? "white" : "transparent",
                  color: plan.highlight ? BRAND.blue : BRAND.blue
                }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ position: "relative", padding: "64px 24px", background: "var(--card)", overflow: "hidden" }}>
        <SchematicLine className="hiw-schematic" flipY />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>Three steps, real sequence</Eyebrow>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "var(--foreground)", marginBottom: 40, letterSpacing: "-0.01em" }}>How it works</h2>
          <div className="hiw-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
            {[
              { step: "01", title: "Connect", desc: "Rapid deployment of IoT sensors across your borehole and RO network.", icon: Radio },
              { step: "02", title: "Monitor", desc: "Visualize operations in a single dashboard with real-time data.", icon: Gauge },
              { step: "03", title: "Optimize", desc: "Dosing and pump schedules tune themselves automatically.", icon: Zap },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 60, height: 60, background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <s.icon size={24} color="white" />
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: BRAND.teal, marginBottom: 8 }}>{s.step}</div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "var(--foreground)", textAlign: "center", marginBottom: 36, letterSpacing: "-0.01em" }}>What our customers say</h2>
          <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { quote: "Since implementing Aqua Systemtech, we've seen a 15% reduction in chemical waste and a massive improvement in response time.", name: "David Miller", role: "Plant Manager, Global Beverage Corp" },
              { quote: "The role-based access feature is a game changer. Our operators stay focused on what matters and clients get real transparency.", name: "Amina Osei", role: "Operations Director, Nairobi Water Co." },
              { quote: "Deployment took under 48 hours and the predictive maintenance module has prevented two costly pump failures this quarter.", name: "James Kariuki", role: "Chief Engineer, Rift Valley Utilities" },
            ].map((t, i) => (
              <div key={i} style={{ background: "var(--card)", borderRadius: 14, padding: 24, border: "1px solid var(--border)" }}>
                <Quote size={18} color={BRAND.teal} style={{ marginBottom: 12, opacity: 0.7 }} />
                <p style={{ fontSize: 13.5, color: "var(--foreground)", lineHeight: 1.65, marginBottom: 18 }}>{t.quote}</p>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--foreground)" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "72px 24px", background: "var(--card)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Eyebrow>FAQ</Eyebrow>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>Frequently asked questions</h2>
          </div>
          {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.blue})`, borderRadius: 24, padding: "52px 40px" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "white", marginBottom: 10, letterSpacing: "-0.01em" }}>Ready to see every reading in one place?</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 32, maxWidth: 450, margin: "0 auto 32px" }}>Join 200+ industrial facilities using Aqua Systemtech.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setLoginOpen(true)} style={{ background: "white", color: BRAND.blue, border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
            <button onClick={() => scrollTo('contact')} style={{ background: "transparent", color: "white", border: "1.5px solid white", padding: "12px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Contact Us</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "40px 24px 28px", borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="footer-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <BrandMark size={22} />
              <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: 14, fontFamily: FONT_DISPLAY }}>Aqua Systemtech</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.6 }}>Remote monitoring for industrial water treatment. aquasystemtech.co.ke</p>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--foreground)" }}>Resources</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 11, color: "var(--muted-foreground)", lineHeight: 2 }}>
              <li>Documentation</li><li>API Reference</li><li>Case Studies</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--foreground)" }}>Support</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 11, color: "var(--muted-foreground)", lineHeight: 2 }}>
              <li>Contact Support</li><li>Privacy Policy</li><li>Terms of Service</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--foreground)" }}>Stay updated</h4>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="email" placeholder="Email" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", flex: 1, background: "var(--background)", color: "var(--foreground)", fontSize: 12, outline: "none" }} />
              <button style={{ background: BRAND.blue, color: "white", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Join</button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 36, paddingTop: 20, borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--muted-foreground)" }}>
          © 2026 Aqua Systemtech. Remote monitoring for industrial water treatment.
        </div>
      </footer>

      {/* ── Login modal ── */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={onGetStarted} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .schematic-line {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          opacity: 0.35;
          pointer-events: none;
        }
        .schematic-flow {
          animation: dash-flow 14s linear infinite;
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -320; }
        }
        @media (prefers-reduced-motion: reduce) {
          .schematic-flow { animation: none; }
        }

        /* Nav responsiveness */
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }

        /* Hero */
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-callout { display: none !important; }
          .hero-schematic { opacity: 0.18; }
        }
        @media (max-width: 560px) {
          .hero-stats { gap: 22px !important; }
        }

        /* Generic split sections (About) */
        @media (max-width: 860px) {
          .about-grid { grid-template-columns: 1fr !important; }
          .about-pillars { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .about-pillars { grid-template-columns: 1fr !important; }
        }

        /* Grids */
        @media (max-width: 980px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .hiw-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }

        /* Gallery */
        @media (max-width: 860px) {
          .gallery-grid { grid-template-columns: 1fr !important; grid-template-rows: none !important; height: auto !important; }
          .gallery-grid > div { height: 260px !important; grid-row: auto !important; }
          .gallery-split { grid-template-columns: 1fr 1fr !important; height: 260px !important; }
        }
        @media (max-width: 480px) {
          .gallery-split { grid-template-columns: 1fr !important; height: auto !important; }
          .gallery-split > div { height: 220px !important; }
        }
      `}</style>
    </div>
  );
}

const galleryImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block"
};

const galleryCaptionStyle = {
  position: "absolute",
  left: 0, right: 0, bottom: 0,
  padding: "10px 14px",
  background: "linear-gradient(to top, rgba(10,37,64,0.85), transparent)",
  color: "white",
  fontSize: 11.5,
  fontWeight: 600,
  fontFamily: FONT_MONO,
  letterSpacing: "0.02em"
};

function calloutStyle(color) {
  return {
    background: "var(--card)",
    border: `1px solid ${color}55`,
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    boxShadow: "0 8px 20px -8px rgba(10,37,64,0.35)",
    fontFamily: FONT_BODY,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap"
  };
}

export default LandingPage;