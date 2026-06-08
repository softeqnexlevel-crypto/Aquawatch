import React from 'react';
import { 
  Droplets, 
  FlaskConical, 
  Wrench, 
  FileText,
  Play,
  ArrowRight,
  Moon,
  Sun,
  Gauge,
  TrendingUp,
  Menu,
  X,
  CheckCircle,
  BarChart3
} from "lucide-react";

function LandingPage({ onGetStarted, darkMode, onToggleDark }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ 
      background: "var(--background)", 
      minHeight: "100vh", 
      color: "var(--foreground)",
      overflowX: "hidden"
    }}>
      {/* Navigation */}
      <nav style={{ 
        position: "sticky", 
        top: 0, 
        background: "var(--card)", 
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 50,
        padding: "12px 24px"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <div 
            onClick={() => scrollToSection('hero')}
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
          >
            <div style={{ 
              width: "28px", 
              height: "28px", 
              background: "linear-gradient(135deg, #0077B6, #00B4AA)", 
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Droplets size={16} color="white" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
              Aqua<span style={{ color: "#0077B6" }}>Ops</span> <em style= {{fontSize:"12px"}}>Water Management</em>
              <span style={{ 
                fontSize: "8px", 
                fontWeight: 500, 
                background: "#00B4AA20", 
                padding: "2px 6px", 
                borderRadius: "20px", 
                marginLeft: "8px", 
                color: "#00B4AA" 
              }}>
                v4.2
              </span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <button 
                onClick={() => scrollToSection('features')}
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('borehole')}
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                Borehole
              </button>
              <button 
                onClick={() => scrollToSection('analytics')}
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                Analytics
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                How it Works
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                Testimonials
              </button>
            </div>
            
            {/* Dark mode toggle */}
            <button 
              onClick={onToggleDark}
              style={{
                background: "var(--secondary)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                padding: "6px 10px",
                borderRadius: "32px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
              {darkMode ? "Light" : "Dark"}
            </button>
            
            <button 
              onClick={onGetStarted}
              style={{
                background: "#0077B6",
                color: "white",
                border: "none",
                padding: "8px 20px",
                borderRadius: "32px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Dashboard
            </button>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer" }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={22} color="var(--foreground)" /> : <Menu size={22} color="var(--foreground)" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{
            position: "absolute",
            top: "60px",
            left: 0,
            right: 0,
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <button onClick={() => scrollToSection('features')} style={{ fontSize: "14px", padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>Features</button>
            <button onClick={() => scrollToSection('borehole')} style={{ fontSize: "14px", padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>Borehole Management</button>
            <button onClick={() => scrollToSection('analytics')} style={{ fontSize: "14px", padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>Analytics</button>
            <button onClick={() => scrollToSection('how-it-works')} style={{ fontSize: "14px", padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>How it Works</button>
            <button onClick={() => scrollToSection('testimonials')} style={{ fontSize: "14px", padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>Testimonials</button>
            <button onClick={onGetStarted} style={{ background: "#0077B6", color: "white", border: "none", padding: "10px", borderRadius: "32px", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}>Go to Dashboard</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" style={{ 
        padding: "60px 24px", 
        background: "linear-gradient(135deg, var(--background) 0%, var(--card) 100%)"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          {/* Left Column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#22c55e20", padding: "4px 10px", borderRadius: "32px" }}>
                <div style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#22c55e" }}>Active</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--secondary)", padding: "4px 10px", borderRadius: "32px" }}>
                <Gauge size={12} color="var(--muted-foreground)" />
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Flow: 1,248 m³/hr</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--secondary)", padding: "4px 10px", borderRadius: "32px" }}>
                <TrendingUp size={12} color="#00B4AA" />
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>recharge +2.4%</span>
              </div>
            </div>
            
            <h1 style={{ fontSize: "40px", fontWeight: 800, color: "var(--foreground)", lineHeight: "1.2", marginBottom: "20px", letterSpacing: "-0.02em" }}>
              Industrial Precision for<br />
              <span style={{ color: "#0077B6" }}>Water Management</span>
            </h1>
            
            <p style={{ fontSize: "15px", color: "var(--muted-foreground)", lineHeight: "1.5", marginBottom: "28px", maxWidth: "500px" }}>
              The all-in-one platform for real-time borehole monitoring, chemical treatment optimization, and predictive maintenance.
            </p>
            
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <button 
                onClick={onGetStarted}
                style={{
                  background: "#0077B6",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "32px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Open Monitor <ArrowRight size={14} />
              </button>
              
              <button style={{
                background: "transparent",
                color: "#0077B6",
                border: "1.5px solid #0077B6",
                padding: "10px 24px",
                borderRadius: "32px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Play size={12} /> Watch Video
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "36px", marginTop: "48px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0077B6" }}>1.2B+</div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>Liters Managed</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0077B6" }}>99.9%</div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>System Uptime</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0077B6" }}>15%</div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>Chemical Savings</div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Dashboard Preview */}
          <div style={{
            background: "var(--card)",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 35px -12px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#00B4AA", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>LIVE FLOW</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>AquaOps Water Management</div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
                <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
                <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={{ background: "var(--secondary)", borderRadius: "14px", padding: "12px" }}>
                <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "6px" }}>System Recovery</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#22c55e" }}>94.2%</div>
                <div style={{ fontSize: "9px", color: "#22c55e", marginTop: "2px" }}>↑ +2.1%</div>
              </div>
              <div style={{ background: "var(--secondary)", borderRadius: "14px", padding: "12px" }}>
                <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "6px" }}>Active Pumps</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>04</div>
                <div style={{ fontSize: "9px", color: "var(--muted-foreground)", marginTop: "2px" }}>Pump_04 @ 88%</div>
              </div>
            </div>
            
            <div style={{ background: "var(--secondary)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "8px" }}>Total Flow Rate</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#00B4AA", fontFamily: "monospace" }}>1,248</div>
              <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>m³/hour · +128 from 6am</div>
              <div style={{ marginTop: "10px", height: "3px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg, #0077B6, #00B4AA)" }} />
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#00B4AA", fontWeight: 600 }}>PUMP_04</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>ACTIVE</div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
                <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
                <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }} />
                <div style={{ width: "8px", height: "8px", background: "#eab308", borderRadius: "50%" }} />
              </div>
              <div style={{ fontSize: "9px", color: "var(--muted-foreground)" }}>Updated: 2s ago</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities / Features Section */}
      <section id="features" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ 
            display: "inline-flex", 
            background: "#0077B610", 
            padding: "4px 14px", 
            borderRadius: "32px", 
            marginBottom: "16px" 
          }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0077B6", textTransform: "uppercase", letterSpacing: "1.5px" }}>Capabilities</span>
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", marginBottom: "12px" }}>Precision Control</h2>
          <p style={{ fontSize: "15px", color: "var(--muted-foreground)", maxWidth: "600px", margin: "0 auto 40px" }}>
            Everything you need for industrial-grade water management
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {[
              { icon: Droplets, title: "Real-time Borehole", desc: "Continuous monitoring of draw-down levels, pump efficiency, and recharge rates." },
              { icon: FlaskConical, title: "Chemical Dosing", desc: "Automated antiscalant optimization based on real-time water chemistry." },
              { icon: Wrench, title: "Smart Maintenance", desc: "Predictive failure modeling improves MTBF by up to 30%." },
              { icon: FileText, title: "Compliance", desc: "Automated audit trails and environmental reporting templates." }
            ].map((cap, i) => (
              <div key={i} style={{ 
                textAlign: "left", 
                padding: "20px", 
                background: "var(--card)", 
                borderRadius: "16px",
                border: "1px solid var(--border)",
              }}>
                <div style={{ 
                  width: "44px", 
                  height: "44px", 
                  background: "#0077B620", 
                  borderRadius: "12px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  marginBottom: "16px" 
                }}>
                  <cap.icon size={22} color="#0077B6" />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>{cap.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)", lineHeight: "1.5" }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Borehole Management Section */}
      <section id="borehole" style={{ padding: "60px 24px", background: "var(--card)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#0077B6", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>Borehole Management</div>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px" }}>Complete visibility of your groundwater network</h2>
            <p style={{ fontSize: "14px", color: "var(--muted-foreground)", lineHeight: "1.5", marginBottom: "20px" }}>
              Monitor water levels, pump performance, and recharge rates in real-time.
            </p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {["Real-time level monitoring", "Pump efficiency tracking", "Auto-alert on draw-down", "12-month trend analysis"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle size={14} color="#22c55e" />
                  <span style={{ fontSize: "13px", color: "var(--foreground)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: "var(--secondary)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", fontWeight: 800, color: "#0077B6", marginBottom: "12px" }}>24/7</div>
            <div style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "6px" }}>Continuous Monitoring</div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Real-time borehole telemetry</div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center", direction: "rtl" }}>
          <div style={{ direction: "ltr" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#0077B6", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>Analytics</div>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px" }}>Data-driven decisions</h2>
            <p style={{ fontSize: "14px", color: "var(--muted-foreground)", lineHeight: "1.5", marginBottom: "20px" }}>
              Generate compliance reports, track KPIs, and identify trends with advanced analytics.
            </p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {["Real-time dashboards", "Custom report generation", "Export to PDF/Excel", "Trend analysis"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle size={14} color="#22c55e" />
                  <span style={{ fontSize: "13px", color: "var(--foreground)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: "var(--secondary)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
            <BarChart3 size={48} color="#0077B6" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>98.7%</div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Data accuracy rate</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: "60px 24px", background: "var(--card)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", marginBottom: "40px" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
            {[
              { step: "01", title: "Connect", desc: "Rapid deployment of IoT sensors across your borehole network.", icon: "🔌" },
              { step: "02", title: "Monitor", desc: "Visualize operations in a single dashboard with real-time data.", icon: "📊" },
              { step: "03", title: "Optimize", desc: "AI algorithms tune dosing and pump schedules automatically.", icon: "⚡" }
            ].map((step, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ 
                  width: "64px", 
                  height: "64px", 
                  background: "linear-gradient(135deg, #0077B6, #00B4AA)", 
                  borderRadius: "32px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  margin: "0 auto 20px",
                  fontSize: "24px"
                }}>
                  {step.icon}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  fontWeight: 600, 
                  color: "#0077B6", 
                  marginBottom: "10px",
                  background: "#0077B610",
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "16px"
                }}>{step.step}</div>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>{step.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)", lineHeight: "1.5" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "48px", color: "#0077B6", opacity: 0.5, marginBottom: "16px" }}>"</div>
          <p style={{ fontSize: "18px", color: "var(--foreground)", lineHeight: "1.5", marginBottom: "24px", fontStyle: "italic" }}>
            Since implementing AquaOps Water Management, we've seen a 15% reduction in chemical waste and massive improvement in response time.
          </p>
          <div>
            <div style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: "2px" }}>David Miller</div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Plant Manager, Global Beverage Corp</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "0 24px 60px 24px" }}>
        <div style={{ 
          maxWidth: "900px", 
          margin: "0 auto", 
          textAlign: "center", 
          background: "linear-gradient(135deg, #0A2540, #0077B6)", 
          borderRadius: "32px", 
          padding: "48px 40px"
        }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "white", marginBottom: "12px" }}>Ready to optimize production?</h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", marginBottom: "32px", maxWidth: "450px", margin: "0 auto 32px" }}>
            Join 200+ industrial facilities using AquaOps Water Management
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={onGetStarted}
              style={{
                background: "white",
                color: "#0077B6",
                border: "none",
                padding: "10px 28px",
                borderRadius: "32px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Schedule a Demo
            </button>
            <button style={{
              background: "transparent",
              color: "white",
              border: "1.5px solid white",
              padding: "10px 28px",
              borderRadius: "32px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}>
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 24px 28px", borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <Droplets size={16} color="#0077B6" />
              <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "14px" }}>AquaOps Water management</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", lineHeight: "1.5" }}>Industrial Precision for Water Management.</p>
          </div>
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px", color: "var(--foreground)" }}>Resources</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "11px", color: "var(--muted-foreground)", lineHeight: "1.8" }}>
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Case Studies</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px", color: "var(--foreground)" }}>Support</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "11px", color: "var(--muted-foreground)", lineHeight: "1.8" }}>
              <li>Contact Support</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px", color: "var(--foreground)" }}>Stay Updated</h4>
            <div style={{ display: "flex", gap: "6px" }}>
              <input 
                type="email" 
                placeholder="Email" 
                style={{ 
                  padding: "8px 12px", 
                  borderRadius: "10px", 
                  border: "1px solid var(--border)", 
                  flex: 1,
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "12px"
                }} 
              />
              <button style={{ 
                background: "#0077B6", 
                color: "white", 
                border: "none", 
                padding: "8px 16px", 
                borderRadius: "10px", 
                cursor: "pointer",
                fontSize: "12px"
              }}>
                Join
              </button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border)", fontSize: "10px", color: "var(--muted-foreground)" }}>
          © 2026 AquaOps Pro. Industrial Precision for Water Management.
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;