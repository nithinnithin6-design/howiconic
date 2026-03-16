import React, { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
  onStartBuilding: () => void;
  onLogin: () => void;
}

// ─── MASTER SEAL (animated) ───────────────────────────────────────────────────
const MasterSeal = ({ className = 'w-10 h-10', animate = false }: { className?: string; animate?: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={animate ? {
      animation: 'sealEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      opacity: 0,
    } : undefined}
  >
    <g transform="translate(50, 50)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a} d="M0 0 C-6 -8, -10 -25, 0 -35 C10 -25, 6 -8, 0 0 Z" fill="white" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="6" fill="#f17022" style={{ filter: 'drop-shadow(0 0 12px #f17022)' }} />
    </g>
  </svg>
);

// ─── BRAND CONSTRUCTION ANIMATION SVG ────────────────────────────────────────
const BrandConstructionAnim = () => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 200, height: 200, opacity: 0.18 }}
  >
    <style>{`
      @keyframes construct1 { 0%,100% { opacity:0.1; transform: scale(0.8) rotate(0deg); } 50% { opacity:1; transform: scale(1.05) rotate(45deg); } }
      @keyframes construct2 { 0%,100% { opacity:0.3; transform: scale(1) rotate(0deg); } 50% { opacity:0.7; transform: scale(0.9) rotate(-30deg); } }
      @keyframes construct3 { 0%,100% { stroke-dashoffset: 300; opacity: 0.2; } 60% { stroke-dashoffset: 0; opacity: 0.8; } }
      @keyframes construct4 { 0% { opacity:0; } 40% { opacity:1; } 80% { opacity:0; } 100% { opacity:0; } }
      .c1 { animation: construct1 6s ease-in-out infinite; transform-origin: 100px 100px; }
      .c2 { animation: construct2 6s ease-in-out infinite 1.5s; transform-origin: 100px 100px; }
      .c3 { animation: construct3 6s ease-in-out infinite 0.5s; stroke-dasharray: 300; }
      .c4 { animation: construct4 6s ease-in-out infinite 2s; }
    `}</style>
    <rect className="c1" x="70" y="70" width="60" height="60" stroke="white" strokeWidth="0.8" />
    <circle className="c2" cx="100" cy="100" r="40" stroke="#f17022" strokeWidth="0.6" />
    <path className="c3" d="M100 60 L140 100 L100 140 L60 100 Z" stroke="white" strokeWidth="0.8" />
    <g className="c4">
      {[0, 60, 120, 180, 240, 300].map(a => (
        <line
          key={a}
          x1="100" y1="100"
          x2={100 + 38 * Math.cos((a * Math.PI) / 180)}
          y2={100 + 38 * Math.sin((a * Math.PI) / 180)}
          stroke="#f17022" strokeWidth="0.5" opacity="0.6"
        />
      ))}
    </g>
    <circle cx="100" cy="100" r="4" fill="#f17022" opacity="0.8" />
  </svg>
);

// ─── STEP ILLUSTRATION ────────────────────────────────────────────────────────
const StepIllustration1 = () => (
  <svg viewBox="0 0 64 64" fill="none" style={{ width: 48, height: 48 }}>
    <rect x="8" y="16" width="48" height="8" rx="1" stroke="white" strokeWidth="1" opacity="0.4" />
    <rect x="8" y="28" width="32" height="8" rx="1" stroke="white" strokeWidth="1" opacity="0.3" />
    <rect x="8" y="40" width="40" height="8" rx="1" stroke="white" strokeWidth="1" opacity="0.2" />
    <circle cx="52" cy="12" r="5" fill="#f17022" opacity="0.7" />
    <path d="M49 12 L51 14 L55 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const StepIllustration2 = () => (
  <svg viewBox="0 0 64 64" fill="none" style={{ width: 48, height: 48 }}>
    <circle cx="32" cy="32" r="20" stroke="white" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" />
    <circle cx="32" cy="32" r="12" stroke="#f17022" strokeWidth="0.8" opacity="0.6" />
    {[0, 72, 144, 216, 288].map(a => (
      <line
        key={a}
        x1="32" y1="32"
        x2={32 + 20 * Math.cos((a * Math.PI) / 180)}
        y2={32 + 20 * Math.sin((a * Math.PI) / 180)}
        stroke="white" strokeWidth="0.5" opacity="0.25"
      />
    ))}
    <circle cx="32" cy="32" r="3" fill="#f17022" />
  </svg>
);

const StepIllustration3 = () => (
  <svg viewBox="0 0 64 64" fill="none" style={{ width: 48, height: 48 }}>
    <rect x="12" y="12" width="40" height="40" rx="2" stroke="white" strokeWidth="0.8" opacity="0.3" />
    <rect x="16" y="16" width="14" height="14" rx="1" fill="#f17022" opacity="0.5" />
    <rect x="34" y="16" width="14" height="14" rx="1" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <rect x="16" y="34" width="14" height="14" rx="1" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <rect x="34" y="34" width="14" height="14" rx="1" stroke="#f17022" strokeWidth="0.6" opacity="0.4" />
  </svg>
);

// ─── SCROLL REVEAL HOOK ────────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ─── REVEAL WRAPPER ────────────────────────────────────────────────────────────
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─── FACT STRIP ────────────────────────────────────────────────────────────────
const FactStrip: React.FC<{ fact: string }> = ({ fact }) => {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '16px 48px',
        textAlign: 'center',
        opacity: visible ? 0.45 : 0,
        transition: 'opacity 0.8s ease',
        overflow: 'hidden',
      }}
    >
      <p style={{
        fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.7)', fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
      }}>
        {fact}
      </p>
    </div>
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
const OnlyBadge = () => (
  <span style={{
    display: 'inline-block', fontSize: '9px', fontWeight: 700,
    letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f17022',
    border: '1px solid rgba(241,112,34,0.5)', padding: '2px 8px',
    borderRadius: 2, marginLeft: 10, verticalAlign: 'middle',
  }}>
    Only on HowIconic
  </span>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage: React.FC<LandingPageProps> = ({ onStartBuilding, onLogin }) => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      background: '#0a0a0a', color: '#f5f5f5', minHeight: '100vh',
      fontFamily: 'Inter, sans-serif', overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700;900&display=swap');

        @keyframes sealEntrance {
          from { opacity: 0; transform: rotate(-15deg) scale(0.7); }
          to { opacity: 1; transform: rotate(0deg) scale(1); }
        }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lp-hero-animate { animation: heroFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #f17022; color: #fff; border: none;
          padding: 16px 36px; font-family: Inter, sans-serif;
          font-size: 13px; font-weight: 900; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; border-radius: 4px;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-btn-primary:hover {
          background: #d9611a; transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(241,112,34,0.35);
        }
        .lp-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 14px 32px; font-family: Inter, sans-serif;
          font-size: 12px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer; border-radius: 4px;
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .lp-btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.5); }

        .lp-diff-card {
          padding: 36px 28px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px; flex: 1; min-width: 260px;
          background: rgba(255,255,255,0.02);
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }
        .lp-diff-card:hover {
          border-color: rgba(241,112,34,0.25);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        .case-card {
          flex: 1; min-width: 200px; max-width: 280px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px; overflow: hidden;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .case-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); }

        .how-step {
          display: flex; flex-direction: column; gap: 16; flex: 1; min-width: 200px;
          padding: 32px 24px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px;
          transition: border-color 0.3s ease;
        }
        .how-step:hover { border-color: rgba(241,112,34,0.2); }

        .lp-pricing-card {
          flex: 1; min-width: 240px;
          padding: 36px 28px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          display: flex; flex-direction: column; gap: 20;
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        .lp-pricing-card:hover { transform: translateY(-4px); }
        .lp-pricing-card.featured { border-color: rgba(241,112,34,0.4); background: rgba(241,112,34,0.02); }

        @media (max-width: 768px) {
          .lp-nav-links { display: none !important; }
          .lp-mobile-login { display: inline-flex !important; }
          .lp-diff-cards, .lp-how-steps, .lp-case-cards, .lp-pricing-cards { flex-direction: column !important; }
          .lp-hero-title { font-size: clamp(2.8rem, 11vw, 4rem) !important; }
          section { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '18px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <MasterSeal className="w-8 h-8" animate={true} />
          <span style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900,
            fontSize: 17, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff',
          }}>HOWICONIC</span>
        </div>

        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[['How It Works', '#how'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={label} href={href} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)', fontSize: 10,
              fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
            >{label}</a>
          ))}
          <button onClick={onLogin} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >Log in</button>
          <button className="lp-btn-primary" onClick={onStartBuilding} style={{ padding: '9px 22px', fontSize: 10 }}>
            Start building →
          </button>
        </div>

        <button className="lp-mobile-login lp-btn-ghost" onClick={onLogin} style={{ padding: '8px 18px', fontSize: 10, display: 'none' }}>
          Log in
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '160px 48px 120px', overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(241,112,34,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(241,112,34,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        {/* Bloom */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(241,112,34,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Brand construction animation — floating top right */}
        <div style={{
          position: 'absolute', top: 120, right: '8%',
          opacity: 0.6,
        }}>
          <BrandConstructionAnim />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          {/* Overline */}
          <p
            className="lp-hero-animate"
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.6em', textTransform: 'uppercase',
              color: '#f17022', marginBottom: 28, animationDelay: '0.1s',
            }}
          >
            AI Brand Identity Engine
          </p>

          {/* Main heading */}
          <h1
            className="lp-hero-title lp-hero-animate"
            style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 'clamp(3.5rem, 9vw, 6.5rem)',
              lineHeight: 1.02, letterSpacing: '-0.02em', color: '#fff',
              marginBottom: 28, animationDelay: '0.25s',
            }}
          >
            Your brand,<br />
            <span style={{ color: '#f17022', fontStyle: 'italic' }}>engineered.</span>
          </h1>

          <p
            className="lp-hero-animate"
            style={{
              fontSize: 18, color: 'rgba(255,255,255,0.4)',
              marginBottom: 52, letterSpacing: '0.02em',
              fontFamily: 'Inter, sans-serif',
              animationDelay: '0.4s',
            }}
          >
            Strategy. Name. Identity. One click.
          </p>

          <div
            className="lp-hero-animate"
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.55s' }}
          >
            <button className="lp-btn-primary" onClick={onStartBuilding}>
              Start building →
            </button>
            <button className="lp-btn-ghost" onClick={onLogin}>
              Log in
            </button>
          </div>

          <p
            className="lp-hero-animate"
            style={{
              marginTop: 52, fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.15)', fontWeight: 700,
              animationDelay: '0.7s',
            }}
          >
            Strategy · Naming · Visual System · Brand Manual
          </p>
        </div>
      </section>

      {/* ── FACT STRIP 1 ── */}
      <FactStrip fact='Brand value of the top 100 global brands: $3.5 trillion — built on identity, not just product.' />

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '100px 48px', background: 'rgba(255,255,255,0.012)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <p style={{
              fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 14,
            }}>
              How it works
            </p>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#fff', marginBottom: 64, lineHeight: 1.1,
            }}>
              Three steps to<br />
              <span style={{ color: '#f17022' }}>brand sovereignty.</span>
            </h2>
          </Reveal>

          <div className="lp-how-steps" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              {
                step: '01',
                title: 'Describe your vision',
                desc: 'Tell us what this brand believes, what it sells, who it serves, and how it feels. 4 fields. 2 minutes.',
                Icon: StepIllustration1,
                delay: 0,
              },
              {
                step: '02',
                title: 'AI architects your brand',
                desc: 'Our 5-step pipeline runs — strategy, naming, domain check, visual system, brand assembly. No templates.',
                Icon: StepIllustration2,
                delay: 150,
              },
              {
                step: '03',
                title: 'Own a complete brand system',
                desc: 'Strategy, coined name, color palette, typography, logo, voice guidelines — a brand manual you actually own.',
                Icon: StepIllustration3,
                delay: 300,
              },
            ].map(({ step, title, desc, Icon, delay }) => (
              <Reveal key={step} delay={delay} className="how-step" style={{ flex: 1, minWidth: 200 }}>
                <div className="how-step">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.5em',
                      textTransform: 'uppercase', color: '#f17022',
                    }}>
                      {step}
                    </span>
                    <Icon />
                  </div>
                  <h3 style={{
                    fontFamily: 'Playfair Display, serif', fontWeight: 900,
                    fontSize: 20, color: '#fff', textTransform: 'uppercase', marginBottom: 12,
                  }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)' }}>
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACT STRIP 2 ── */}
      <FactStrip fact='85% of purchasing decisions are influenced by color. Every shade in your system is chosen with purpose.' />

      {/* ── DIFFERENTIATORS ── */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <p style={{
              textAlign: 'center', fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 64,
            }}>
              What makes HowIconic different
            </p>
          </Reveal>

          <div className="lp-diff-cards" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              {
                icon: '🧠',
                title: 'Strategy Engine',
                badge: true,
                before: 'Others: generate a logo.',
                after: 'HowIconic: architect your brand.',
                desc: 'Archetype, positioning, brand tensions, competitive whitespace — built from what your brand actually believes.',
                delay: 0,
              },
              {
                icon: '📛',
                title: 'Coined Names',
                badge: true,
                before: 'Others: suggest existing words.',
                after: 'HowIconic: invent your word.',
                desc: 'Invented names like Spotify and Kodak. Names with nowhere else to live — legally clean, culturally ownable.',
                delay: 100,
              },
              {
                icon: '🌐',
                title: 'Domain Check',
                badge: true,
                before: 'Others: give you a name.',
                after: 'HowIconic: verify it first.',
                desc: 'Every name is .com-checked before you see it. No heartbreak after falling in love with something taken.',
                delay: 200,
              },
            ].map(({ icon, title, badge, before, after, desc, delay }) => (
              <Reveal key={title} delay={delay}>
                <div className="lp-diff-card">
                  <div style={{ fontSize: 32, marginBottom: 18 }}>{icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                    <h3 style={{
                      fontFamily: 'Playfair Display, serif', fontWeight: 900,
                      fontSize: 19, color: '#fff', textTransform: 'uppercase', margin: 0,
                    }}>{title}</h3>
                    {badge && <OnlyBadge />}
                  </div>

                  {/* Before/after comparison */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 2, padding: '12px 14px', marginBottom: 14,
                  }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                      <span style={{ opacity: 0.5 }}>✕ </span>{before}
                    </p>
                    <p style={{ fontSize: 11, color: '#f17022', margin: 0, lineHeight: 1.5, fontWeight: 700 }}>
                      <span>✓ </span>{after}
                    </p>
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.4)' }}>
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACT STRIP 3 ── */}
      <FactStrip fact='Coined brand names are legally stronger — they own every category because they mean nothing else.' />

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: '100px 48px', background: 'rgba(255,255,255,0.012)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <p style={{
              fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 12,
            }}>
              Built with craft
            </p>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', marginBottom: 16, lineHeight: 1.1,
            }}>
              Built by designers who've<br />built real brands.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginBottom: 56 }}>
              <span data-placeholder="true" style={{ color: '#f17022', fontWeight: 700 }}>10,000+</span> brands engineered.
            </p>
          </Reveal>

          {/* Case study placeholders */}
          <div className="lp-case-cards" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { primary: '#2563eb', secondary: '#1e40af', canvas: '#060a14', label: 'Tech · SaaS' },
              { primary: '#f17022', secondary: '#7c3aed', canvas: '#0a080e', label: 'D2C · Fashion' },
              { primary: '#22c55e', secondary: '#15803d', canvas: '#060d06', label: 'Wellness · Food' },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="case-card">
                  {/* Color preview */}
                  <div style={{
                    height: 100, background: card.canvas,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '0 20px',
                  }}>
                    {[card.primary, card.secondary, card.canvas + 'aa'].map((c, ci) => (
                      <div key={ci} style={{
                        flex: ci === 0 ? 2 : 1,
                        height: 40, borderRadius: 2,
                        background: c,
                        opacity: 0.85,
                      }} />
                    ))}
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.4em',
                      textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                      marginBottom: 6,
                    }}>{card.label}</p>
                    <p style={{
                      fontFamily: 'Playfair Display, serif', fontWeight: 700,
                      fontSize: 15, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
                    }}>Case study coming soon</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <p style={{
              textAlign: 'center', fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 14,
            }}>
              Pricing
            </p>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', marginBottom: 64, textAlign: 'center',
            }}>
              Start free. Build iconic.
            </h2>
          </Reveal>

          <div className="lp-pricing-cards" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Explorer */}
            <Reveal delay={0}>
              <div className="lp-pricing-card">
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Explorer</p>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, margin: 0 }}>Free</p>
                </div>
                <div style={{ flex: 1 }}>
                  {['3 brand previews', 'Strategy + Naming', 'Brand Card export'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#f17022', fontSize: 11 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="lp-btn-ghost" onClick={onStartBuilding} style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                  Get started free
                </button>
              </div>
            </Reveal>

            {/* Creator */}
            <Reveal delay={120}>
              <div className="lp-pricing-card featured">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: '#f17022', margin: 0 }}>Creator</p>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f17022', color: '#fff', padding: '2px 8px', borderRadius: 2 }}>Most Popular</span>
                  </div>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, margin: 0 }}>₹2,999</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>One-time · 1 full brand</p>
                </div>
                <div style={{ flex: 1 }}>
                  {['Everything in Explorer', 'Full logo system', 'Brand mockups', 'PDF brand manual', '.com domain report'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#f17022', fontSize: 11 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20to%20unlock%20HowIconic%20Creator%20(%E2%82%B92%2C999)%20for%20my%20brand%20project."
                  target="_blank" rel="noopener noreferrer"
                  className="lp-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                >
                  Get Started →
                </a>
              </div>
            </Reveal>

            {/* Studio */}
            <Reveal delay={240}>
              <div className="lp-pricing-card">
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Studio</p>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, margin: 0 }}>₹7,499</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>per month · 10–15 brands</p>
                </div>
                <div style={{ flex: 1 }}>
                  {['Everything in Creator', '10–15 brands / month', 'Brand comparison tool', 'Priority support', 'Yearly: ₹59,999 (save 33%)'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#f17022', fontSize: 11 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20the%20HowIconic%20Studio%20plan%20(%E2%82%B97%2C499%2Fmo)."
                  target="_blank" rel="noopener noreferrer"
                  className="lp-btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                >
                  Subscribe →
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '100px 48px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'rgba(241,112,34,0.02)',
        borderTop: '1px solid rgba(241,112,34,0.06)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(241,112,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(241,112,34,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900,
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#fff', marginBottom: 20, lineHeight: 1.05,
            }}>
              Ready to build something<br />
              <span style={{ color: '#f17022', fontStyle: 'italic' }}>iconic?</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 48 }}>
              4 lines in. A complete brand out.
            </p>
            <button className="lp-btn-primary" onClick={onStartBuilding} style={{ fontSize: 14, padding: '18px 48px' }}>
              Start building →
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '48px 48px 40px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#080808',
      }}>
        {/* Links row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, flexWrap: 'wrap', marginBottom: 36,
        }}>
          {[
            { label: 'About', href: '#' },
            { label: 'How It Works', href: '#how' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Contact', href: 'https://wa.me/919486183626' },
            { label: 'Privacy Policy', href: '#' },
          ].map(({ label, href }) => (
            <a key={label} href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)',
                fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
            >{label}</a>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '0 0 28px' }} />

        {/* Bottom row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MasterSeal className="w-6 h-6" />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              HowIconic
            </span>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
            Built with 🔥 in India
          </p>

          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>
            © 2026 HowIconic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
