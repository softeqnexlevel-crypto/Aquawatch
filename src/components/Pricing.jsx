import { useState, useEffect } from 'react';

// ─── THEME ──────────────────────────────────────────────────────────────────
const T = {
  bg: '#060D1A', panel: '#0C1829', panel2: '#0A1422',
  border: '#1e3a5f', text: '#94a3b8', hi: '#e2e8f0',
  blue: '#2563eb', blueLight: '#60a5fa',
  cyan: '#22d3ee', green: '#22c55e',
  red: '#ef4444', amber: '#f59e0b',
};

// ─── PLANS ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Perfect for a pilot station',
    monthly: 0, annually: 0,
    trialDays: 0,
    color: T.text, accent: '#1e3a5f',
    features: [
      '3 monitoring stations',
      '10 sensor tags',
      'Email alarms only',
      '7-day data retention',
      'Community support',
    ],
    cta: 'Start free', popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For serious water utilities',
    monthly: 49, annually: 39,
    trialDays: 14,
    color: T.blue, accent: T.blue,
    features: [
      '15 stations',
      '100 sensor tags',
      'Email, SMS & push alerts',
      '12-month data retention',
      'Compliance PDF reports',
      'REST API access',
      'Priority support',
    ],
    cta: 'Start 14-day trial', popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'City-wide deployment',
    monthly: null, annually: null,
    trialDays: 30,
    color: '#8b5cf6', accent: '#8b5cf6',
    features: [
      'Unlimited stations',
      'Unlimited tags',
      'All channels + escalation',
      'Unlimited data retention',
      'White-label UI',
      'SLA & dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact sales', popular: false,
  },
];

// ─── PAYMENT MODAL ───────────────────────────────────────────────────────────
function PaymentModal({ plan, annual, onClose, onSuccess }) {
  const [step, setStep] = useState('details'); // details | processing | success
  const [form, setForm] = useState({
    name: '', email: '', card: '', expiry: '', cvv: '', zip: '',
  });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState('');

  const price = annual ? plan.annually : plan.monthly;
  const period = annual ? 'year' : 'month';
  const total = annual ? plan.annually * 12 : plan.monthly;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const formatCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.includes('@')) e.email = 'Invalid email';
    if (form.card.replace(/\s/g, '').length < 16) e.card = 'Invalid card number';
    if (form.expiry.length < 5) e.expiry = 'Invalid expiry';
    if (form.cvv.length < 3) e.cvv = 'Invalid CVV';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setStep('processing');
    setTimeout(() => { setStep('success'); }, 2200);
  };

  const inputStyle = (key) => ({
    width: '100%', background: focused === key ? '#0A1422' : '#071320',
    border: `1px solid ${errors[key] ? T.red : focused === key ? T.blue : T.border}`,
    borderRadius: 8, color: T.hi, padding: '11px 14px', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .15s, background .15s',
  });

  const cardType = () => {
    const n = form.card.replace(/\s/g, '');
    if (n.startsWith('4')) return '💳 Visa';
    if (n.startsWith('5')) return '💳 Mastercard';
    if (n.startsWith('3')) return '💳 Amex';
    return '💳';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes checkPop { 0% { transform:scale(0); } 70% { transform:scale(1.2); } 100% { transform:scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520,
        background: T.panel, border: `1px solid ${T.border}`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,.6)',
        animation: 'modalIn .25s ease both',
      }}>

        {/* Processing overlay */}
        {step === 'processing' && (
          <div style={{
            padding: '60px 40px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 52, height: 52, border: `3px solid ${T.border}`,
              borderTop: `3px solid ${T.blue}`, borderRadius: '50%',
              animation: 'spin .8s linear infinite',
            }} />
            <div style={{ fontSize: 16, color: T.hi, fontWeight: 600 }}>Processing payment…</div>
            <div style={{ fontSize: 12, color: T.text }}>Securely charging ${price}/mo via Stripe</div>
            <div style={{
              height: 4, width: 220, background: T.border, borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '100%',
                background: `linear-gradient(90deg, transparent, ${T.blue}, transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.2s ease infinite',
              }} />
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,.15)',
              border: `2px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, animation: 'checkPop .4s ease',
            }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.hi }}>You're all set!</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              Welcome to <strong style={{ color: T.blueLight }}>{plan.name}</strong>.<br />
              Check your email ({form.email}) for your receipt and login details.
            </div>
            {plan.trialDays > 0 && (
              <div style={{
                background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)',
                borderRadius: 8, padding: '10px 20px', fontSize: 12, color: T.green,
              }}>
                Your {plan.trialDays}-day free trial starts now. No charge until {
                  new Date(Date.now() + plan.trialDays * 86400000).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                }.
              </div>
            )}
            <button onClick={() => { onSuccess?.(plan); onClose(); }} style={{
              background: `linear-gradient(135deg, ${T.blue}, #1d4ed8)`,
              border: 'none', borderRadius: 10, color: '#fff',
              padding: '12px 32px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
            }}>Go to Dashboard →</button>
          </div>
        )}

        {/* Form */}
        {step === 'details' && (
          <>
            {/* Header */}
            <div style={{
              padding: '22px 26px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.12em', marginBottom: 4 }}>
                  SUBSCRIBE TO
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.hi }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: plan.color, marginTop: 4 }}>
                  {price === null ? 'Custom pricing' : price === 0 ? 'Free forever' : `$${price}/${period}`}
                  {annual && price > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: T.green, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 4, padding: '1px 6px' }}>
                      Save 20%
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} style={{
                background: 'transparent', border: 'none', color: T.text,
                fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1,
              }}>✕</button>
            </div>

            <div style={{ padding: '24px 26px' }}>
              {/* Order summary */}
              <div style={{
                background: T.panel2, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '14px 16px', marginBottom: 22,
              }}>
                <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 12 }}>ORDER SUMMARY</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.hi, marginBottom: 8 }}>
                  <span>{plan.name} Plan · {annual ? 'Annual' : 'Monthly'}</span>
                  <span>${price ?? '—'}{price != null && `/${period}`}</span>
                </div>
                {plan.trialDays > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.green }}>
                    <span>{plan.trialDays}-day free trial</span>
                    <span>-${price}</span>
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: T.hi }}>
                  <span>Due today</span>
                  <span style={{ color: plan.trialDays > 0 ? T.green : T.hi }}>
                    {plan.trialDays > 0 ? '$0.00' : price === null ? 'TBD' : `$${annual ? total : price}.00`}
                  </span>
                </div>
              </div>

              {/* Form fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 6 }}>FULL NAME</div>
                    <input style={inputStyle('name')} placeholder="Jane Mwangi"
                      value={form.name} onChange={e => set('name', e.target.value)}
                      onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
                    {errors.name && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errors.name}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 6 }}>EMAIL</div>
                    <input style={inputStyle('email')} placeholder="jane@utility.co" type="email"
                      value={form.email} onChange={e => set('email', e.target.value)}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
                    {errors.email && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errors.email}</div>}
                  </div>
                </div>

                {/* Card number */}
                <div>
                  <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 6 }}>CARD NUMBER</div>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle('card'), paddingRight: 90 }}
                      placeholder="4242 4242 4242 4242"
                      value={form.card}
                      onChange={e => set('card', formatCard(e.target.value))}
                      onFocus={() => setFocused('card')} onBlur={() => setFocused('')} />
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 11, color: T.text,
                    }}>{cardType()}</span>
                  </div>
                  {errors.card && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errors.card}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 6 }}>EXPIRY</div>
                    <input style={inputStyle('expiry')} placeholder="MM/YY"
                      value={form.expiry} onChange={e => set('expiry', formatExpiry(e.target.value))}
                      onFocus={() => setFocused('expiry')} onBlur={() => setFocused('')} />
                    {errors.expiry && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errors.expiry}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 6 }}>CVV</div>
                    <input style={inputStyle('cvv')} placeholder="···" maxLength={4}
                      value={form.cvv} onChange={e => set('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                      onFocus={() => setFocused('cvv')} onBlur={() => setFocused('')} />
                    {errors.cvv && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errors.cvv}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 6 }}>ZIP / POSTAL</div>
                    <input style={inputStyle('zip')} placeholder="00100"
                      value={form.zip} onChange={e => set('zip', e.target.value.slice(0,10))}
                      onFocus={() => setFocused('zip')} onBlur={() => setFocused('')} />
                  </div>
                </div>

                {/* Submit */}
                <button onClick={submit} style={{
                  background: `linear-gradient(135deg, ${plan.color === T.text ? '#334155' : plan.color}, ${plan.color === T.text ? '#1e293b' : plan.color}dd)`,
                  border: 'none', borderRadius: 10, color: '#fff',
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
                  marginTop: 4, transition: 'opacity .15s',
                  width: '100%',
                }}>
                  {plan.trialDays > 0
                    ? `Start ${plan.trialDays}-day free trial →`
                    : plan.monthly === 0
                    ? 'Create free account →'
                    : `Pay $${price}/${period} →`
                  }
                </button>

                {/* Trust badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: T.text, marginTop: 4 }}>
                  <span>🔒 256-bit SSL</span>
                  <span>⚡ Powered by Stripe</span>
                  <span>🔄 Cancel anytime</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TRIAL GATE (shown after free trial expires) ─────────────────────────────
function TrialGate({ secondsLeft, onUpgrade }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = (secondsLeft / (3 * 60)) * 100; // 3-min demo timer

  if (secondsLeft > 0) return null; // not yet

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(6,13,26,0.96)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Mono','Courier New',monospace",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 500, padding: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(37,99,235,.15)', border: `2px solid ${T.blue}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 24px',
        }}>≋</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: T.hi, margin: '0 0 12px',
          fontFamily: "'DM Sans','DM Mono',sans-serif" }}>Your free preview has ended</h2>
        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 28 }}>
          You've explored the AquaSync platform. To continue monitoring your water network with full access, upgrade to a paid plan.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onUpgrade('pro')} style={{
            background: `linear-gradient(135deg, ${T.blue}, #1d4ed8)`,
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '13px 28px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Upgrade to Pro — $49/mo</button>
          <button onClick={() => onUpgrade('free')} style={{
            background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.text, padding: '13px 24px',
            fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>Continue with Free</button>
        </div>
        <p style={{ fontSize: 11, color: '#334155', marginTop: 20 }}>
          No credit card required for the Free plan · 14-day trial on Pro
        </p>
      </div>
    </div>
  );
}

// ─── COUNTDOWN BANNER ────────────────────────────────────────────────────────
function TrialBanner({ secondsLeft, onUpgrade }) {
  if (secondsLeft <= 0 || secondsLeft > 3 * 60) return null;
  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const urgent = secondsLeft < 60;

  return (
    <div style={{
      position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999,
      background: urgent ? 'rgba(239,68,68,.95)' : 'rgba(37,99,235,.95)',
      backdropFilter: 'blur(8px)',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      fontFamily: "'DM Mono','Courier New',monospace",
      fontSize: 13, color: '#fff',
      borderBottom: `1px solid ${urgent ? T.red : T.blue}`,
    }}>
      <span style={{ animation: urgent ? 'ping 1s ease infinite' : 'none' }}>⏱</span>
      <span>
        Free preview ends in{' '}
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{mins}:{secs}</strong>
        {' '}— upgrade to keep full access
      </span>
      <button onClick={() => onUpgrade('pro')} style={{
        background: '#fff', color: urgent ? T.red : T.blue,
        border: 'none', borderRadius: 6, padding: '5px 14px',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>Upgrade now</button>
    </div>
  );
}

// ─── MAIN PRICING SECTION ─────────────────────────────────────────────────────
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [modal, setModal] = useState(null);           // plan id
  const [subscribed, setSubscribed] = useState(null); // plan id after success

  // Free trial timer — 3 minutes for demo (set to e.g. 10*60 for real 10-min trial)
  const TRIAL_SECONDS = 3 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TRIAL_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  // Start timer on mount (simulates user arriving on site)
  useEffect(() => {
    setTimerActive(true);
  }, []);

  useEffect(() => {
    if (!timerActive || subscribed) return;
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, secondsLeft, subscribed]);

  const activePlan = modal ? PLANS.find(p => p.id === modal) : null;

  const handleSuccess = (plan) => {
    setSubscribed(plan.id);
    setSecondsLeft(9999); // stop timer
  };

  const handleUpgrade = (planId) => {
    setModal(planId);
  };

  // Progress bar for trial time
  const trialPct = Math.max(0, (secondsLeft / TRIAL_SECONDS) * 100);
  const showBanner = secondsLeft > 0 && secondsLeft <= TRIAL_SECONDS && !subscribed;
  const showGate   = secondsLeft <= 0 && !subscribed;

  return (
    <>
      <style>{`
        @keyframes ping { 75%,100% { transform:scale(2); opacity:0; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .plan-card:hover { transform: translateY(-4px) !important; }
      `}</style>

      {/* Trial gate overlay */}
      {showGate && <TrialGate secondsLeft={secondsLeft} onUpgrade={handleUpgrade} />}

      {/* Trial countdown banner */}
      {showBanner && <TrialBanner secondsLeft={secondsLeft} onUpgrade={handleUpgrade} />}

      {/* Payment modal */}
      {modal && activePlan && (
        <PaymentModal
          plan={activePlan}
          annual={annual}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      <section id="pricing" style={{
        background: T.bg, padding: '100px 6vw',
        fontFamily: "'DM Mono','Courier New',monospace",
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(37,99,235,.07) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,99,235,.10)', border: '1px solid rgba(37,99,235,.3)',
              borderRadius: 999, padding: '5px 16px', marginBottom: 20,
              fontSize: 11, color: '#60a5fa', letterSpacing: '0.12em' }}>PRICING</div>

            <h2 style={{ fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 800, color: T.hi,
              margin: '0 0 12px', letterSpacing: '-0.02em',
              fontFamily: "'DM Sans','DM Mono',sans-serif" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 15, color: T.text, marginBottom: 28 }}>
              Scale from a single pilot station to a city-wide distribution network.
            </p>

            {/* Free trial progress bar */}
            {!subscribed && (
              <div style={{ maxWidth: 360, margin: '0 auto 28px', animation: 'fadeUp .5s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.text, marginBottom: 6 }}>
                  <span>Free preview session</span>
                  <span style={{ color: secondsLeft < 60 ? T.red : T.blueLight, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2,'0')} remaining
                  </span>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${trialPct}%`,
                    background: trialPct > 50
                      ? `linear-gradient(90deg, ${T.blue}, ${T.cyan})`
                      : trialPct > 20
                      ? `linear-gradient(90deg, ${T.amber}, ${T.blue})`
                      : `linear-gradient(90deg, ${T.red}, ${T.amber})`,
                    borderRadius: 2, transition: 'width 1s linear, background .5s',
                  }} />
                </div>
              </div>
            )}

            {/* Subscribed badge */}
            {subscribed && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
                background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)',
                borderRadius: 999, padding: '7px 18px', fontSize: 12, color: T.green }}>
                ✓ You are subscribed to the <strong style={{ marginLeft: 4 }}>
                  {PLANS.find(p => p.id === subscribed)?.name}
                </strong> plan
              </div>
            )}

            {/* Billing toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14,
              background: T.panel, border: `1px solid ${T.border}`, borderRadius: 999, padding: '8px 20px' }}>
              <span style={{ fontSize: 12, letterSpacing: '0.08em', color: !annual ? T.hi : T.text }}>MONTHLY</span>
              <div onClick={() => setAnnual(a => !a)} style={{ width: 44, height: 24, borderRadius: 12,
                background: annual ? T.blue : '#1e3a5f', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: annual ? 22 : 3, transition: 'left .2s' }} />
              </div>
              <span style={{ fontSize: 12, letterSpacing: '0.08em', color: annual ? T.hi : T.text }}>ANNUALLY</span>
              {annual && <span style={{ fontSize: 10, color: T.green, background: 'rgba(34,197,94,.1)',
                border: '1px solid rgba(34,197,94,.25)', borderRadius: 4, padding: '2px 8px' }}>SAVE 20%</span>}
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
            {PLANS.map((plan, i) => {
              const price = annual ? plan.annually : plan.monthly;
              const isActive = subscribed === plan.id;
              return (
                <div key={plan.id} className="plan-card" style={{
                  background: T.panel,
                  border: `1px solid ${isActive ? T.green : plan.popular ? plan.color : T.border}`,
                  borderRadius: 16, padding: '28px 26px',
                  position: 'relative', cursor: 'default',
                  boxShadow: plan.popular ? `0 0 40px rgba(37,99,235,.12)` : 'none',
                  transition: 'transform .2s, box-shadow .2s',
                  animation: `fadeUp .5s ${i * 0.1}s ease both`,
                }}>
                  {plan.popular && !isActive && (
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: `linear-gradient(135deg, ${T.blue}, #1d4ed8)`, color: '#fff',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                  )}
                  {isActive && (
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(34,197,94,.9)', color: '#fff',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>✓ YOUR PLAN</div>
                  )}

                  <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.12em', marginBottom: 6 }}>
                    {plan.tagline.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.hi, marginBottom: 14,
                    fontFamily: "'DM Sans','DM Mono',sans-serif" }}>{plan.name}</div>

                  <div style={{ marginBottom: 22 }}>
                    {price === null ? (
                      <div style={{ fontSize: 36, fontWeight: 800, color: T.hi, fontFamily: "'DM Sans',sans-serif" }}>Custom</div>
                    ) : price === 0 ? (
                      <div style={{ fontSize: 36, fontWeight: 800, color: T.hi, fontFamily: "'DM Sans',sans-serif" }}>
                        $0<span style={{ fontSize: 14, fontWeight: 400, color: T.text }}>/mo</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 38, fontWeight: 800, color: plan.color, fontFamily: "'DM Sans',sans-serif" }}>
                          ${price}
                        </span>
                        <span style={{ fontSize: 14, color: T.text }}>/mo</span>
                        {annual && <span style={{ fontSize: 11, color: T.green, marginLeft: 4 }}>billed annually</span>}
                      </div>
                    )}
                    {plan.trialDays > 0 && (
                      <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>
                        {plan.trialDays}-day free trial included
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginBottom: 22 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                        fontSize: 13, color: '#94a3b8', marginBottom: 11 }}>
                        <span style={{ color: T.green, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => !isActive && setModal(plan.id)}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 10, fontSize: 14,
                      fontWeight: 700, cursor: isActive ? 'default' : 'pointer',
                      fontFamily: 'inherit', letterSpacing: '0.04em',
                      transition: 'opacity .15s',
                      background: isActive
                        ? 'rgba(34,197,94,.1)'
                        : plan.popular
                        ? `linear-gradient(135deg, ${T.blue}, #1d4ed8)`
                        : 'transparent',
                      color: isActive ? T.green : T.hi,
                      border: isActive
                        ? '1px solid rgba(34,197,94,.3)'
                        : plan.popular
                        ? 'none'
                        : `1px solid ${T.border}`,
                    }}
                    onMouseEnter={e => { if (!isActive && !plan.popular) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
                    onMouseLeave={e => { if (!isActive && !plan.popular) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isActive ? '✓ Current plan' : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Feature comparison table */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`,
              fontSize: 10, color: T.text, letterSpacing: '0.14em' }}>FEATURE COMPARISON</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: T.text, fontWeight: 400, width: '40%' }}>FEATURE</th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ textAlign: 'center', padding: '12px 16px', color: p.popular ? T.blueLight : T.text, fontWeight: p.popular ? 700 : 400 }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Monitoring stations', '3', '15', 'Unlimited'],
                  ['Sensor tags', '10', '100', 'Unlimited'],
                  ['Data retention', '7 days', '12 months', 'Unlimited'],
                  ['Alarm channels', 'Email', 'Email, SMS, Push', 'All + escalation'],
                  ['Compliance reports', '✗', '✓', '✓'],
                  ['REST API', '✗', '✓', '✓'],
                  ['White-label UI', '✗', '✗', '✓'],
                  ['SLA guarantee', '✗', '✗', '✓'],
                ].map(([feat, ...vals], ri) => (
                  <tr key={feat} style={{ borderBottom: `1px solid rgba(30,58,95,.4)`, background: ri % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                    <td style={{ padding: '12px 24px', color: T.text }}>{feat}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} style={{ textAlign: 'center', padding: '12px 16px',
                        color: v === '✗' ? '#334155' : v === '✓' ? T.green : T.hi }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trust row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 36, marginTop: 36,
            fontSize: 12, color: T.text, flexWrap: 'wrap' }}>
            {['🔒 256-bit SSL encryption','⚡ Powered by Stripe','🔄 Cancel anytime','📋 WHO standards aligned'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}