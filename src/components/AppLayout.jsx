import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './Navbar';

const navItems = [
  { to: '/admin/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/admin/stations',  icon: '◉', label: 'Stations'  },
  { to: '/admin/tags',      icon: '⊞', label: 'Tag Rules' },
  { to: '/admin/alarms',    icon: '◬', label: 'Alarms'    },
  { to: '/admin/analytics', icon: '◈', label: 'Analytics' },
  { to: '/admin/billing',   icon: '◇', label: 'Billing'   },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#07111F', fontFamily: "'DM Mono','Courier New',monospace", color: '#C8E6F5',
    }}>
      {/* Shared Navbar sits at top */}
      <Navbar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: collapsed ? 64 : 220,
          background: '#0A1828',
          borderRight: '1px solid #1A3A52',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s ease',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Logo row */}
          <div style={{
            padding: '18px 16px', borderBottom: '1px solid #1A3A52',
            display: 'flex', alignItems: 'center', gap: 12, minWidth: 220,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0, color: '#fff', fontWeight: 700,
            }}>≋</div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#E0F4FF' }}>AQUASYNC</div>
                <div style={{ fontSize: 9, color: '#4A8FA8', letterSpacing: '0.12em' }}>ADMIN CONSOLE</div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, padding: '14px 8px' }}>
            {navItems.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                textDecoration: 'none', fontSize: 13, letterSpacing: '0.04em',
                color: isActive ? '#60a5fa' : '#6BA3BC',
                background: isActive ? 'rgba(37,99,235,.12)' : 'transparent',
                borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
              })}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)} style={{
            margin: '0 8px 16px', padding: '10px 12px',
            background: 'rgba(37,99,235,.06)', border: '1px solid #1A3A52',
            borderRadius: 8, color: '#4A8FA8', cursor: 'pointer',
            fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}>
            {collapsed ? '→' : '← Collapse'}
          </button>
        </aside>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sub-header bar */}
          <div style={{
            height: 48, background: '#0A1828', borderBottom: '1px solid #1A3A52',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 11, color: '#4A8FA8', letterSpacing: '0.08em' }}>
                SYSTEM ONLINE · {new Date().toUTCString().slice(0, 25)} UTC
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#0D2235',
                border: '1px solid #1A3A52', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, color: '#60a5fa', cursor: 'pointer',
              }}>A</div>
            </div>
          </div>

          {/* Page outlet */}
          <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}