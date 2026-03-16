import React, { useState } from 'react';

type AppView = 'engine' | 'vault' | 'audit' | 'about';

interface AppSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  brandCount?: number;
}

const MasterSealSmall = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: 28, height: 28, flexShrink: 0 }}>
    <g transform="translate(50, 50)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a} d="M0 0 C-6 -8, -10 -25, 0 -35 C10 -25, 6 -8, 0 0 Z" fill="white" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="6" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px #f17022)' }} />
    </g>
  </svg>
);

const NAV_ITEMS = [
  { key: 'engine' as AppView, icon: '⚡', label: 'Engine', desc: 'Create brand' },
  { key: 'vault' as AppView, icon: '◈', label: 'Vault', desc: 'Brand dashboard' },
  { key: 'audit' as AppView, icon: '◉', label: 'Studio', desc: 'Coming soon', disabled: true },
  { key: 'about' as AppView, icon: '◇', label: 'Manifesto', desc: 'Our philosophy' },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ currentView, onNavigate, brandCount = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: expanded ? 200 : 64,
          background: '#0a0a0a',
          borderRight: '1px solid rgba(255,255,255,0.06)',
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
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}>
          <MasterSealSmall />
          {expanded && (
            <span style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#fff', whiteSpace: 'nowrap', opacity: expanded ? 1 : 0,
              transition: 'opacity 0.2s ease 0.05s',
            }}>
              HOWICONIC
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ key, icon, label, disabled }) => {
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
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{
                  fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center',
                  color: isActive ? '#f17022' : 'rgba(255,255,255,0.5)',
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
                      color: isActive ? '#f17022' : 'rgba(255,255,255,0.7)',
                    }}>
                      {label}
                    </p>
                    {disabled && (
                      <p style={{ margin: 0, fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
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
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                ⇆
              </span>
              {expanded && (
                <span style={{
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap',
                  opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease',
                }}>
                  Compare
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Bottom — brand count */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
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
              color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap',
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
        background: 'rgba(10,10,10,0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
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
          {NAV_ITEMS.map(({ key, icon, label, disabled }) => {
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
                <span style={{ fontSize: 18, color: isActive ? '#f17022' : 'rgba(255,255,255,0.4)' }}>
                  {icon}
                </span>
                <span style={{
                  fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: isActive ? '#f17022' : 'rgba(255,255,255,0.3)',
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default AppSidebar;
