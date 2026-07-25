import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/foods', label: 'Food Composition' },
  { to: '/seasonal', label: 'Seasonal Matrix' },
  { to: '/voice', label: 'Voice Studio' },
  { to: '/clinical', label: 'Clinical Rules' },
  { to: '/export', label: 'DHIMS2 Export' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav
        style={{
          width: 220,
          background: '#08283B',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px 24px', color: '#fff', fontWeight: 700, fontSize: 18 }}>
          NurtureLink Admin
        </div>
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'block',
              padding: '12px 20px',
              color: isActive ? '#fff' : '#92C9F9',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 32, background: '#f5f5f5' }}>{children}</main>
    </div>
  );
}
