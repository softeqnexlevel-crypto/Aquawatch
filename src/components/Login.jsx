// frontend/src/components/Login.jsx - FULLY RESPONSIVE

import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Radio, BarChart3, Zap, Target, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import logoMark from '../assets/logo/aqua-systemtech-mark.png';
import roSkidHmi from '../assets/gallery/ro-skid-hmi.png';
import controlRoomDesk from '../assets/gallery/control-room-desk.png';
import fieldEngineerTablet from '../assets/gallery/field-engineer-tablet.png';
import plantTabletMonitor from '../assets/gallery/plant-tablet-monitor.png';

// ── Brand tokens ──────────────────────────────────────────────────
const BRAND = { teal: "#0EA8A0", tealDeep: "#0B8983", blue: "#0077B6", navy: "#0A2540" };
const FONT_DISPLAY = "'Space Grotesk', 'Inter', sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'SFMono-Regular', monospace";

const HERO_SLIDES = [
  { img: roSkidHmi, caption: "RO skid + HMI control panel" },
  { img: controlRoomDesk, caption: "Control room dashboard" },
  { img: fieldEngineerTablet, caption: "Field readings, live" },
  { img: plantTabletMonitor, caption: "Daily KPI checks" },
];

const PILLARS = [
  { icon: Radio, label: "Remote monitoring", desc: "Live telemetry from every skid, pump and dosing line." },
  { icon: BarChart3, label: "Continuous analysis", desc: "Recovery, conductivity and dosing trends surfaced instantly." },
  { icon: Zap, label: "Real-time insight", desc: "Data lands on your dashboard in seconds." },
  { icon: Target, label: "Proactive management", desc: "Threshold alerts catch problems before downtime." },
];

// ── Field styles with responsive adjustments ────────────────────
const getFieldStyles = (isMobile) => ({
  wrap: { marginBottom: isMobile ? 12 : 16 },
  label: { 
    display: "block", 
    fontSize: isMobile ? 9 : 11, 
    fontWeight: 600, 
    color: "var(--muted-foreground)", 
    marginBottom: isMobile ? 4 : 6, 
    textTransform: "uppercase", 
    letterSpacing: "0.08em", 
    fontFamily: FONT_MONO 
  },
  input: { 
    width: "100%", 
    padding: isMobile ? "10px 12px" : "12px 14px", 
    background: "var(--secondary)", 
    border: "1px solid var(--border)", 
    borderRadius: 8, 
    color: "var(--foreground)", 
    fontSize: isMobile ? 13 : 14, 
    outline: "none", 
    boxSizing: "border-box", 
    fontFamily: FONT_BODY 
  },
});

// ── Sign-in form pieces ──────────────────────────────────────────
function FormFields({ 
  email, setEmail, password, setPassword, showPw, setShowPw, 
  remember, setRemember, error, loading, isModal, handleSubmit, 
  scrollToContact, isMobile 
}) {
  const fieldStyles = getFieldStyles(isMobile);
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ 
          background: "rgba(239,68,68,0.1)", 
          border: "1px solid rgba(239,68,68,0.2)", 
          borderRadius: 8, 
          padding: "10px 14px", 
          color: "#ef4444", 
          marginBottom: 16, 
          fontSize: isMobile ? 12 : 13 
        }}>
          {error}
        </div>
      )}
      
      <div style={fieldStyles.wrap}>
        <label style={fieldStyles.label}>Email</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="you@aquasystemtech.co.ke" 
          style={fieldStyles.input} 
          required 
        />
      </div>
      
      <div style={fieldStyles.wrap}>
        <label style={fieldStyles.label}>Password</label>
        <div style={{ position: "relative" }}>
          <input 
            type={showPw ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••" 
            style={{ ...fieldStyles.input, paddingRight: 40 }} 
            required 
          />
          <button 
            type="button" 
            onClick={() => setShowPw((v) => !v)} 
            style={{ 
              position: "absolute", 
              right: 10, 
              top: "50%", 
              transform: "translateY(-50%)", 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              color: "var(--muted-foreground)", 
              display: "flex" 
            }} 
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={isMobile ? 14 : 16} /> : <Eye size={isMobile ? 14 : 16} />}
          </button>
        </div>
      </div>
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: isMobile ? 14 : 18, 
        fontSize: isMobile ? 11 : 12.5 
      }}>
        <label style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: isMobile ? 5 : 7, 
          color: "var(--muted-foreground)", 
          cursor: "pointer" 
        }}>
          <input 
            type="checkbox" 
            checked={remember} 
            onChange={(e) => setRemember(e.target.checked)} 
            style={{ accentColor: BRAND.blue }} 
          />
          Remember me
        </label>
        {!isModal && (
          <a 
            href="#contact" 
            onClick={scrollToContact} 
            style={{ color: BRAND.blue, textDecoration: "none", fontWeight: 500 }}
          >
            Forgot password?
          </a>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={loading} 
        style={{ 
          width: "100%", 
          padding: isMobile ? "11px" : "13px", 
          background: BRAND.blue, 
          color: "white", 
          border: "none", 
          borderRadius: 8, 
          fontSize: isMobile ? 13 : 14, 
          fontWeight: 600, 
          cursor: loading ? "not-allowed" : "pointer", 
          fontFamily: FONT_BODY,
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

function SocialRow({ isMobile }) {
  const size = isMobile ? 36 : 40;
  const fontSize = isMobile ? 13 : 15;
  
  return (
    <div style={{ display: "flex", gap: isMobile ? 8 : 10, justifyContent: "center", marginTop: 4 }}>
      {[
        { label: "G", bg: "white", fg: "#EA4335", border: "1px solid var(--border)" },
        { label: "", bg: "#000", fg: "white" },
        { label: "f", bg: "#1877F2", fg: "white" },
      ].map((s, i) => (
        <button
          key={i}
          type="button"
          disabled
          title="Coming soon"
          style={{ 
            width: size, 
            height: size, 
            borderRadius: "50%", 
            background: s.bg, 
            color: s.fg, 
            border: s.border || "none", 
            cursor: "not-allowed", 
            opacity: 0.55, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontWeight: 700, 
            fontSize: fontSize 
          }}
        >
          {s.label || "\u{F8FF}"}
        </button>
      ))}
    </div>
  );
}

// ==================== MAIN LOGIN COMPONENT ====================
export const Login = ({ onLoginSuccess, onClose, isModal = false }) => {
  const { login, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [slide, setSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // ── Responsive detection ──────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Slideshow ──────────────────────────────────────────────────
  useEffect(() => {
    if (isModal) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [isModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success && onLoginSuccess) onLoginSuccess(result.user);
  };

  const scrollToContact = (e) => {
    e.preventDefault();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formProps = {
    email, setEmail, password, setPassword, showPw, setShowPw,
    remember, setRemember, error, loading, isModal, handleSubmit, 
    scrollToContact, isMobile
  };

  // ── Compact modal ──────────────────────────────────────────────
  if (isModal) {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <button onClick={onClose} style={modalStyles.closeButton} aria-label="Close">×</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <img src={logoMark} alt="" style={{ height: isMobile ? 20 : 24, width: "auto" }} />
            <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, fontFamily: FONT_DISPLAY }}>Aqua Systemtech</span>
          </div>
          <h2 style={{ 
            fontFamily: FONT_DISPLAY, 
            fontSize: isMobile ? 17 : 19, 
            fontWeight: 700, 
            margin: isMobile ? "10px 0 2px" : "14px 0 2px" 
          }}>
            Welcome back
          </h2>
          <p style={{ 
            fontSize: isMobile ? 12 : 13, 
            color: "var(--muted-foreground)", 
            marginBottom: isMobile ? 14 : 18 
          }}>
            Sign in to your dashboard
          </p>
          <FormFields {...formProps} />
          <div style={{ 
            textAlign: "center", 
            margin: isMobile ? "14px 0 10px" : "18px 0 12px", 
            fontSize: isMobile ? 10 : 11.5, 
            color: "var(--muted-foreground)", 
            position: "relative" 
          }}>
            <span style={{ background: "var(--card)", padding: "0 10px", position: "relative", zIndex: 1 }}>
              Or continue with
            </span>
            <div style={{ 
              position: "absolute", 
              top: "50%", 
              left: 0, 
              right: 0, 
              height: 1, 
              background: "var(--border)" 
            }} />
          </div>
          <SocialRow isMobile={isMobile} />
        </div>
      </div>
    );
  }

  // ── Full page ──────────────────────────────────────────────────
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "var(--background)", 
      color: "var(--foreground)", 
      fontFamily: FONT_BODY 
    }}>

      <section className="split-hero" style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
        minHeight: isMobile ? "auto" : "100vh" 
      }}>
        {/* Photo panel — hidden on mobile */}
        {!isMobile && (
          <div className="hero-photo-panel" style={{ position: "relative", overflow: "hidden" }}>
            {HERO_SLIDES.map((s, i) => (
              <img
                key={i}
                src={s.img}
                alt={s.caption}
                style={{
                  position: "absolute", 
                  inset: 0, 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  opacity: i === slide ? 1 : 0, 
                  transition: "opacity 1.1s ease"
                }}
              />
            ))}
            <div style={{ 
              position: "absolute", 
              inset: 0, 
              background: "linear-gradient(0deg, rgba(10,37,64,0.85), rgba(10,37,64,0.15) 55%)" 
            }} />
            <div style={{ 
              position: "absolute", 
              left: 40, 
              right: 40, 
              bottom: 48, 
              color: "white" 
            }}>
              <h2 style={{ 
                fontFamily: FONT_DISPLAY, 
                fontSize: 26, 
                fontWeight: 700, 
                marginBottom: 10, 
                letterSpacing: "-0.01em" 
              }}>
                Live monitoring for industrial water treatment
              </h2>
              <p style={{ 
                fontSize: 13.5, 
                color: "rgba(255,255,255,0.85)", 
                lineHeight: 1.6, 
                maxWidth: 440, 
                marginBottom: 18 
              }}>
                Aqua Systemtech turns your borehole and RO instrumentation into a single live dashboard —
                flow, recovery, dosing and tank levels, tracked automatically.
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {HERO_SLIDES.map((_, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      height: 4, 
                      width: i === slide ? 26 : 14, 
                      borderRadius: 2, 
                      background: i === slide ? BRAND.teal : "rgba(255,255,255,0.4)", 
                      transition: "all 0.3s" 
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form panel */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          padding: isMobile ? "32px 20px" : "48px 56px" 
        }} className="hero-form-panel">
          <div style={{ 
            maxWidth: isMobile ? "100%" : 360, 
            width: "100%", 
            margin: "0 auto" 
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: isMobile ? 7 : 9, 
              marginBottom: isMobile ? 24 : 40,
              justifyContent: isMobile ? "center" : "flex-start"
            }}>
              <img src={logoMark} alt="Aqua Systemtech" style={{ height: isMobile ? 24 : 30, width: "auto" }} />
              <span style={{ 
                fontSize: isMobile ? 14 : 16, 
                fontWeight: 700, 
                fontFamily: FONT_DISPLAY, 
                letterSpacing: "-0.01em" 
              }}>
                Aqua <span style={{ color: BRAND.teal }}>Systemtech</span>
              </span>
            </div>

            <h1 style={{ 
              fontFamily: FONT_DISPLAY, 
              fontSize: isMobile ? 22 : 26, 
              fontWeight: 700, 
              marginBottom: isMobile ? 4 : 6,
              textAlign: isMobile ? "center" : "left"
            }}>
              Welcome back
            </h1>
            <p style={{ 
              fontSize: isMobile ? 12.5 : 13.5, 
              color: "var(--muted-foreground)", 
              marginBottom: isMobile ? 20 : 28,
              textAlign: isMobile ? "center" : "left"
            }}>
              Sign in to access your dashboard
            </p>

            <FormFields {...formProps} />

            <div style={{ 
              textAlign: "center", 
              margin: isMobile ? "16px 0 10px" : "22px 0 14px", 
              fontSize: isMobile ? 10 : 11.5, 
              color: "var(--muted-foreground)", 
              position: "relative" 
            }}>
              <span style={{ 
                background: "var(--background)", 
                padding: "0 10px", 
                position: "relative", 
                zIndex: 1 
              }}>
                Or continue with
              </span>
              <div style={{ 
                position: "absolute", 
                top: "50%", 
                left: 0, 
                right: 0, 
                height: 1, 
                background: "var(--border)" 
              }} />
            </div>
            <SocialRow isMobile={isMobile} />

            <p style={{ 
              textAlign: "center", 
              fontSize: isMobile ? 11.5 : 12.5, 
              color: "var(--muted-foreground)", 
              marginTop: isMobile ? 20 : 26 
            }}>
              Need access? <a 
                href="#contact" 
                onClick={scrollToContact} 
                style={{ color: BRAND.blue, fontWeight: 600, textDecoration: "none" }}
              >
                Talk to sales
              </a>
            </p>
          </div>
        </div>
      </section>

      <AboutSection isMobile={isMobile} />
      <GallerySection isMobile={isMobile} />
      <ContactSection isMobile={isMobile} />

      <footer style={{ 
        padding: isMobile ? "20px 16px" : "28px 20px", 
        borderTop: "1px solid var(--border)" 
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: isMobile ? 8 : 12,
          flexDirection: isMobile ? "column" : "row",
          textAlign: isMobile ? "center" : "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={logoMark} alt="" style={{ height: isMobile ? 16 : 18, width: "auto" }} />
            <span style={{ 
              fontSize: isMobile ? 11 : 12.5, 
              fontWeight: 600, 
              fontFamily: FONT_DISPLAY 
            }}>
              Aqua Systemtech
            </span>
          </div>
          <span style={{ 
            fontSize: isMobile ? 10 : 11, 
            color: "var(--muted-foreground)" 
          }}>
            © 2026 Aqua Systemtech · aquasystemtech.co.ke
          </span>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @media (max-width: 768px) {
          .split-hero { 
            grid-template-columns: 1fr !important; 
            min-height: auto !important; 
          }
          .hero-photo-panel { 
            display: none !important; 
          }
          .hero-form-panel { 
            padding: 32px 20px !important; 
          }
        }
        
        @media (max-width: 640px) {
          .about-grid { 
            grid-template-columns: 1fr !important; 
          }
          .pillars-grid { 
            grid-template-columns: 1fr !important; 
          }
          .gallery-grid { 
            grid-template-columns: 1fr !important; 
            grid-template-rows: none !important; 
            height: auto !important; 
          }
          .gallery-grid > div { 
            height: 200px !important; 
            grid-row: auto !important; 
          }
          .gallery-split { 
            grid-template-columns: 1fr 1fr !important; 
            height: 200px !important; 
          }
          .contact-grid { 
            grid-template-columns: 1fr !important; 
          }
        }
        
        @media (max-width: 400px) {
          .gallery-split { 
            grid-template-columns: 1fr !important; 
            height: auto !important; 
          }
          .gallery-split > div { 
            height: 180px !important; 
          }
        }
      `}</style>
    </div>
  );
};

// ── About Us ─────────────────────────────────────────────────────────────
function AboutSection({ isMobile }) {
  return (
    <section style={{ padding: isMobile ? "40px 16px" : "64px 20px" }}>
      <div className="about-grid" style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "0.9fr 1.1fr", 
        gap: isMobile ? 24 : 40, 
        alignItems: "center" 
      }}>
        <div>
          <Eyebrow isMobile={isMobile}>About us</Eyebrow>
          <h2 style={{ 
            fontFamily: FONT_DISPLAY, 
            fontSize: isMobile ? 22 : 26, 
            fontWeight: 700, 
            marginBottom: isMobile ? 10 : 14, 
            letterSpacing: "-0.01em" 
          }}>
            Built for people who run the plant, not just watch it.
          </h2>
          <p style={{ 
            fontSize: isMobile ? 13 : 14, 
            color: "var(--muted-foreground)", 
            lineHeight: 1.7 
          }}>
            We specialize in remote monitoring and analysis of aqua systems, ensuring efficient
            operation through real-time data insights and proactive management.
          </p>
        </div>
        <div className="pillars-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: isMobile ? 10 : 14 
        }}>
          {PILLARS.map((p, i) => (
            <div key={i} style={{ 
              padding: isMobile ? 14 : 16, 
              background: "var(--card)", 
              border: "1px solid var(--border)", 
              borderRadius: 12 
            }}>
              <div style={{ 
                width: isMobile ? 28 : 32, 
                height: isMobile ? 28 : 32, 
                borderRadius: 8, 
                background: `${BRAND.teal}16`, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                marginBottom: isMobile ? 8 : 10 
              }}>
                <p.icon size={isMobile ? 13 : 15} color={BRAND.tealDeep} />
              </div>
              <div style={{ 
                fontSize: isMobile ? 12 : 13, 
                fontWeight: 600, 
                marginBottom: isMobile ? 3 : 4 
              }}>
                {p.label}
              </div>
              <div style={{ 
                fontSize: isMobile ? 10.5 : 11.5, 
                color: "var(--muted-foreground)", 
                lineHeight: 1.5 
              }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────
function GallerySection({ isMobile }) {
  return (
    <section style={{ 
      padding: isMobile ? "8px 16px 40px" : "8px 20px 64px", 
      background: "var(--card)" 
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ 
          textAlign: "center", 
          marginBottom: isMobile ? 20 : 28, 
          paddingTop: isMobile ? 24 : 40 
        }}>
          <Eyebrow isMobile={isMobile}>In the field</Eyebrow>
          <h2 style={{ 
            fontFamily: FONT_DISPLAY, 
            fontSize: isMobile ? 20 : 24, 
            fontWeight: 700, 
            letterSpacing: "-0.01em" 
          }}>
            Real skids. Real dashboards.
          </h2>
        </div>
        <div className="gallery-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", 
          gridTemplateRows: isMobile ? "none" : "1fr 1fr", 
          gap: isMobile ? 10 : 14, 
          height: isMobile ? "auto" : 400 
        }}>
          <div style={{ 
            gridRow: isMobile ? "auto" : "1 / 3", 
            position: "relative", 
            borderRadius: 14, 
            overflow: "hidden", 
            border: "1px solid var(--border)",
            height: isMobile ? 200 : "auto" 
          }}>
            <img src={roSkidHmi} alt="RO skid with HMI touch panel" style={imgStyle} />
            <div style={{ ...captionStyle, fontSize: isMobile ? 10 : 11.5 }}>
              RO skid + HMI control panel
            </div>
          </div>
          <div style={{ 
            position: "relative", 
            borderRadius: 14, 
            overflow: "hidden", 
            border: "1px solid var(--border)",
            height: isMobile ? 180 : "auto" 
          }}>
            <img src={controlRoomDesk} alt="Control room monitoring desk" style={imgStyle} />
            <div style={{ ...captionStyle, fontSize: isMobile ? 10 : 11.5 }}>
              Control room dashboard
            </div>
          </div>
          <div className="gallery-split" style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", 
            gap: isMobile ? 10 : 14,
            height: isMobile ? "auto" : "auto" 
          }}>
            <div style={{ 
              position: "relative", 
              borderRadius: 14, 
              overflow: "hidden", 
              border: "1px solid var(--border)",
              height: isMobile ? 180 : "auto" 
            }}>
              <img src={fieldEngineerTablet} alt="Field engineer checking a reading on tablet" style={imgStyle} />
              <div style={{ ...captionStyle, fontSize: isMobile ? 10 : 11.5 }}>
                Field readings
              </div>
            </div>
            <div style={{ 
              position: "relative", 
              borderRadius: 14, 
              overflow: "hidden", 
              border: "1px solid var(--border)",
              height: isMobile ? 180 : "auto" 
            }}>
              <img src={plantTabletMonitor} alt="Engineer monitoring plant KPIs" style={imgStyle} />
              <div style={{ ...captionStyle, fontSize: isMobile ? 10 : 11.5 }}>
                Daily KPI checks
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────
function ContactSection({ isMobile }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const fieldStyles = getFieldStyles(isMobile);
  
  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    console.log('Contact form submission:', form);
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" style={{ padding: isMobile ? "40px 16px" : "64px 20px" }}>
      <div className="contact-grid" style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
        gap: isMobile ? 24 : 40 
      }}>
        <div>
          <Eyebrow isMobile={isMobile}>Get in touch</Eyebrow>
          <h2 style={{ 
            fontFamily: FONT_DISPLAY, 
            fontSize: isMobile ? 22 : 24, 
            fontWeight: 700, 
            marginBottom: isMobile ? 8 : 10, 
            letterSpacing: "-0.01em" 
          }}>
            Contact us
          </h2>
          <p style={{ 
            fontSize: isMobile ? 12.5 : 13.5, 
            color: "var(--muted-foreground)", 
            lineHeight: 1.6, 
            marginBottom: isMobile ? 18 : 22 
          }}>
            Have questions or want to learn more about our water management solutions? We'd love to hear from you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 14 }}>
            <ContactItem icon={MapPin} label="Address" value="Nairobi, Kenya" isMobile={isMobile} />
            <ContactItem icon={Mail} label="Email" value="aquasystemtech.co.ke@gmail.com" href="mailto:info@aquasystemtech.co.ke" isMobile={isMobile} />
            <ContactItem icon={Phone} label="Phone" value="+254 728 536124" href="tel:+254728536124" isMobile={isMobile} />
          </div>
        </div>
        <div style={{ 
          background: "var(--card)", 
          padding: isMobile ? 20 : 26, 
          borderRadius: 16, 
          border: "1px solid var(--border)" 
        }}>
          <h3 style={{ 
            fontFamily: FONT_DISPLAY, 
            fontSize: isMobile ? 15 : 16, 
            fontWeight: 600, 
            marginBottom: isMobile ? 12 : 16 
          }}>
            Send us a message
          </h3>
          {sent && (
            <div style={{ 
              background: "rgba(34,197,94,0.1)", 
              border: "1px solid rgba(34,197,94,0.25)", 
              borderRadius: 8, 
              padding: "10px 14px", 
              color: "#22c55e", 
              marginBottom: 14, 
              fontSize: isMobile ? 12 : 13 
            }}>
              Message sent — we'll get back to you shortly.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={fieldStyles.wrap}>
              <input 
                type="text" 
                value={form.name} 
                onChange={handleChange('name')} 
                placeholder="Your name" 
                style={fieldStyles.input} 
                required 
              />
            </div>
            <div style={fieldStyles.wrap}>
              <input 
                type="email" 
                value={form.email} 
                onChange={handleChange('email')} 
                placeholder="Your email" 
                style={fieldStyles.input} 
                required 
              />
            </div>
            <div style={fieldStyles.wrap}>
              <textarea 
                value={form.message} 
                onChange={handleChange('message')} 
                placeholder="Your message" 
                rows={isMobile ? 3 : 4} 
                style={{ 
                  ...fieldStyles.input, 
                  resize: "vertical", 
                  fontFamily: "inherit",
                  minHeight: isMobile ? 80 : 100
                }} 
                required 
              />
            </div>
            <button 
              type="submit" 
              style={{ 
                width: "100%", 
                padding: isMobile ? "11px" : "13px", 
                background: BRAND.blue, 
                color: "white", 
                border: "none", 
                borderRadius: 8, 
                fontSize: isMobile ? 13 : 14, 
                fontWeight: 600, 
                cursor: "pointer", 
                fontFamily: FONT_BODY 
              }}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function ContactItem({ icon: Icon, label, value, href, isMobile }) {
  const content = (
    <div style={{ display: "flex", gap: isMobile ? 10 : 12, alignItems: "flex-start" }}>
      <div style={{ 
        width: isMobile ? 28 : 32, 
        height: isMobile ? 28 : 32, 
        borderRadius: 8, 
        background: `${BRAND.blue}14`, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        flexShrink: 0 
      }}>
        <Icon size={isMobile ? 12 : 14} color={BRAND.blue} />
      </div>
      <div>
        <div style={{ 
          fontSize: isMobile ? 9 : 10.5, 
          fontWeight: 600, 
          color: "var(--muted-foreground)", 
          textTransform: "uppercase", 
          letterSpacing: "0.06em", 
          marginBottom: 2 
        }}>
          {label}
        </div>
        <div style={{ 
          fontSize: isMobile ? 12.5 : 13.5, 
          color: "var(--foreground)", 
          fontFamily: FONT_MONO 
        }}>
          {value}
        </div>
      </div>
    </div>
  );
  return href ? <a href={href} style={{ textDecoration: "none", color: "inherit" }}>{content}</a> : content;
}

function Eyebrow({ children, isMobile }) {
  return (
    <div style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      gap: isMobile ? 6 : 8, 
      padding: isMobile ? "4px 10px" : "5px 12px", 
      borderRadius: 6, 
      background: `${BRAND.teal}14`, 
      border: `1px solid ${BRAND.teal}35`, 
      marginBottom: isMobile ? 10 : 14 
    }}>
      <span style={{ 
        width: isMobile ? 4 : 5, 
        height: isMobile ? 4 : 5, 
        borderRadius: "50%", 
        background: BRAND.teal 
      }} />
      <span style={{ 
        fontFamily: FONT_MONO, 
        fontSize: isMobile ? 9 : 10.5, 
        fontWeight: 600, 
        color: BRAND.tealDeep, 
        textTransform: "uppercase", 
        letterSpacing: "0.12em" 
      }}>
        {children}
      </span>
    </div>
  );
}

// ==================== LOGIN MODAL ====================
export const LoginModal = ({ open, onClose, onSuccess }) => {
  if (!open) return null;
  return <Login isModal={true} onClose={onClose} onLoginSuccess={onSuccess} />;
};

// ==================== SHARED STYLES ====================
const imgStyle = { 
  width: "100%", 
  height: "100%", 
  objectFit: "cover", 
  display: "block" 
};

const captionStyle = {
  position: "absolute", 
  left: 0, 
  right: 0, 
  bottom: 0, 
  padding: "10px 14px",
  background: "linear-gradient(to top, rgba(10,37,64,0.85), transparent)",
  color: "white",
  fontWeight: 600,
  fontFamily: FONT_MONO,
  letterSpacing: "0.02em"
};

const modalStyles = {
  overlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.7)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 1000, 
    backdropFilter: 'blur(4px)', 
    padding: '20px' 
  },
  modal: { 
    background: 'var(--card)', 
    padding: '32px', 
    borderRadius: '16px', 
    border: '1px solid var(--border)', 
    width: '400px', 
    maxWidth: '100%', 
    maxHeight: '90vh', 
    overflow: 'auto', 
    position: 'relative', 
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)' 
  },
  closeButton: { 
    position: 'absolute', 
    top: '12px', 
    right: '16px', 
    background: 'none', 
    border: 'none', 
    fontSize: '22px', 
    color: 'var(--muted-foreground)', 
    cursor: 'pointer', 
    padding: '4px 8px', 
    borderRadius: '4px' 
  }
};

export default Login;