import React, { useEffect, useRef } from 'react';

interface LandingPageProps {
  onStartBuilding: () => void;
  onLogin: () => void;
}

// ─── MASTER SEAL (copied from App) ───────────────────────────────────────────
const MasterSeal = ({ className = 'w-10 h-10' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g transform="translate(50, 50)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a} d="M0 0 C-6 -8, -10 -25, 0 -35 C10 -25, 6 -8, 0 0 Z" fill="white" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="6" fill="#f17022" style={{ filter: 'drop-shadow(0 0 12px #f17022)' }} />
    </g>
  </svg>
);

// ─── BADGE ────────────────────────────────────────────────────────────────────
const OnlyBadge = () => (
  <span style={{
    display: 'inline-block',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#f17022',
    border: '1px solid #f17022',
    padding: '2px 8px',
    borderRadius: '2px',
    marginLeft: '12px',
    verticalAlign: 'middle',
  }}>
    Only on HowIconic
  </span>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage: React.FC<LandingPageProps> = ({ onStartBuilding, onLogin }) => {
  const sectionsRef = useRef<NodeListOf<Element> | null>(null);

  // Intersection observer for scroll fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.lp-reveal');
    sectionsRef.current = sections;
    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#0a0a0a', color: '#f5f5f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* CSS for animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700;900&display=swap');

        .lp-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f17022;
          color: #fff;
          border: none;
          padding: 16px 36px;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .lp-btn-primary:hover {
          background: #d9611a;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(241,112,34,0.35);
        }

        .lp-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 14px 32px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.2s ease, border-color 0.2s ease;
        }

        .lp-btn-ghost:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.5);
        }

        .lp-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(241,112,34,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(241,112,34,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .lp-diff-card {
          padding: 40px 32px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          flex: 1;
          min-width: 260px;
          background: rgba(255,255,255,0.02);
          transition: border-color 0.3s ease, transform 0.3s ease;
        }

        .lp-diff-card:hover {
          border-color: rgba(241,112,34,0.3);
          transform: translateY(-4px);
        }

        .lp-pricing-card {
          flex: 1;
          min-width: 260px;
          padding: 40px 32px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          gap: 24px;
          transition: border-color 0.3s ease, transform 0.3s ease;
        }

        .lp-pricing-card:hover {
          transform: translateY(-4px);
        }

        .lp-pricing-card.featured {
          border-color: rgba(241,112,34,0.5);
          background: rgba(241,112,34,0.03);
        }

        .lp-flow-step {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.4);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .lp-flow-arrow {
          color: #f17022;
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .lp-diff-cards {
            flex-direction: column !important;
          }
          .lp-pricing-cards {
            flex-direction: column !important;
          }
          .lp-flow-grid {
            grid-template-columns: 1fr !important;
          }
          .lp-hero-title {
            font-size: clamp(3rem, 12vw, 5rem) !important;
          }
          .lp-nav-links {
            display: none !important;
          }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '20px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MasterSeal className="w-9 h-9" />
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#fff',
          }}>HOWICONIC</span>
        </div>

        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <button
            onClick={onLogin}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.55)', fontSize: 11,
              fontFamily: 'Inter, sans-serif', fontWeight: 700,
              letterSpacing: '0.25em', textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            Log in
          </button>
          <button className="lp-btn-primary" onClick={onStartBuilding} style={{ padding: '10px 24px', fontSize: 11 }}>
            Start building →
          </button>
        </div>

        {/* Mobile log in */}
        <button
          className="lp-btn-ghost"
          onClick={onLogin}
          style={{ padding: '8px 20px', fontSize: 10, display: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
        >
          Log in
        </button>
        <style>{`
          @media (max-width: 768px) {
            .lp-nav-links { display: none !important; }
            .lp-mobile-login { display: inline-flex !important; }
          }
        `}</style>
        <button
          className="lp-mobile-login lp-btn-ghost"
          onClick={onLogin}
          style={{ padding: '8px 20px', fontSize: 10, display: 'none' }}
        >
          Log in
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '160px 48px 120px',
        overflow: 'hidden',
      }}>
        <div className="lp-grid-bg" />
        {/* Bloom */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(241,112,34,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 900 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.5em', textTransform: 'uppercase',
            color: '#f17022', marginBottom: 32, opacity: 0.8,
          }}>
            AI Brand Identity Engine
          </p>

          <h1
            className="lp-hero-title"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 900,
              fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#fff',
              marginBottom: 28,
            }}
          >
            Your brand,<br />engineered.
          </h1>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 18,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 56,
            letterSpacing: '0.02em',
          }}>
            Strategy. Name. Identity. One click.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lp-btn-primary" onClick={onStartBuilding}>
              Start building →
            </button>
            <button className="lp-btn-ghost" onClick={onLogin}>
              Log in
            </button>
          </div>

          <p style={{
            marginTop: 48, fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.15)', fontWeight: 700,
          }}>
            Strategy · Naming · Visual System · Brand Manual
          </p>
        </div>
      </section>

      {/* ── DIFFERENTIATORS ── */}
      <section className="lp-reveal" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 64,
          }}>
            What makes HowIconic different
          </p>

          <div className="lp-diff-cards" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Card 1 */}
            <div className="lp-diff-card">
              <div style={{ fontSize: 36, marginBottom: 20 }}>🧠</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, flexWrap: 'wrap' }}>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif', fontWeight: 900,
                  fontSize: 20, color: '#fff', textTransform: 'uppercase',
                }}>Strategy Engine</h3>
                <OnlyBadge />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)' }}>
                Not just a logo — archetype, positioning, tensions, brand promise. Built from what your brand actually believes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="lp-diff-card">
              <div style={{ fontSize: 36, marginBottom: 20 }}>📛</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, flexWrap: 'wrap' }}>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif', fontWeight: 900,
                  fontSize: 20, color: '#fff', textTransform: 'uppercase',
                }}>Coined Names</h3>
                <OnlyBadge />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)' }}>
                Invented words like Spotify &amp; Kodak. Not dictionary words. Names that own their space and have nowhere else to live.
              </p>
            </div>

            {/* Card 3 */}
            <div className="lp-diff-card">
              <div style={{ fontSize: 36, marginBottom: 20 }}>🌐</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, flexWrap: 'wrap' }}>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif', fontWeight: 900,
                  fontSize: 20, color: '#fff', textTransform: 'uppercase',
                }}>Domain Check</h3>
                <OnlyBadge />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)' }}>
                Every name checked for .com availability before you see it. No heartbreak after falling in love with a name.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-reveal" style={{ padding: '100px 48px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 16,
          }}>
            How it works
          </p>
          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: '#fff', marginBottom: 64, lineHeight: 1.1,
          }}>
            You type 4 lines.<br />
            <span style={{ color: '#f17022' }}>We build your brand.</span>
          </h2>

          <div className="lp-flow-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 48,
            alignItems: 'start',
          }}>
            {/* Input */}
            <div style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 24 }}>You provide</p>
              {[
                ['Brand idea', 'What this brand believes'],
                ['Product', 'What it sells'],
                ['Audience', 'Who it\'s for'],
                ['Vibe', 'How it feels'],
              ].map(([label, desc]) => (
                <div key={label} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f17022' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 12 }}>
                    {desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 60 }}>
              <div style={{ width: 1, height: 40, background: 'rgba(241,112,34,0.3)' }} />
              <span style={{ color: '#f17022', fontSize: 24 }}>→</span>
              <div style={{ width: 1, height: 40, background: 'rgba(241,112,34,0.3)' }} />
            </div>

            {/* Output */}
            <div style={{ padding: '32px', border: '1px solid rgba(241,112,34,0.2)', borderRadius: 4, background: 'rgba(241,112,34,0.02)' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 24 }}>We build</p>
              {[
                ['Strategy', 'Archetype · Positioning · Tensions · Promise'],
                ['Naming', 'Coined name · .com verified · Origin story'],
                ['Visual System', 'Logo · Colors · Typography'],
                ['Brand Manual', 'Voice · Story · Guidelines'],
              ].map(([label, desc]) => (
                <div key={label} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff' }}>
                    {label}
                  </span>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-reveal" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: 10, letterSpacing: '0.6em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 16,
          }}>
            Pricing
          </p>
          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: '#fff', marginBottom: 64, textAlign: 'center',
          }}>
            Start free. Build iconic.
          </h2>

          <div className="lp-pricing-cards" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

            {/* Explorer */}
            <div className="lp-pricing-card">
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Explorer</p>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Free</p>
              </div>
              <div style={{ flex: 1 }}>
                {['3 brand previews', 'Strategy + Naming', 'Brand Card export'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#f17022', fontSize: 11 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="lp-btn-ghost" onClick={onStartBuilding} style={{ width: '100%', justifyContent: 'center' }}>
                Get started free
              </button>
            </div>

            {/* Creator */}
            <div className="lp-pricing-card featured">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: '#f17022' }}>Creator</p>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f17022', color: '#fff', padding: '2px 8px', borderRadius: 2 }}>Most Popular</span>
                </div>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>₹2,999</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>One-time · 1 full brand</p>
              </div>
              <div style={{ flex: 1 }}>
                {['Everything in Explorer', 'Full logo system', 'Brand mockups', 'PDF brand manual', '.com domain report'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#f17022', fontSize: 11 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20to%20unlock%20HowIconic%20Creator%20(%E2%82%B92%2C999)%20for%20my%20brand%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn-primary"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                Get Started →
              </a>
            </div>

            {/* Studio */}
            <div className="lp-pricing-card">
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Studio</p>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>₹7,499</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>per month · 10–15 brands</p>
              </div>
              <div style={{ flex: 1 }}>
                {['Everything in Creator', '10–15 brands / month', 'Brand comparison tool', 'Priority support', 'Yearly: ₹59,999 (save 33%)'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#f17022', fontSize: 11 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20the%20HowIconic%20Studio%20plan%20(%E2%82%B97%2C499%2Fmo)."
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn-ghost"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                Subscribe →
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-reveal" style={{ padding: '100px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="lp-grid-bg" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900,
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#fff', marginBottom: 20, lineHeight: 1.1,
          }}>
            Ready to build something iconic?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 48 }}>
            4 lines in. A complete brand out.
          </p>
          <button className="lp-btn-primary" onClick={onStartBuilding} style={{ fontSize: 14, padding: '18px 48px' }}>
            Start building →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '40px 48px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MasterSeal className="w-6 h-6" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Built by HowIconic
          </span>
        </div>
        <a
          href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20to%20discuss%20brand%20consulting%20with%20HowIconic."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12, color: '#f17022', fontWeight: 700,
            letterSpacing: '0.1em', textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Need consulting? Talk to us →
        </a>
      </footer>

    </div>
  );
};

export default LandingPage;
