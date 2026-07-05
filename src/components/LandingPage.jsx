// frontend/src/components/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Droplets, FlaskConical, Wrench, FileText,
  Play, ArrowRight, Moon, Sun, Gauge, TrendingUp,
  Menu, X, CheckCircle, BarChart3, ChevronDown,
  Users, Shield, Zap, Clock, Star
} from "lucide-react";
import { LoginModal } from "./Login";
import { useAuth } from "../contexts/AuthContext";

// ── Animated counter ──────────────────────────────────────────────────────────
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

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:10 }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:"var(--card)",border:"none",cursor:"pointer",textAlign:"left" }}>
        <span style={{ fontSize:14,fontWeight:600,color:"var(--foreground)" }}>{q}</span>
        <ChevronDown size={16} style={{ color:"var(--muted-foreground)",transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0 }}/>
      </button>
      {open && <div style={{ padding:"0 20px 16px",fontSize:13,color:"var(--muted-foreground)",lineHeight:1.6,background:"var(--card)" }}>{a}</div>}
    </div>
  );
}

// ── Main LandingPage ──────────────────────────────────────────────────────────
function LandingPage({ onGetStarted, darkMode, onToggleDark }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen]           = useState(false);
  const [videoOpen, setVideoOpen]           = useState(false);
  const { user, logout }                    = useAuth();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label:"Features",    id:"features" },
    { label:"Borehole",    id:"borehole" },
    { label:"Analytics",   id:"analytics" },
    { label:"Pricing",     id:"pricing" },
    { label:"How it Works",id:"how-it-works" },
    { label:"FAQ",         id:"faq" },
  ];

  const PLANS = [
    {
      name:"Starter", price:150, per:"month", color:"#0077B6",
      features:["Up to 3 boreholes","Real-time dashboard","Basic reporting","Email support"],
      cta:"Get Started",
    },
    {
      name:"Professional", price:450, per:"month", color:"#00B4AA", highlight:true,
      features:["Up to 15 boreholes","Advanced analytics","Chemical dosing AI","Priority support","Custom alerts","CSV/PDF export"],
      cta:"Start Free Trial",
    },
    {
      name:"Enterprise", price:null, per:"custom", color:"#0A2540",
      features:["Unlimited boreholes","On-premise deployment","SLA guarantee","Dedicated account manager","API access","Training & onboarding"],
      cta:"Contact Sales",
    },
  ];

  const FAQS = [
    { q:"How quickly can I get started?", a:"Most customers are up and running within 48 hours. Our team handles sensor installation and data pipeline setup." },
    { q:"Does AquaOps work with existing SCADA systems?", a:"Yes — AquaOps integrates with Modbus, OPC-UA, and most industrial protocols via our API gateway." },
    { q:"Is my data stored securely?", a:"All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are ISO 27001 certified." },
    { q:"Can I export reports to Excel or PDF?", a:"Yes, every report and chart can be exported to CSV, XLSX, or PDF with one click from the Analytics module." },
    { q:"What roles and permissions are supported?", a:"AquaOps supports Admin, Operator, and Client roles out of the box. Admins can access all pages; Operators see Dashboard, Maintenance and Reports; Clients see Dashboard and Analytics in read-only mode." },
    { q:"Is there a free trial?", a:"The Professional plan includes a 14-day free trial — no credit card required." },
  ];

  return (
    <div style={{ background:"var(--background)",minHeight:"100vh",color:"var(--foreground)",overflowX:"hidden" }}>

      {/* ── Nav ── */}
      <nav style={{ position:"sticky",top:0,background:"var(--card)",backdropFilter:"blur(8px)",borderBottom:"1px solid var(--border)",zIndex:50,padding:"12px 24px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div onClick={() => scrollTo('hero')} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer" }}>
            <div style={{ width:28,height:28,background:"linear-gradient(135deg,#0077B6,#00B4AA)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Droplets size={16} color="white"/>
            </div>
            <span style={{ fontSize:18,fontWeight:700,color:"var(--foreground)" }}>
              Aqua<span style={{ color:"#0077B6" }}>Ops</span>{" "}
              <em style={{ fontSize:12 }}>Water Management</em>
              <span style={{ fontSize:8,fontWeight:500,background:"#00B4AA20",padding:"2px 6px",borderRadius:20,marginLeft:8,color:"#00B4AA" }}>v4.2</span>
            </span>
          </div>

          <div style={{ display:"flex",gap:20,alignItems:"center" }}>
            <div style={{ display:"flex",gap:16,alignItems:"center" }}>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)} style={{ fontSize:13,fontWeight:500,color:"var(--muted-foreground)",background:"none",border:"none",cursor:"pointer" }}>{l.label}</button>
              ))}
            </div>
            <button onClick={onToggleDark} style={{ background:"var(--secondary)",color:"var(--foreground)",border:"1px solid var(--border)",padding:"6px 10px",borderRadius:32,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
              {darkMode ? <Sun size={12}/> : <Moon size={12}/>}{darkMode?"Light":"Dark"}
            </button>
            {user ? (
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <button onClick={logout} style={{ background:"var(--secondary)",color:"var(--muted-foreground)",border:"1px solid var(--border)",padding:"8px 14px",borderRadius:32,fontSize:12,cursor:"pointer" }}>Sign Out</button>
              </div>
            ) : (
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={() => setLoginOpen(true)} style={{ background:"var(--secondary)",color:"var(--foreground)",border:"1px solid var(--border)",padding:"8px 16px",borderRadius:32,fontSize:13,fontWeight:600,cursor:"pointer" }}>Sign In</button>
              </div>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display:"none",background:"none",border:"none",cursor:"pointer" }} className="mobile-menu-btn">
            {mobileMenuOpen ? <X size={22} color="var(--foreground)"/> : <Menu size={22} color="var(--foreground)"/>}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{ position:"absolute",top:60,left:0,right:0,background:"var(--card)",borderBottom:"1px solid var(--border)",padding:16,display:"flex",flexDirection:"column",gap:12,zIndex:50 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)} style={{ fontSize:14,padding:"8px 0",background:"none",border:"none",textAlign:"left",cursor:"pointer",color:"var(--foreground)" }}>{l.label}</button>
            ))}
            <button onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }} style={{ background:"var(--secondary)",border:"1px solid var(--border)",color:"var(--foreground)",padding:10,borderRadius:32,fontSize:13,fontWeight:600,cursor:"pointer" }}>Sign In</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="hero" style={{ padding:"60px 24px",background:"linear-gradient(135deg,var(--background) 0%,var(--card) 100%)" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"center" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap" }}>
              <div style={{ display:"flex",alignItems:"center",gap:5,background:"#22c55e20",padding:"4px 10px",borderRadius:32 }}>
                <div style={{ width:6,height:6,background:"#22c55e",borderRadius:"50%",animation:"pulse 2s infinite" }}/>
                <span style={{ fontSize:11,fontWeight:600,color:"#22c55e" }}>Active</span>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6,background:"var(--secondary)",padding:"4px 10px",borderRadius:32 }}>
                <Gauge size={12} color="var(--muted-foreground)"/>
                <span style={{ fontSize:11,color:"var(--muted-foreground)" }}>Flow: 1,248 m³/hr</span>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6,background:"var(--secondary)",padding:"4px 10px",borderRadius:32 }}>
                <TrendingUp size={12} color="#00B4AA"/>
                <span style={{ fontSize:11,color:"var(--muted-foreground)" }}>recharge +2.4%</span>
              </div>
            </div>

            <h1 style={{ fontSize:42,fontWeight:800,color:"var(--foreground)",lineHeight:1.15,marginBottom:20,letterSpacing:"-0.02em" }}>
              Industrial Precision for<br/>
              <span style={{ color:"#0077B6" }}>Water Management</span>
            </h1>
            <p style={{ fontSize:15,color:"var(--muted-foreground)",lineHeight:1.6,marginBottom:28,maxWidth:500 }}>
              The all-in-one platform for real-time borehole monitoring, chemical treatment optimization, and predictive maintenance.
            </p>
            <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
              <button onClick={() => setLoginOpen(true)} style={{ background:"#0077B6",color:"white",border:"none",padding:"11px 26px",borderRadius:32,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                Sign In <ArrowRight size={14}/>
              </button>
              <button onClick={() => setVideoOpen(true)} style={{ background:"transparent",color:"#0077B6",border:"1.5px solid #0077B6",padding:"11px 24px",borderRadius:32,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                <Play size={12}/> Watch Video
              </button>
            </div>

            {/* Animated stats */}
            <div style={{ display:"flex",gap:36,marginTop:48,flexWrap:"wrap" }}>
              {[
                { value:1200000000, suffix:"+", prefix:"", label:"Litres Managed", short:"1.2B+" },
                { value:99.9, suffix:"%", prefix:"", label:"System Uptime", short:"99.9%" },
                { value:15,   suffix:"%", prefix:"", label:"Chemical Savings", short:"15%" },
                { value:200,  suffix:"+", prefix:"", label:"Facilities", short:"200+" },
              ].map((s,i) => (
                <div key={i}>
                  <div style={{ fontSize:28,fontWeight:800,color:"#0077B6" }}>{s.short}</div>
                  <div style={{ fontSize:11,color:"var(--muted-foreground)",marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview card */}
          <div style={{ background:"var(--card)",borderRadius:24,padding:24,border:"1px solid var(--border)",boxShadow:"0 20px 35px -12px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div>
                <div style={{ fontSize:10,fontWeight:600,color:"#00B4AA",textTransform:"uppercase",letterSpacing:1,marginBottom:2 }}>LIVE FLOW</div>
                <div style={{ fontSize:14,fontWeight:700,color:"var(--foreground)" }}>AquaOps Water Management</div>
              </div>
              <div style={{ display:"flex",gap:4 }}>
                {["#22c55e","#22c55e","#22c55e"].map((c,i) => <div key={i} style={{ width:8,height:8,background:c,borderRadius:"50%" }}/>)}
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
              <div style={{ background:"var(--secondary)",borderRadius:12,padding:12 }}>
                <div style={{ fontSize:10,color:"var(--muted-foreground)",marginBottom:4 }}>System Recovery</div>
                <div style={{ fontSize:26,fontWeight:700,color:"#22c55e" }}>94.2%</div>
                <div style={{ fontSize:9,color:"#22c55e",marginTop:2 }}>↑ +2.1%</div>
              </div>
              <div style={{ background:"var(--secondary)",borderRadius:12,padding:12 }}>
                <div style={{ fontSize:10,color:"var(--muted-foreground)",marginBottom:4 }}>Active Pumps</div>
                <div style={{ fontSize:26,fontWeight:700,color:"var(--foreground)" }}>04</div>
                <div style={{ fontSize:9,color:"var(--muted-foreground)",marginTop:2 }}>Pump_04 @ 88%</div>
              </div>
            </div>
            <div style={{ background:"var(--secondary)",borderRadius:12,padding:14,marginBottom:14 }}>
              <div style={{ fontSize:10,color:"var(--muted-foreground)",marginBottom:6 }}>Total Flow Rate</div>
              <div style={{ fontSize:34,fontWeight:800,color:"#00B4AA",fontFamily:"monospace" }}>1,248</div>
              <div style={{ fontSize:11,color:"var(--muted-foreground)" }}>m³/hour · +128 from 6am</div>
              <div style={{ marginTop:10,height:3,background:"var(--border)",borderRadius:3,overflow:"hidden" }}>
                <div style={{ width:"78%",height:"100%",background:"linear-gradient(90deg,#0077B6,#00B4AA)" }}/>
              </div>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize:9,color:"#00B4AA",fontWeight:600 }}>PUMP_04</div>
                <div style={{ fontSize:13,fontWeight:600,color:"var(--foreground)" }}>ACTIVE</div>
              </div>
              <div style={{ display:"flex",gap:5 }}>
                {["#22c55e","#22c55e","#22c55e","#eab308"].map((c,i) => <div key={i} style={{ width:8,height:8,background:c,borderRadius:"50%" }}/>)}
              </div>
              <div style={{ fontSize:9,color:"var(--muted-foreground)" }}>Updated: 2s ago</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Animated KPI bar ── */}
      <section style={{ background:"linear-gradient(135deg,#0077B6,#00B4AA)",padding:"36px 24px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32,textAlign:"center" }}>
          {[
            { label:"Litres Managed",    target:1200,  suffix:"M+",   prefix:"" },
            { label:"System Uptime",     target:99,    suffix:".9%",  prefix:"" },
            { label:"Chemical Savings",  target:15,    suffix:"%",    prefix:"" },
            { label:"Facilities",        target:200,   suffix:"+",    prefix:"" },
          ].map((s,i) => (
            <div key={i}>
              <div style={{ fontSize:36,fontWeight:800,color:"white",lineHeight:1 }}>
                <AnimatedCounter target={s.target} suffix={s.suffix} prefix={s.prefix} duration={1800}/>
              </div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding:"72px 24px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",textAlign:"center" }}>
          <div style={{ display:"inline-flex",background:"#0077B610",padding:"4px 14px",borderRadius:32,marginBottom:14 }}>
            <span style={{ fontSize:11,fontWeight:600,color:"#0077B6",textTransform:"uppercase",letterSpacing:"1.5px" }}>Capabilities</span>
          </div>
          <h2 style={{ fontSize:32,fontWeight:700,color:"var(--foreground)",marginBottom:12 }}>Precision Control</h2>
          <p style={{ fontSize:15,color:"var(--muted-foreground)",maxWidth:600,margin:"0 auto 40px" }}>Everything you need for industrial-grade water management</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:24 }}>
            {[
              { icon:Droplets,   title:"Real-time Borehole", desc:"Continuous monitoring of draw-down levels, pump efficiency, and recharge rates." },
              { icon:FlaskConical,title:"Chemical Dosing",   desc:"Automated antiscalant optimization based on real-time water chemistry." },
              { icon:Wrench,     title:"Smart Maintenance",  desc:"Predictive failure modeling improves MTBF by up to 30%." },
              { icon:FileText,   title:"Compliance",         desc:"Automated audit trails and environmental reporting templates." },
              { icon:Shield,     title:"Role-based Access",  desc:"Admin, Operator, and Client roles — each with tailored page visibility." },
              { icon:Users,      title:"Team Management",    desc:"Add, deactivate, and manage users with full audit history." },
              { icon:Zap,        title:"AI Optimization",    desc:"Machine-learning dosing schedules adapt to seasonal water quality shifts." },
              { icon:Clock,      title:"24/7 Uptime",        desc:"Redundant cloud infrastructure with 99.9% SLA guarantee." },
            ].map((cap,i) => (
              <div key={i} style={{ textAlign:"left",padding:20,background:"var(--card)",borderRadius:16,border:"1px solid var(--border)" }}>
                <div style={{ width:44,height:44,background:"#0077B615",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14 }}>
                  <cap.icon size={20} color="#0077B6"/>
                </div>
                <h3 style={{ fontSize:15,fontWeight:600,color:"var(--foreground)",marginBottom:6 }}>{cap.title}</h3>
                <p style={{ fontSize:13,color:"var(--muted-foreground)",lineHeight:1.5 }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Borehole ── */}
      <section id="borehole" style={{ padding:"60px 24px",background:"var(--card)" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11,fontWeight:600,color:"#0077B6",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:12 }}>Borehole Management</div>
            <h2 style={{ fontSize:28,fontWeight:700,color:"var(--foreground)",marginBottom:14 }}>Complete visibility of your groundwater network</h2>
            <p style={{ fontSize:14,color:"var(--muted-foreground)",lineHeight:1.6,marginBottom:20 }}>Monitor water levels, pump performance, and recharge rates in real-time.</p>
            <ul style={{ listStyle:"none",padding:0 }}>
              {["Real-time level monitoring","Pump efficiency tracking","Auto-alert on draw-down","12-month trend analysis"].map(item => (
                <li key={item} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                  <CheckCircle size={14} color="#22c55e"/>
                  <span style={{ fontSize:13,color:"var(--foreground)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background:"var(--secondary)",borderRadius:16,padding:28,textAlign:"center" }}>
            <div style={{ fontSize:48,fontWeight:800,color:"#0077B6",marginBottom:10 }}>24/7</div>
            <div style={{ fontSize:14,color:"var(--foreground)",marginBottom:4 }}>Continuous Monitoring</div>
            <div style={{ fontSize:12,color:"var(--muted-foreground)" }}>Real-time borehole telemetry</div>
          </div>
        </div>
      </section>

      {/* ── Analytics ── */}
      <section id="analytics" style={{ padding:"60px 24px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11,fontWeight:600,color:"#0077B6",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:12 }}>Analytics</div>
            <h2 style={{ fontSize:28,fontWeight:700,color:"var(--foreground)",marginBottom:14 }}>Data-driven decisions</h2>
            <p style={{ fontSize:14,color:"var(--muted-foreground)",lineHeight:1.6,marginBottom:20 }}>Generate compliance reports, track KPIs, and identify trends.</p>
            <ul style={{ listStyle:"none",padding:0 }}>
              {["Real-time dashboards","Custom report generation","Export to PDF/Excel","Trend analysis"].map(item => (
                <li key={item} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                  <CheckCircle size={14} color="#22c55e"/>
                  <span style={{ fontSize:13,color:"var(--foreground)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background:"var(--secondary)",borderRadius:16,padding:28,textAlign:"center" }}>
            <BarChart3 size={48} color="#0077B6" style={{ margin:"0 auto 12px" }}/>
            <div style={{ fontSize:18,fontWeight:600,color:"var(--foreground)" }}>98.7%</div>
            <div style={{ fontSize:12,color:"var(--muted-foreground)" }}>Data accuracy rate</div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding:"72px 24px",background:"var(--card)" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",textAlign:"center" }}>
          <div style={{ display:"inline-flex",background:"#0077B610",padding:"4px 14px",borderRadius:32,marginBottom:14 }}>
            <span style={{ fontSize:11,fontWeight:600,color:"#0077B6",textTransform:"uppercase",letterSpacing:"1.5px" }}>Pricing</span>
          </div>
          <h2 style={{ fontSize:32,fontWeight:700,color:"var(--foreground)",marginBottom:10 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize:15,color:"var(--muted-foreground)",maxWidth:500,margin:"0 auto 40px" }}>Scale as you grow — no hidden fees.</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,alignItems:"start" }}>
            {PLANS.map((plan,i) => (
              <div key={i} style={{ background:plan.highlight?"linear-gradient(135deg,#0077B6,#00B4AA)":"var(--background)",borderRadius:20,padding:28,border:plan.highlight?"none":"1px solid var(--border)",position:"relative",transform:plan.highlight?"scale(1.04)":"none",boxShadow:plan.highlight?"0 20px 40px rgba(0,119,182,0.25)":"none" }}>
                {plan.highlight && <div style={{ position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#eab308",color:"#1a1410",fontSize:10,fontWeight:700,padding:"3px 14px",borderRadius:20,letterSpacing:"0.08em" }}>MOST POPULAR</div>}
                <div style={{ fontSize:18,fontWeight:700,color:plan.highlight?"white":"var(--foreground)",marginBottom:8 }}>{plan.name}</div>
                <div style={{ marginBottom:20 }}>
                  {plan.price ? (
                    <><span style={{ fontSize:36,fontWeight:800,color:plan.highlight?"white":"#0077B6" }}>${plan.price}</span>
                    <span style={{ fontSize:13,color:plan.highlight?"rgba(255,255,255,0.7)":"var(--muted-foreground)" }}>/{plan.per}</span></>
                  ) : (
                    <span style={{ fontSize:26,fontWeight:800,color:plan.highlight?"white":"#0077B6" }}>Custom</span>
                  )}
                </div>
                <ul style={{ listStyle:"none",padding:0,marginBottom:24 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10,textAlign:"left" }}>
                      <CheckCircle size={13} color={plan.highlight?"white":"#22c55e"}/>
                      <span style={{ fontSize:13,color:plan.highlight?"rgba(255,255,255,0.9)":"var(--foreground)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setLoginOpen(true)} style={{ width:"100%",padding:"11px 0",borderRadius:32,fontSize:13,fontWeight:600,cursor:"pointer",border:plan.highlight?"none":"1.5px solid #0077B6",background:plan.highlight?"white":"transparent",color:plan.highlight?"#0077B6":"#0077B6" }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding:"60px 24px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",textAlign:"center" }}>
          <h2 style={{ fontSize:32,fontWeight:700,color:"var(--foreground)",marginBottom:40 }}>How It Works</h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:40 }}>
            {[
              { step:"01",title:"Connect",  desc:"Rapid deployment of IoT sensors across your borehole network.", icon:"🔌" },
              { step:"02",title:"Monitor",  desc:"Visualize operations in a single dashboard with real-time data.", icon:"📊" },
              { step:"03",title:"Optimize", desc:"AI algorithms tune dosing and pump schedules automatically.", icon:"⚡" },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ width:64,height:64,background:"linear-gradient(135deg,#0077B6,#00B4AA)",borderRadius:32,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24 }}>{s.icon}</div>
                <div style={{ fontSize:12,fontWeight:600,color:"#0077B6",marginBottom:8,background:"#0077B610",display:"inline-block",padding:"2px 10px",borderRadius:16 }}>{s.step}</div>
                <h3 style={{ fontSize:20,fontWeight:600,color:"var(--foreground)",marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:13,color:"var(--muted-foreground)",lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding:"60px 24px",background:"var(--card)" }}>
        <div style={{ maxWidth:1280,margin:"0 auto" }}>
          <h2 style={{ fontSize:28,fontWeight:700,color:"var(--foreground)",textAlign:"center",marginBottom:36 }}>What our customers say</h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24 }}>
            {[
              { quote:"Since implementing AquaOps, we've seen a 15% reduction in chemical waste and a massive improvement in response time.", name:"David Miller", role:"Plant Manager, Global Beverage Corp", stars:5 },
              { quote:"The role-based access feature is a game changer. Our operators stay focused on what matters and clients get real transparency.", name:"Amina Osei", role:"Operations Director, Nairobi Water Co.", stars:5 },
              { quote:"Deployment took under 48 hours and the predictive maintenance module has prevented two costly pump failures this quarter.", name:"James Kariuki", role:"Chief Engineer, Rift Valley Utilities", stars:5 },
            ].map((t,i) => (
              <div key={i} style={{ background:"var(--secondary)",borderRadius:16,padding:24,border:"1px solid var(--border)" }}>
                <div style={{ display:"flex",gap:3,marginBottom:14 }}>
                  {Array.from({length:t.stars}).map((_,j) => <Star key={j} size={14} fill="#eab308" color="#eab308"/>)}
                </div>
                <p style={{ fontSize:13,color:"var(--foreground)",lineHeight:1.6,marginBottom:16,fontStyle:"italic" }}>"{t.quote}"</p>
                <div style={{ fontSize:12,fontWeight:700,color:"var(--foreground)" }}>{t.name}</div>
                <div style={{ fontSize:11,color:"var(--muted-foreground)" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding:"72px 24px" }}>
        <div style={{ maxWidth:760,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:36 }}>
            <div style={{ display:"inline-flex",background:"#0077B610",padding:"4px 14px",borderRadius:32,marginBottom:12 }}>
              <span style={{ fontSize:11,fontWeight:600,color:"#0077B6",textTransform:"uppercase",letterSpacing:"1.5px" }}>FAQ</span>
            </div>
            <h2 style={{ fontSize:28,fontWeight:700,color:"var(--foreground)" }}>Frequently Asked Questions</h2>
          </div>
          {FAQS.map((f,i) => <FAQItem key={i} q={f.q} a={f.a}/>)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"0 24px 72px" }}>
        <div style={{ maxWidth:900,margin:"0 auto",textAlign:"center",background:"linear-gradient(135deg,#0A2540,#0077B6)",borderRadius:32,padding:"52px 40px" }}>
          <h2 style={{ fontSize:28,fontWeight:700,color:"white",marginBottom:10 }}>Ready to optimize production?</h2>
          <p style={{ fontSize:14,color:"rgba(255,255,255,0.8)",marginBottom:32,maxWidth:450,margin:"0 auto 32px" }}>Join 200+ industrial facilities using AquaOps Water Management</p>
          <div style={{ display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap" }}>
            <button onClick={() => setLoginOpen(true)} style={{ background:"white",color:"#0077B6",border:"none",padding:"11px 28px",borderRadius:32,fontSize:14,fontWeight:600,cursor:"pointer" }}>Sign In</button>
            <button style={{ background:"transparent",color:"white",border:"1.5px solid white",padding:"11px 28px",borderRadius:32,fontSize:14,fontWeight:600,cursor:"pointer" }}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:"40px 24px 28px",borderTop:"1px solid var(--border)",background:"var(--card)" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:40 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:10 }}>
              <Droplets size={16} color="#0077B6"/>
              <span style={{ fontWeight:700,color:"var(--foreground)",fontSize:14 }}>AquaOps Water Management</span>
            </div>
            <p style={{ fontSize:11,color:"var(--muted-foreground)",lineHeight:1.6 }}>Industrial Precision for Water Management.</p>
          </div>
          <div>
            <h4 style={{ fontSize:12,fontWeight:600,marginBottom:10,color:"var(--foreground)" }}>Resources</h4>
            <ul style={{ listStyle:"none",padding:0,fontSize:11,color:"var(--muted-foreground)",lineHeight:2 }}>
              <li>Documentation</li><li>API Reference</li><li>Case Studies</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize:12,fontWeight:600,marginBottom:10,color:"var(--foreground)" }}>Support</h4>
            <ul style={{ listStyle:"none",padding:0,fontSize:11,color:"var(--muted-foreground)",lineHeight:2 }}>
              <li>Contact Support</li><li>Privacy Policy</li><li>Terms of Service</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize:12,fontWeight:600,marginBottom:10,color:"var(--foreground)" }}>Stay Updated</h4>
            <div style={{ display:"flex",gap:6 }}>
              <input type="email" placeholder="Email" style={{ padding:"8px 10px",borderRadius:8,border:"1px solid var(--border)",flex:1,background:"var(--background)",color:"var(--foreground)",fontSize:12,outline:"none" }}/>
              <button style={{ background:"#0077B6",color:"white",border:"none",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:12 }}>Join</button>
            </div>
          </div>
        </div>
        <div style={{ textAlign:"center",marginTop:36,paddingTop:20,borderTop:"1px solid var(--border)",fontSize:10,color:"var(--muted-foreground)" }}>
          © 2026 AquaOps Pro. Industrial Precision for Water Management.
        </div>
      </footer>

      {/* ── Login modal ── */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={onGetStarted}/>

      {/* ── Video modal ── */}
      {videoOpen && (
        <div onClick={() => setVideoOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"var(--card)",borderRadius:16,padding:24,width:"100%",maxWidth:640,border:"1px solid var(--border)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <span style={{ fontSize:14,fontWeight:600,color:"var(--foreground)" }}>AquaOps Platform Demo</span>
              <button onClick={() => setVideoOpen(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted-foreground)" }}><X size={16}/></button>
            </div>
            <div style={{ background:"var(--secondary)",borderRadius:10,height:320,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ width:56,height:56,background:"#0077B6",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",cursor:"pointer" }}>
                  <Play size={22} color="white" fill="white"/>
                </div>
                <div style={{ fontSize:13,color:"var(--muted-foreground)" }}>Demo video coming soon</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width:768px) { .mobile-menu-btn { display:block !important; } }
      `}</style>
    </div>
  );
}

export default LandingPage;