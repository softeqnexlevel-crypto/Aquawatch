import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Features',  href: '#features' },
  { label: 'Stations',  href: '#stations' },
  { label: 'Pricing',   href: '#pricing' },
  { label: 'About',     href: '#about' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminDrop, setShowAdminDrop] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const close = () => setShowAdminDrop(false);
    if (showAdminDrop) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showAdminDrop]);

  const adminPages = [
    { label: 'Dashboard',  icon: '⬡', path: '/admin/dashboard' },
    { label: 'Stations',   icon: '◉', path: '/admin/stations'  },
    { label: 'Tag Rules',  icon: '⊞', path: '/admin/tags'      },
    { label: 'Alarms',     icon: '◬', path: '/admin/alarms'    },
    { label: 'Analytics',  icon: '◈', path: '/admin/analytics' },
    { label: 'Billing',    icon: '◇', path: '/admin/billing'   },
  ];

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link:hover { color: #e2e8f0 !important; }
        .admin-item:hover { background: rgba(37,99,235,.12) !important; color: #60a5fa !important; }
        .launch-btn:hover { opacity: .88; transform: translateY(-1px); }
        .mobile-link:hover { color: #e2e8f0 !important; background: rgba(255,255,255,.04) !important; }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        fontFamily: "'DM Mono','Courier New',monospace",
        background: scrolled
          ? 'rgba(6,13,26,0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(30,58,95,.6)' : '1px solid transparent',
        transition: 'background .3s, border-color .3s, backdrop-filter .3s',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 6vw',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* ── Logo ── */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 700,
            }}>≋</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.08em' }}>
              AQUASYNC
            </span>
          </div>

          {/* ── Center nav links (desktop) ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            className="desktop-nav">
            {!isAdmin && NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="nav-link"
                style={{
                  fontSize: 13, color: '#64748b', textDecoration: 'none',
                  padding: '8px 14px', borderRadius: 7,
                  letterSpacing: '0.04em', transition: 'color .15s',
                }}
              >{label}</a>
            ))}

            {/* Admin breadcrumb when inside admin */}
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                <span
                  onClick={() => navigate('/')}
                  style={{ cursor: 'pointer', color: '#64748b', letterSpacing: '0.06em' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >Public Site</span>
                <span style={{ color: '#1e3a5f' }}>›</span>
                <span style={{ color: '#60a5fa', letterSpacing: '0.06em' }}>Admin Console</span>
                <span style={{ color: '#1e3a5f' }}>›</span>
                <span style={{ color: '#e2e8f0', letterSpacing: '0.06em', textTransform: 'capitalize' }}>
                  {location.pathname.split('/').pop()}
                </span>
              </div>
            )}
          </div>

          {/* ── Right side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* Live indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
              borderRadius: 999, padding: '5px 12px', fontSize: 10,
              color: '#22c55e', letterSpacing: '0.1em',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                display: 'inline-block', animation: 'ping 1.6s ease infinite',
                boxShadow: '0 0 0 0 rgba(34,197,94,.4)',
              }} />
              9/9 LIVE
            </div>

            {/* Admin dropdown button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setShowAdminDrop(v => !v); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: showAdminDrop
                    ? 'rgba(37,99,235,.2)'
                    : 'rgba(37,99,235,.10)',
                  border: '1px solid rgba(37,99,235,.4)',
                  borderRadius: 8, padding: '8px 14px',
                  color: '#60a5fa', fontSize: 12, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '0.06em',
                  transition: 'background .15s',
                }}
              >
                <span>⬡</span>
                Admin Console
                <span style={{
                  display: 'inline-block',
                  transform: showAdminDrop ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform .2s', fontSize: 10,
                }}>▾</span>
              </button>

              {/* Dropdown */}
              {showAdminDrop && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 220,
                    background: '#0C1829',
                    border: '1px solid #1e3a5f',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                    animation: 'dropIn .18s ease both',
                    zIndex: 100,
                  }}
                >
                  {/* Dropdown header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1e3a5f',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                    }} />
                    <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.12em' }}>
                      ADMIN PAGES
                    </span>
                  </div>

                  {/* Pages */}
                  {adminPages.map(({ label, icon, path }) => {
                    const active = location.pathname === path;
                    return (
                      <div
                        key={path}
                        className="admin-item"
                        onClick={() => { navigate(path); setShowAdminDrop(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 16px', cursor: 'pointer',
                          fontSize: 13, letterSpacing: '0.03em',
                          color: active ? '#60a5fa' : '#94a3b8',
                          background: active ? 'rgba(37,99,235,.12)' : 'transparent',
                          borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
                          transition: 'all .12s',
                        }}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                        <span>{label}</span>
                        {active && (
                          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#3b82f6' }}>●</span>
                        )}
                      </div>
                    );
                  })}

                  {/* Footer */}
                  <div style={{
                    borderTop: '1px solid #1e3a5f', padding: '10px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.08em' }}>
                      AQUASYNC ADMIN
                    </span>
                    <span style={{ fontSize: 10, color: '#22c55e' }}>v2.4.1</span>
                  </div>
                </div>
              )}
            </div>

            {/* Launch / back button */}
            {!isAdmin ? (
              <button
                className="launch-btn"
                onClick={() => navigate('/admin/dashboard')}
                style={{
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '9px 20px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.04em', transition: 'all .18s',
                }}
              >Launch Console →</button>
            ) : (
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'transparent', color: '#64748b',
                  border: '1px solid #1e3a5f', borderRadius: 8,
                  padding: '8px 16px', fontSize: 12, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '0.06em', transition: 'color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >← Public Site</button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                display: 'none', // shown via media query below
                background: 'transparent', border: '1px solid #1e3a5f',
                borderRadius: 7, padding: '7px 10px', cursor: 'pointer',
                color: '#64748b', fontSize: 16, fontFamily: 'inherit',
              }}
              id="hamburger"
            >{menuOpen ? '✕' : '☰'}</button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div style={{
            background: '#0A1624', borderTop: '1px solid #1e3a5f',
            padding: '12px 6vw 20px',
          }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="mobile-link"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '11px 12px', borderRadius: 8,
                  fontSize: 14, color: '#64748b', textDecoration: 'none',
                  letterSpacing: '0.04em', transition: 'all .12s', marginBottom: 2,
                }}
              >{label}</a>
            ))}
            <div style={{ borderTop: '1px solid #1e3a5f', marginTop: 12, paddingTop: 12 }}>
              {adminPages.map(({ label, icon, path }) => (
                <div
                  key={path}
                  className="mobile-link"
                  onClick={() => { navigate(path); setMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 12px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, color: '#64748b',
                    transition: 'all .12s', marginBottom: 2,
                  }}
                >
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content isn't hidden under fixed navbar */}
      <div style={{ height: 64 }} />
    </>
  );
}