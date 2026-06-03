import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
 
const navItems = [
  { to: '/admin/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/admin/stations',  icon: '◉', label: 'Stations' },
  { to: '/admin/tags',      icon: '⊞', label: 'Tag Rules' },
  { to: '/admin/alarms',    icon: '◬', label: 'Alarms' },
  { to: '/admin/analytics', icon: '◈', label: 'Analytics' },
  { to: '/admin/billing',   icon: '◇', label: 'Billing' },
];
 
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
 
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#07111F', fontFamily: "'DM Mono', 'Courier New', monospace", color: '#C8E6F5' }}>
      <aside style={{
        width: collapsed ? 64 : 220,
        background: '#0A1828',
        borderRight: '1px solid #1A3A52',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1A3A52', display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#00B4D8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0, color: '#07111F', fontWeight: 700,
          }}>≋</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: '#E0F4FF' }}>AQUA SYSTEM MONITOR</div>
              <div style={{ fontSize: 10, color: '#4A8FA8', letterSpacing: '0.12em' }}>ADMIN CONSOLE</div>
            </div>
          )}
        </div>
 
        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, marginBottom: 4,
              textDecoration: 'none', fontSize: 13, letterSpacing: '0.04em',
              color: isActive ? '#00D4FF' : '#6BA3BC',
              background: isActive ? 'rgba(0,212,255,0.10)' : 'transparent',
              borderLeft: isActive ? '2px solid #00D4FF' : '2px solid transparent',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            })}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
 
        <button onClick={() => setCollapsed(c => !c)} style={{
          margin: '0 8px 16px', padding: '10px 12px', background: 'rgba(0,180,216,0.06)',
          border: '1px solid #1A3A52', borderRadius: 8, color: '#4A8FA8',
          cursor: 'pointer', fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap',
          fontFamily: 'inherit',
        }}>
          {collapsed ? '→' : '← Collapse'}
        </button>
      </aside>
 
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 56, background: '#0A1828', borderBottom: '1px solid #1A3A52',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF88' }} />
            <span style={{ fontSize: 11, color: '#4A8FA8', letterSpacing: '0.08em' }}>
              SYSTEM ONLINE · {new Date().toUTCString().slice(0, 25)} UTC
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{
              background: 'transparent', border: '1px solid #1A3A52', borderRadius: 6,
              color: '#6BA3BC', padding: '6px 14px', cursor: 'pointer', fontSize: 11,
              letterSpacing: '0.06em', fontFamily: 'inherit',
            }}>← Public Site</button>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#0D2235',
              border: '1px solid #1A3A52', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, color: '#00B4D8', cursor: 'pointer',
            }}>A</div>
          </div>
        </header>
 
        <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}