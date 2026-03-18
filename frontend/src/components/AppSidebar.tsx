import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';

type AppView = 'engine' | 'vault' | 'audit' | 'about' | 'architecture' | 'studio';

interface AppSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  brandCount?: number;
}

// Parijata Mark — small version for sidebar
const MasterSealSmall = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: 28, height: 28, flexShrink: 0 }}>
    {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
      <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.9} transform={`rotate(${angle} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="8" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px rgba(241,112,34,0.6))' }} />
    <circle cx="50" cy="50" r="3" fill="white" opacity="0.8" />
  </svg>
);

const NAV_ITEMS = [
  { key: 'engine' as AppView, icon: '⚡', label: 'Engine', desc: 'Create brand' },
  { key: 'vault' as AppView, icon: '◈', label: 'Vault', desc: 'Brand dashboard' },
  { key: 'architecture' as AppView, icon: '⊹', label: 'Architecture', desc: 'Brand tree' },
  { key: 'studio' as AppView, icon: '◉', label: 'Studio', desc: 'Design production' },
  { key: 'about' as AppView, icon: '◇', label: 'Our Story', desc: 'The Parijata story' },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ currentView, onNavigate, brandCount = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: expanded ? 200 : 64,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div style={{
          height: 72, display: 'flex', alignItems: 'center',
          padding: '0 18px', gap: 12,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <MasterSealSmall />
          {expanded && (
            <span style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text)', whiteSpace: 'nowrap', opacity: expanded ? 1 : 0,
              transition: 'opacity 0.2s ease 0.05s',
            }}>
              HOWICONIC
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ key, icon, label, disabled }: any) => {
            const isActive = currentView === key;
            return (
              <button
                key={key}
                onClick={() => !disabled && onNavigate(key)}
                disabled={disabled}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 18px',
                  background: isActive ? 'rgba(241,112,34,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isActive ? '#f17022' : 'transparent'}`,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  width: '100%', textAlign: 'left',
                  opacity: disabled ? 0.3 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive && !disabled) {
                    e.currentTarget.style.background = 'var(--card-bg)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{
                  fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center',
                  color: isActive ? '#f17022' : 'var(--text-muted)',
                  transition: 'color 0.15s ease',
                }}>
                  {icon}
                </span>
                {expanded && (
                  <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease' }}>
                    <p style={{
                      margin: 0,
                      fontSize: 11, fontWeight: 900, letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: isActive ? '#f17022' : 'var(--text)',
                    }}>
                      {label}
                    </p>
                    {disabled && (
                      <p style={{ margin: 0, fontSize: 8, color: 'var(--text-subtle)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
                        Soon
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* Compare — only if 2+ brands */}
          {brandCount >= 2 && (
            <button
              onClick={() => onNavigate('vault')}
              title="Compare"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px',
                background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                opacity: 0.7, transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center', color: 'var(--text-subtle)' }}>
                ⇆
              </span>
              {expanded && (
                <span style={{
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', whiteSpace: 'nowrap',
                  opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease',
                }}>
                  Compare
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Theme toggle */}
        <div style={{
          padding: '10px 10px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: expanded ? '8px 12px' : '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {expanded && (
              <span style={{ whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease' }}>
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>
        </div>

        {/* Bottom — brand count */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(241,112,34,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, color: '#f17022',
          }}>
            {brandCount}
          </span>
          {expanded && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'var(--text-subtle)', whiteSpace: 'nowrap',
              opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease',
            }}>
              Brands in vault
            </span>
          )}
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 60,
        background: 'var(--mobile-nav-bg)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        zIndex: 100,
      }}
        className="mobile-bottom-nav"
      >
        <style>{`
          @media (max-width: 768px) {
            .mobile-bottom-nav { display: flex !important; }
            .desktop-sidebar { display: none !important; }
          }
        `}</style>
        <div style={{
          display: 'flex', width: '100%',
          alignItems: 'stretch', justifyContent: 'space-around',
        }}>
          {NAV_ITEMS.map(({ key, icon, label, disabled }: any) => {
            const isActive = currentView === key;
            return (
              <button
                key={key}
                onClick={() => !disabled && onNavigate(key)}
                disabled={disabled}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.25 : 1,
                  borderTop: `2px solid ${isActive ? '#f17022' : 'transparent'}`,
                }}
              >
                <span style={{ fontSize: 18, color: isActive ? '#f17022' : 'var(--text-subtle)' }}>
                  {icon}
                </span>
                <span style={{
                  fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: isActive ? '#f17022' : 'var(--text-subtle)',
                }}>
                  {label}
                </span>
              </button>
            );
          })}
          {/* Theme toggle for mobile */}
          <button
            onClick={toggleTheme}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span style={{
              fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-subtle)',
            }}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default AppSidebar;
