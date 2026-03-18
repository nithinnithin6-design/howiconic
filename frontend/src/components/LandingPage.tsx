import React, { useEffect, useRef, useState } from 'react';
import KeeAlive from './KeeAlive';
import { TextReveal, Reveal as AnimReveal, Stagger } from '../animations';
import { useTheme } from '../ThemeContext';

interface LandingPageProps {
  onStartBuilding: () => void;
  onLogin: () => void;
}

// ─── MASTER SEAL (8-petal flower with orange center) ─────────────────────────
// ─── THE PARIJATA MARK ────────────────────────────────────────────────────────
// Stylized Parijata flower — 7 geometric white petals, orange center (the fire)
const ParijataMark = ({ className = 'w-10 h-10', animate = false }: { className?: string; animate?: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={animate ? {
      animation: 'bloomIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      opacity: 0,
    } : undefined}
  >
    {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
      <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.9} transform={`rotate(${angle} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="8" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px rgba(241,112,34,0.6))' }} />
    <circle cx="50" cy="50" r="3" fill="white" opacity="0.8" />
  </svg>
);

// ─── GUIDE TEXT ───────────────────────────────────────────────────────────────
// The guide: no name, just a presence. Quiet, generous, like the Parijata itself.
const GuideText = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderLeft: '2px solid rgba(241,112,34,0.3)', paddingLeft: 16, margin: '24px auto', maxWidth: 600 }}>
    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
      {children}
    </p>
  </div>
);

// ─── KEE PRESENCE ─────────────────────────────────────────────────────────────
const KeePresence = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: 'var(--kee-bg)',
    borderLeft: '3px solid #f17022',
    borderRadius: '0 12px 12px 0',
    padding: '14px 18px 16px',
    margin: '20px auto', maxWidth: 520,
  }}>
    <p style={{
      fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
      color: '#f17022', margin: '0 0 6px',
    }}>Kee</p>
    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
      {children}
    </p>
  </div>
);

// Keep backward compat alias
const MasterSeal = ParijataMark;

// ─── BRAND CONSTRUCTION SVG (Hero — letters forming, colors crystallizing) ───
const BrandConstruction = () => (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
    <style>{`
      @keyframes drawLetterH {
        0%   { stroke-dashoffset: 220; opacity: 0; }
        8%   { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      @keyframes drawLetterI {
        0%   { stroke-dashoffset: 160; opacity: 0; }
        10%  { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      @keyframes swatchPop {
        0%   { opacity: 0; transform: scale(0) rotate(-15deg); }
        70%  { transform: scale(1.1) rotate(3deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }
      @keyframes markCrystallize {
        0%   { opacity: 0; transform: scale(0.2) rotate(-45deg); }
        60%  { transform: scale(1.15) rotate(5deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }
      @keyframes constructRing {
        from { stroke-dashoffset: 820; opacity: 0; }
        10%  { opacity: 0.1; }
        100% { stroke-dashoffset: 0; opacity: 0.1; }
      }
      @keyframes constructRing2 {
        from { stroke-dashoffset: 1040; opacity: 0; }
        10%  { opacity: 0.06; }
        100% { stroke-dashoffset: 0; opacity: 0.06; }
      }
      @keyframes glowBreath {
        0%, 100% { opacity: 0.06; transform: scale(1); }
        50%       { opacity: 0.14; transform: scale(1.08); }
      }
      .bc-ring1 { stroke-dasharray: 820; animation: constructRing 3s ease 0.1s forwards; opacity: 0; }
      .bc-ring2 { stroke-dasharray: 1040; animation: constructRing2 4s ease 0.4s forwards; opacity: 0; }
      .bc-h     { stroke-dasharray: 220; animation: drawLetterH 2.2s cubic-bezier(0.4,0,0.2,1) 0.6s forwards; opacity: 0; }
      .bc-i     { stroke-dasharray: 160; animation: drawLetterI 1.6s cubic-bezier(0.4,0,0.2,1) 1.8s forwards; opacity: 0; }
      .bc-s1    { transform-origin: 118px 298px; animation: swatchPop 0.7s cubic-bezier(0.16,1,0.3,1) 2.8s forwards; opacity: 0; }
      .bc-s2    { transform-origin: 158px 298px; animation: swatchPop 0.7s cubic-bezier(0.16,1,0.3,1) 3.0s forwards; opacity: 0; }
      .bc-s3    { transform-origin: 198px 298px; animation: swatchPop 0.7s cubic-bezier(0.16,1,0.3,1) 3.2s forwards; opacity: 0; }
      .bc-s4    { transform-origin: 238px 298px; animation: swatchPop 0.7s cubic-bezier(0.16,1,0.3,1) 3.4s forwards; opacity: 0; }
      .bc-mark  { transform-origin: 200px 200px; animation: markCrystallize 1.4s cubic-bezier(0.16,1,0.3,1) 3.6s forwards; opacity: 0; }
      .bc-glow  { transform-origin: 200px 200px; animation: glowBreath 8s ease-in-out 4s infinite; opacity: 0; }
    `}</style>

    {/* Outer glow */}
    <circle className="bc-glow" cx="200" cy="200" r="100"
      stroke="rgba(241,112,34,0.12)" strokeWidth="50" fill="none" />

    {/* Construction rings */}
    <circle className="bc-ring1" cx="200" cy="200" r="130"
      stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeDasharray="3 8" fill="none" />
    <circle className="bc-ring2" cx="200" cy="200" r="165"
      stroke="rgba(241,112,34,0.07)" strokeWidth="0.5" strokeDasharray="2 14" fill="none" />

    {/* Letter H — drawn by path */}
    <path className="bc-h"
      d="M128 148 L128 228 M128 188 L172 188 M172 148 L172 228"
      stroke="rgba(255,255,255,0.32)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      fill="none" />

    {/* Letter I — drawn by path */}
    <path className="bc-i"
      d="M200 148 L200 228 M188 148 L212 148 M188 228 L212 228"
      stroke="rgba(255,255,255,0.32)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      fill="none" />

    {/* Color swatches */}
    <g className="bc-s1">
      <rect x="106" y="284" width="24" height="28" rx="3" fill="#f17022" opacity="0.85" />
    </g>
    <g className="bc-s2">
      <rect x="146" y="284" width="24" height="28" rx="3" fill="rgba(255,255,255,0.22)" />
    </g>
    <g className="bc-s3">
      <rect x="186" y="284" width="24" height="28" rx="3" fill="#6366f1" opacity="0.7" />
    </g>
    <g className="bc-s4">
      <rect x="226" y="284" width="24" height="28" rx="3" fill="#10b981" opacity="0.6" />
    </g>

    {/* Swatch label lines */}
    {[118, 158, 198, 238].map(x => (
      <line key={x} x1={x} y1="315" x2={x} y2="324"
        stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
    ))}

    {/* Brand mark crystallizing at center */}
    <g className="bc-mark" transform="translate(200, 200)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a} d="M0 0 C-3 -4, -5 -13, 0 -19 C5 -13, 3 -4, 0 0 Z"
          fill="rgba(255,255,255,0.18)" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="5" fill="#f17022"
        style={{ filter: 'drop-shadow(0 0 10px rgba(241,112,34,0.95))' }} />
    </g>
  </svg>
);

// ─── HERO PARTICLES (pure CSS, drifting upward) ───────────────────────────────
// Hardcoded to avoid re-render jitter
const PARTICLES = [
  { left: 7,  bottom: 5,  dur: 18, delay: 0,   size: 1, op: 0.10 },
  { left: 13, bottom: 20, dur: 14, delay: 3,   size: 2, op: 0.07 },
  { left: 22, bottom: 10, dur: 20, delay: 1.5, size: 1, op: 0.09 },
  { left: 31, bottom: 35, dur: 16, delay: 5,   size: 1, op: 0.06 },
  { left: 38, bottom: 8,  dur: 22, delay: 2,   size: 2, op: 0.08 },
  { left: 45, bottom: 50, dur: 13, delay: 7,   size: 1, op: 0.07 },
  { left: 52, bottom: 15, dur: 19, delay: 0.5, size: 1, op: 0.10 },
  { left: 58, bottom: 42, dur: 17, delay: 4,   size: 2, op: 0.06 },
  { left: 65, bottom: 25, dur: 21, delay: 2.5, size: 1, op: 0.08 },
  { left: 71, bottom: 60, dur: 15, delay: 6,   size: 1, op: 0.07 },
  { left: 77, bottom: 18, dur: 18, delay: 1,   size: 2, op: 0.09 },
  { left: 83, bottom: 45, dur: 12, delay: 3.5, size: 1, op: 0.06 },
  { left: 89, bottom: 30, dur: 23, delay: 8,   size: 1, op: 0.08 },
  { left: 94, bottom: 55, dur: 16, delay: 0.8, size: 2, op: 0.07 },
  { left: 4,  bottom: 70, dur: 20, delay: 4.5, size: 1, op: 0.06 },
  { left: 19, bottom: 65, dur: 14, delay: 2,   size: 1, op: 0.08 },
  { left: 42, bottom: 80, dur: 17, delay: 5.5, size: 2, op: 0.05 },
  { left: 73, bottom: 75, dur: 21, delay: 1.5, size: 1, op: 0.07 },
];

const HeroParticles = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <style>{`
      @keyframes particleDrift {
        0%   { transform: translateY(0) translateX(0); opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 1; }
        100% { transform: translateY(-80vh) translateX(12px); opacity: 0; }
      }
    `}</style>
    {PARTICLES.map((p, i) => (
      <div key={i} style={{
        position: 'absolute',
        left: `${p.left}%`,
        bottom: `${p.bottom}%`,
        width: p.size,
        height: p.size,
        borderRadius: '50%',
        background: '#f17022',
        opacity: 0,
        animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
        willChange: 'transform, opacity',
      }} />
    ))}
  </div>
);

// ─── SECTION DIVIDER (thin line + center dot, like a book) ───────────────────
const SectionDivider = () => (
  <div style={{
    display: 'flex', alignItems: 'center',
    padding: '0 48px', margin: '0 auto', maxWidth: 1100,
  }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    <div style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, margin: '0 20px',
      border: '1px solid var(--border)',
      background: 'transparent',
    }} />
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ─── STEP SVG ICONS ───────────────────────────────────────────────────────────
const IconDescribe = () => (
  <svg viewBox="0 0 48 48" fill="none" style={{ width: 44, height: 44 }}>
    <rect x="6" y="10" width="36" height="6" rx="1" stroke="white" strokeWidth="0.8" opacity="0.3" />
    <rect x="6" y="20" width="24" height="6" rx="1" stroke="white" strokeWidth="0.8" opacity="0.2" />
    <rect x="6" y="30" width="30" height="6" rx="1" stroke="white" strokeWidth="0.8" opacity="0.15" />
    <circle cx="40" cy="9" r="4" fill="#f17022" opacity="0.8" />
    <path d="M38 9 L39.5 10.5 L42 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArchitect = () => (
  <svg viewBox="0 0 48 48" fill="none" style={{ width: 44, height: 44 }}>
    <circle cx="24" cy="24" r="15" stroke="white" strokeWidth="0.6" opacity="0.2" strokeDasharray="2 4" />
    <circle cx="24" cy="24" r="9" stroke="#f17022" strokeWidth="0.7" opacity="0.5" />
    {[0, 72, 144, 216, 288].map(a => (
      <line key={a} x1="24" y1="24"
        x2={24 + 15 * Math.cos((a * Math.PI) / 180)}
        y2={24 + 15 * Math.sin((a * Math.PI) / 180)}
        stroke="white" strokeWidth="0.4" opacity="0.2" />
    ))}
    <circle cx="24" cy="24" r="2.5" fill="#f17022" />
    {[0, 72, 144, 216, 288].map(a => (
      <circle key={a}
        cx={24 + 15 * Math.cos((a * Math.PI) / 180)}
        cy={24 + 15 * Math.sin((a * Math.PI) / 180)}
        r="1.5" fill="white" opacity="0.3" />
    ))}
  </svg>
);

const IconOwn = () => (
  <svg viewBox="0 0 48 48" fill="none" style={{ width: 44, height: 44 }}>
    <rect x="8" y="8" width="32" height="32" rx="2" stroke="white" strokeWidth="0.7" opacity="0.2" />
    <rect x="12" y="12" width="10" height="10" rx="1" fill="#f17022" opacity="0.55" />
    <rect x="26" y="12" width="10" height="10" rx="1" stroke="white" strokeWidth="0.6" opacity="0.25" />
    <rect x="12" y="26" width="10" height="10" rx="1" stroke="white" strokeWidth="0.6" opacity="0.25" />
    <rect x="26" y="26" width="10" height="10" rx="1" stroke="#f17022" strokeWidth="0.6" opacity="0.4" />
    <path d="M19 17 L21 19 L25 15" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
);

// ─── OUTPUT CARD ICONS ────────────────────────────────────────────────────────
const OutputIconStrategy = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <circle cx="16" cy="16" r="11" stroke="#f17022" strokeWidth="0.8" opacity="0.5" />
    <circle cx="16" cy="16" r="6" stroke="#f17022" strokeWidth="0.6" opacity="0.3" />
    <circle cx="16" cy="16" r="2" fill="#f17022" opacity="0.9" />
  </svg>
);
const OutputIconNames = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <text x="4" y="22" fontFamily="Georgia,serif" fontSize="18" fill="#6366f1" opacity="0.8" fontStyle="italic">Aa</text>
  </svg>
);
const OutputIconColors = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <rect x="2" y="10" width="8" height="12" rx="1" fill="#f17022" opacity="0.8" />
    <rect x="12" y="6" width="8" height="16" rx="1" fill="white" opacity="0.25" />
    <rect x="22" y="10" width="8" height="12" rx="1" fill="white" opacity="0.1" />
  </svg>
);
const OutputIconTypography = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <path d="M4 8 H28 M16 8 V24" stroke="#f59e0b" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
    <path d="M8 24 H24" stroke="white" strokeWidth="0.6" opacity="0.2" strokeLinecap="round" />
  </svg>
);
const OutputIconLogos = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <g transform="translate(16,16)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a} d="M0 0 C-1.5 -2, -2.5 -6, 0 -9 C2.5 -6, 1.5 -2, 0 0 Z" fill="white" opacity="0.3" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="2" fill="#ec4899" opacity="0.9" />
    </g>
  </svg>
);
const OutputIconVoice = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <path d="M4 20 Q8 10, 12 16 Q16 22, 20 12 Q24 4, 28 16" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const OutputIconManual = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
    <rect x="5" y="4" width="18" height="24" rx="1" stroke="white" strokeWidth="0.7" opacity="0.25" />
    <rect x="5" y="4" width="4" height="24" rx="1" fill="#8b5cf6" opacity="0.5" />
    <path d="M12 10 H20" stroke="white" strokeWidth="0.6" opacity="0.3" strokeLinecap="round" />
    <path d="M12 14 H20" stroke="white" strokeWidth="0.6" opacity="0.2" strokeLinecap="round" />
    <path d="M12 18 H17" stroke="white" strokeWidth="0.6" opacity="0.15" strokeLinecap="round" />
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ─── REVEAL WRAPPER ────────────────────────────────────────────────────────────
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }> = ({
  children, delay = 0, className = '', style = {},
}) => {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(36px)',
      transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
};

// ─── EDUCATION STRIP ──────────────────────────────────────────────────────────
const EducationStrip: React.FC<{ fact: string }> = ({ fact }) => {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: '20px 32px', textAlign: 'center',
      background: 'rgba(241,112,34,0.015)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.9s ease',
    }}>
      <p style={{
        fontSize: 10, letterSpacing: '0.45em', textTransform: 'uppercase',
        color: 'var(--text-muted)', fontWeight: 700,
        fontFamily: 'Inter, sans-serif', margin: 0,
      }}>{fact}</p>
    </div>
  );
};

// ─── ONLY ON HOWICONIC BADGE ──────────────────────────────────────────────────
const OnlyBadge = () => (
  <span style={{
    display: 'inline-block', fontSize: '8px', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f17022',
    border: '1px solid rgba(241,112,34,0.45)', padding: '3px 9px',
    borderRadius: 2, marginLeft: 10, verticalAlign: 'middle',
    fontFamily: 'Inter, sans-serif',
  }}>Only on HowIconic</span>
);

// ─── SECTION HEADING PATTERN ──────────────────────────────────────────────────
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p style={{
    fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--text-subtle)', fontWeight: 700, marginBottom: 16,
    fontFamily: 'Inter, sans-serif',
  }}>{label}</p>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage: React.FC<LandingPageProps> = ({ onStartBuilding, onLogin }) => {
  const [heroReady, setHeroReady] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const S = { maxWidth: 1100, margin: '0 auto' };

  return (
    <div style={{
      background: 'var(--bg, #0a0a0a)', color: 'var(--text, #f5f5f5)',
      minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes sealEntrance {
          from { opacity: 0; transform: rotate(-20deg) scale(0.6); }
          to   { opacity: 1; transform: rotate(0deg) scale(1); }
        }
        @keyframes bloomIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes petalDrift {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(80vh) rotate(360deg); opacity: 0; }
        }
        @keyframes wordUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.07; transform: scale(1); }
          50%       { opacity: 0.16; transform: scale(1.1); }
        }

        .word-up {
          display: inline-block;
          opacity: 0;
          animation: wordUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hi-animate { animation: fadeUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

        .hi-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: #f17022; color: #fff; border: none;
          padding: 15px 36px;
          font-family: Inter, sans-serif; font-size: 11px; font-weight: 900;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; border-radius: 3px; text-decoration: none;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .hi-btn-primary:hover {
          background: #d9611a; transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(241,112,34,0.38);
        }
        .hi-btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: transparent; color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 14px 32px;
          font-family: Inter, sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; border-radius: 3px; text-decoration: none;
          transition: color 0.2s, border-color 0.2s;
        }
        .hi-btn-ghost:hover { color: var(--text); border-color: var(--text-muted); }

        /* Step cards */
        .hi-step-card {
          position: relative; overflow: hidden;
          padding: 36px 28px;
          border: 1px solid var(--border); border-radius: 3px;
          background: var(--card-bg);
          transition: border-color 0.3s, transform 0.3s;
          height: 100%;
        }
        .hi-step-card:hover { border-color: rgba(241,112,34,0.25); transform: translateY(-4px); }

        /* Output cards */
        .hi-output-card {
          padding: 28px 24px;
          border: 1px solid var(--border); border-radius: 3px;
          background: var(--card-bg);
          transition: border-color 0.3s, transform 0.3s;
        }
        .hi-output-card:hover { border-color: rgba(241,112,34,0.22); transform: translateY(-3px); }

        /* Pricing cards */
        .hi-pricing-card {
          flex: 1; min-width: 240px; padding: 40px 32px;
          border: 1px solid var(--border); border-radius: 3px;
          display: flex; flex-direction: column; gap: 24px;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
        }
        .hi-pricing-card:hover { transform: translateY(-4px); }
        .hi-pricing-card.featured {
          border-color: rgba(241,112,34,0.5);
          box-shadow: 0 0 0 1px rgba(241,112,34,0.2), 0 0 60px rgba(241,112,34,0.1), inset 0 0 40px rgba(241,112,34,0.03);
          background: rgba(241,112,34,0.025);
          position: relative;
        }
        .hi-pricing-card.featured:hover {
          box-shadow: 0 0 0 1px rgba(241,112,34,0.5), 0 0 80px rgba(241,112,34,0.18), inset 0 0 40px rgba(241,112,34,0.03);
        }

        /* Step connector line — desktop only */
        .step-connector {
          position: absolute;
          top: 68px; left: 22%; right: 22%;
          height: 0;
          border-top: 1px dashed var(--border);
          z-index: 0;
          pointer-events: none;
        }

        /* Diff comparison */
        .diff-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border: 1px solid var(--border);
          border-radius: 3px;
          overflow: hidden;
        }
        .diff-col {
          padding: 40px 36px;
        }
        .diff-col-left {
          border-right: 1px solid var(--border);
          background: var(--card-bg);
        }
        .diff-col-right {
          background: rgba(241,112,34,0.02);
        }
        .diff-row {
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
        }
        .diff-row:last-child { border-bottom: none; }

        /* Output grid */
        .output-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .output-card-hero {
          grid-column: span 2;
        }

        @media (max-width: 1024px) {
          .output-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .output-card-hero { grid-column: span 3 !important; }
        }

        @media (max-width: 768px) {
          .hi-nav-links { display: none !important; }
          .hi-mobile-btn { display: inline-flex !important; }
          .hi-flex-wrap { flex-direction: column !important; }
          .step-connector { display: none !important; }
          .diff-split { grid-template-columns: 1fr !important; }
          .diff-col-left { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
          .output-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .output-card-hero { grid-column: span 2 !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
          .hero-shapes-left { display: none !important; }
        }

        @media (max-width: 480px) {
          section { padding-left: 16px !important; padding-right: 16px !important; }
          .output-grid { grid-template-columns: 1fr !important; }
          .output-card-hero { grid-column: span 1 !important; }
        }

        @media (min-width: 769px) {
          .hi-mobile-btn { display: none !important; }
        }

        /* Mobile-specific landing page overrides */
        @media (max-width: 640px) {
          /* Hero: reduce padding, fix text overflow */
          section[style*="minHeight: '100vh'"] {
            padding: 120px 20px 80px !important;
          }

          /* CTA buttons: full width, stacked */
          .hi-cta-group {
            flex-direction: column !important;
            width: 100%;
          }
          .hi-cta-group .hi-btn-primary,
          .hi-cta-group .hi-btn-ghost {
            width: 100% !important;
          }

          /* Nav padding */
          nav { padding: 14px 20px !important; }

          /* Pricing section */
          #pricing { padding: 80px 20px !important; }
          #how { padding: 80px 20px !important; }

          /* Footer stacks */
          footer { padding: 48px 20px 32px !important; }
          .hi-footer-top { flex-direction: column !important; gap: 32px !important; }
          .hi-footer-bottom { flex-direction: column !important; gap: 12px !important; }

          /* Section headings scale down */
          h2[style*="clamp"] { font-size: clamp(1.8rem, 7vw, 2.6rem) !important; }

          /* Most Popular badge offset fix */
          .hi-pricing-card.featured { margin-top: 16px; }
        }
      `}</style>

      {/* ─── 1. NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
        padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--nav-bg, rgba(10,10,10,0.93))', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MasterSeal className="w-8 h-8" animate={true} />
          <span style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900,
            fontSize: 16, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text)',
          }}>HOWICONIC</span>
        </div>
        <div className="hi-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['How It Works', '#how'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={label} href={href} style={{
              color: 'var(--text-muted)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >{label}</a>
          ))}
          <button onClick={onLogin} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.28em', textTransform: 'uppercase', transition: 'color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >Log in</button>
          <button className="hi-btn-primary btn-interactive" onClick={onStartBuilding} style={{ padding: '9px 22px', fontSize: 10 }}>
            Start building →
          </button>
        </div>
        <div className="hi-mobile-btn" style={{ display: 'none', gap: 8 }}>
          <button className="hi-btn-ghost" onClick={onLogin}
            style={{ padding: '8px 14px', fontSize: 10 }}>
            Log in
          </button>
          <button className="hi-btn-primary btn-interactive" onClick={onStartBuilding}
            style={{ padding: '8px 14px', fontSize: 10 }}>
            Start →
          </button>
        </div>
      </nav>

      {/* ─── 2. HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '160px 48px 120px',
        overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: theme === 'dark'
            ? 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)'
            : 'linear-gradient(rgba(26,26,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Orange glow bloom — breathing, 8s cycle */}
        <div style={{
          position: 'absolute', top: '38%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(241,112,34,0.09) 0%, transparent 62%)',
          pointerEvents: 'none',
          animation: 'glowPulse 8s ease-in-out infinite',
        }} />

        {/* Brand Construction SVG — top right */}
        <div style={{
          position: 'absolute', top: 80, right: '4%',
          width: 280, height: 280, pointerEvents: 'none', opacity: 0.7,
        }}>
          <BrandConstruction />
        </div>

        {/* Brand Construction SVG — bottom left (smaller, mirrored feel) */}
        <div className="hero-shapes-left" style={{
          position: 'absolute', bottom: 60, left: '3%',
          width: 180, height: 180, pointerEvents: 'none', opacity: 0.25,
          transform: 'scaleX(-1)',
        }}>
          <BrandConstruction />
        </div>

        {/* Particle system */}
        <HeroParticles />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 920 }}>
          {/* Overline */}
          <p className="hi-animate" style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.65em',
            textTransform: 'uppercase', color: '#f17022',
            marginBottom: 36, animationDelay: '0.08s',
          }}>
            Brand Operating System
          </p>

          {/* Main title — letter-by-letter TextReveal */}
          <div style={{ marginBottom: 36 }}>
            <TextReveal
              text="Your brand,"
              tag="h1"
              staggerMs={28}
              style={{
                fontFamily: 'Playfair Display, serif', fontWeight: 900,
                fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
                lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--text)',
                margin: 0,
              }}
            />
            <TextReveal
              text="engineered."
              tag="h1"
              staggerMs={35}
              style={{
                fontFamily: 'Playfair Display, serif', fontWeight: 900,
                fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
                lineHeight: 1.05, letterSpacing: '-0.02em',
                color: '#f17022', fontStyle: 'italic',
                textShadow: '0 0 60px rgba(241,112,34,0.35), 0 0 120px rgba(241,112,34,0.15)',
                margin: 0,
              }}
            />
          </div>

          {/* Tagline */}
          <p className="hi-animate" style={{
            fontSize: 17, color: 'var(--text-muted)',
            marginBottom: 56, letterSpacing: '0.12em',
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
            animationDelay: '0.82s',
          }}>
            Strategy. Name. Identity. One engine.
          </p>

          {/* Kee */}
          <KeeAlive animate={true} speakable={false}>
            {"Every satisfying brand you've ever seen started with a clear answer to one question: what do you believe? Start there."}
          </KeeAlive>

          {/* CTAs */}
          <div className="hi-animate hi-cta-group" style={{
            display: 'flex', gap: 14, justifyContent: 'center',
            flexWrap: 'wrap', animationDelay: '0.98s',
          }}>
            <button className="hi-btn-primary btn-interactive" onClick={onStartBuilding}
              style={{ fontSize: 12, padding: '16px 40px' }}>
              Start building →
            </button>
            <button className="hi-btn-ghost btn-interactive" onClick={onLogin}
              style={{ fontSize: 12, padding: '15px 32px' }}>
              Log in
            </button>
          </div>

          {/* Subtext */}
          <p className="hi-animate" style={{
            marginTop: 56, fontSize: 9, letterSpacing: '0.55em',
            textTransform: 'uppercase', color: 'var(--text-subtle)',
            fontWeight: 700, animationDelay: '1.14s',
          }}>
            Strategy · Naming · Visual System · Brand Manual
          </p>

          <GuideText>
            Every great brand starts with a question: what do you actually stand for? Not what you sell — what you believe.
          </GuideText>
        </div>
      </section>

      {/* ─── DIVIDER ─────────────────────────────────────────────────────────── */}
      <SectionDivider />

      {/* ─── 3. EDUCATION STRIP 1 ────────────────────────────────────────────── */}
      <EducationStrip fact="Brand value of the top 100 global brands: $3.5 trillion — built on identity, not just product." />

      <SectionDivider />

      {/* ─── 4. HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how" style={{ padding: '120px 48px', background: 'var(--card-bg)' }}>
        <div style={S}>
          <Reveal style={{ marginBottom: 80, textAlign: 'center' }}>
            <SectionLabel label="How it works" />
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--text)', lineHeight: 1.1,
            }}>
              Three steps to<br />
              <span style={{ color: '#f17022' }}>a complete brand.</span>
            </h2>
          </Reveal>

          {/* Steps container with connecting line */}
          <div style={{ position: 'relative' }}>
            {/* Horizontal connecting line — desktop only (color handled by CSS var in step-connector) */}
            <div className="step-connector" />

            <div className="hi-flex-wrap" style={{ display: 'flex', gap: 20 }}>
              {[
                {
                  num: '01', label: 'DESCRIBE',
                  title: 'Describe your vision',
                  desc: 'Tell us what your brand believes, who it serves, and how it should feel. Four fields. Two minutes.',
                  Icon: IconDescribe, delay: 0,
                },
                {
                  num: '02', label: 'ARCHITECT',
                  title: 'AI architects your brand',
                  desc: 'Our 5-stage pipeline fires — strategy, naming, domain check, visual system, brand assembly. No templates used.',
                  Icon: IconArchitect, delay: 130,
                },
                {
                  num: '03', label: 'OWN',
                  title: 'Own a complete brand',
                  desc: 'Strategy, coined name, color palette, typography, logo, voice guidelines, brand manual — yours to keep.',
                  Icon: IconOwn, delay: 260,
                },
              ].map(({ num, label, title, desc, Icon, delay }) => (
                <Reveal key={num} delay={delay} style={{ flex: 1, minWidth: 220 }}>
                  <div className="hi-step-card">
                    {/* Large faded background number */}
                    <span style={{
                      position: 'absolute', top: -10, left: 16,
                      fontSize: 180, fontWeight: 900,
                      fontFamily: 'Playfair Display, serif',
                      color: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(26,26,26,0.04)',
                      lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
                      zIndex: 0,
                    }}>{num}</span>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: '0.5em',
                          textTransform: 'uppercase', color: '#f17022',
                        }}>{num} {label}</span>
                      </div>
                      <div style={{ marginBottom: 24 }}>
                        <Icon />
                      </div>
                      <h3 style={{
                        fontFamily: 'Playfair Display, serif', fontWeight: 900,
                        fontSize: 19, color: 'var(--text)', textTransform: 'uppercase',
                        marginBottom: 14, lineHeight: 1.2,
                      }}>{title}</h3>
                      <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── 5. EDUCATION STRIP 2 ────────────────────────────────────────────── */}
      <EducationStrip fact="Color increases brand recognition by up to 80% — every shade in your system is chosen with purpose." />

      <SectionDivider />

      {/* ─── 6. THE DIFFERENCE ───────────────────────────────────────────────── */}
      <section style={{ padding: '120px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal style={{ marginBottom: 80, textAlign: 'center' }}>
            <SectionLabel label="The difference" />
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--text)', lineHeight: 1.1,
            }}>
              What makes HowIconic<br />
              <span style={{ color: '#f17022' }}>different.</span>
            </h2>
          </Reveal>

          <Reveal>
            <div className="diff-split">
              {/* Left: Others */}
              <div className="diff-col diff-col-left">
                <p style={{
                  fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase',
                  fontWeight: 800, color: 'var(--text-subtle)', marginBottom: 32,
                  paddingBottom: 20, borderBottom: '1px solid var(--border)',
                }}>Others</p>
                {[
                  { title: 'Strategy Engine', text: 'Make a logo.' },
                  { title: 'Coined Names', text: 'Suggest existing words.' },
                  { title: 'Domain Check', text: 'Give you a name.' },
                ].map(({ title, text }) => (
                  <div key={title} className="diff-row">
                    <p style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--text-subtle)',
                      marginBottom: 6,
                    }}>{title}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-subtle)', lineHeight: 1.6 }}>
                      <span style={{ marginRight: 8, opacity: 0.4 }}>✗</span>{text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right: HowIconic */}
              <div className="diff-col diff-col-right">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <p style={{
                    fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase',
                    fontWeight: 800, color: '#f17022',
                  }}>HowIconic</p>
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: '#f17022',
                    border: '1px solid rgba(241,112,34,0.35)', padding: '3px 10px', borderRadius: 2,
                  }}>Strategy-first</span>
                </div>
                {[
                  {
                    title: 'Strategy Engine',
                    text: 'Architect your brand.',
                    desc: 'Archetype, positioning, brand tensions, competitive whitespace — built from what your brand actually believes.',
                  },
                  {
                    title: 'Coined Names',
                    text: 'Invent your word.',
                    desc: 'Invented names like Spotify and Kodak. Names with nowhere else to live — legally clean, culturally ownable.',
                  },
                  {
                    title: 'Domain Check',
                    text: 'Verify it first.',
                    desc: 'Every name is .com-checked before you see it. No heartbreak after falling in love with something taken.',
                  },
                ].map(({ title, text, desc }) => (
                  <div key={title} className="diff-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <p style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--text-muted)',
                      }}>{title}</p>
                      <OnlyBadge />
                    </div>
                    <p style={{
                      fontSize: 15, color: 'var(--text)', fontWeight: 600,
                      lineHeight: 1.5, marginBottom: 6,
                    }}>
                      <span style={{ color: '#f17022', marginRight: 8 }}>✓</span>{text}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* ─── 7. WHAT YOU GET ─────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 48px', background: 'var(--card-bg)' }}>
        <div style={S}>
          <Reveal style={{ marginBottom: 80, textAlign: 'center' }}>
            <SectionLabel label="What you get" />
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--text)', lineHeight: 1.1,
            }}>
              A complete brand system.<br />
              <span style={{ color: '#f17022' }}>Not a logo. A language.</span>
            </h2>
          </Reveal>

          <div className="output-grid">
            {[
              {
                Icon: OutputIconStrategy, title: 'Brand Strategy',
                desc: 'Archetype, positioning & brand tensions — the intellectual foundation everything else builds on.',
                accent: '#f17022', hero: true,
              },
              {
                Icon: OutputIconNames, title: 'Coined Names',
                desc: 'Invented, legally-ownable brand names.',
                accent: '#6366f1', hero: false,
              },
              {
                Icon: OutputIconColors, title: 'Color System',
                desc: 'Primary, secondary & neutral palette.',
                accent: '#10b981', hero: false,
              },
              {
                Icon: OutputIconTypography, title: 'Typography',
                desc: 'Type scale & font personality pairing.',
                accent: '#f59e0b', hero: false,
              },
              {
                Icon: OutputIconLogos, title: 'Logo System',
                desc: 'Primary mark & simplified variants.',
                accent: '#ec4899', hero: false,
              },
              {
                Icon: OutputIconVoice, title: 'Brand Voice',
                desc: 'Tone of voice & messaging frameworks.',
                accent: '#3b82f6', hero: false,
              },
              {
                Icon: OutputIconManual, title: 'Brand Manual',
                desc: 'Exportable PDF — yours to own.',
                accent: '#8b5cf6', hero: false,
              },
            ].map(({ Icon, title, desc, accent, hero }, i) => (
              <Reveal key={title} delay={i * 60} className={hero ? 'output-card-hero' : ''}>
                <div className="hi-output-card" style={{ borderTop: `2px solid ${accent}`, height: '100%' }}>
                  <div style={{ marginBottom: 18 }}>
                    <Icon />
                  </div>
                  <h4 style={{
                    fontFamily: 'Playfair Display, serif', fontWeight: 900,
                    fontSize: hero ? 18 : 14, color: 'var(--text)', textTransform: 'uppercase',
                    marginBottom: 8, lineHeight: 1.3,
                  }}>{title}</h4>
                  <p style={{ fontSize: hero ? 13 : 11, lineHeight: 1.75, color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── 8. EDUCATION STRIP 3 ────────────────────────────────────────────── */}
      <EducationStrip fact="The Nike Swoosh cost $35. It's now worth $50 billion. Identity compounds." />

      <SectionDivider />

      {/* ─── SHOWCASE: Built with HowIconic ──────────────────────────────── */}
      <section style={{ padding: '120px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal style={{ marginBottom: 80, textAlign: 'center' }}>
            <SectionLabel label="Built with HowIconic" />
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--text)', lineHeight: 1.1,
            }}>
              Real brands.<br />
              <span style={{ color: '#f17022' }}>Built in minutes.</span>
            </h2>
          </Reveal>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {/* Brand 1: Seravona — Premium Coffee */}
            <Reveal>
              <div className="card-hover" style={{
                background: 'var(--bg-secondary)', borderRadius: 20, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                {/* Color strip */}
                <div style={{ display: 'flex', height: 8 }}>
                  <div style={{ flex: 2, background: '#2D5016' }} />
                  <div style={{ flex: 1, background: '#C4A35A' }} />
                  <div style={{ flex: 1, background: '#8B4513' }} />
                </div>
                <div style={{ padding: '32px 28px' }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>
                    Sage · Coffee · Warm
                  </p>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>
                    Seravona
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
                    "Where every cup is a conversation with the earth."
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2D5016' }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#C4A35A' }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#8B4513' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Cormorant · Space Grotesk
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Brand 2: Voltarc — Electric Vehicles */}
            <Reveal delay={150}>
              <div className="card-hover" style={{
                background: 'var(--bg-secondary)', borderRadius: 20, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', height: 8 }}>
                  <div style={{ flex: 2, background: '#0066FF' }} />
                  <div style={{ flex: 1, background: '#00D4FF' }} />
                  <div style={{ flex: 1, background: '#1A1A2E' }} />
                </div>
                <div style={{ padding: '32px 28px' }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>
                    Hero · EV · Bold
                  </p>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>
                    Voltarc
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
                    "Power moves forward."
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0066FF' }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#00D4FF' }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1A1A2E' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Bebas Neue · DM Sans
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Brand 3: Nourish & — Organic Skincare */}
            <Reveal delay={300}>
              <div className="card-hover" style={{
                background: 'var(--bg-secondary)', borderRadius: 20, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', height: 8 }}>
                  <div style={{ flex: 2, background: '#E8C4A0' }} />
                  <div style={{ flex: 1, background: '#F5E6D3' }} />
                  <div style={{ flex: 1, background: '#4A6741' }} />
                </div>
                <div style={{ padding: '32px 28px' }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>
                    Caregiver · Skincare · Clean
                  </p>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>
                    Nourish &amp;
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
                    "Skin that remembers kindness."
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8C4A0' }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F5E6D3' }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#4A6741' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    DM Serif Display · Inter
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--text-muted)' }}>
              Each brand was built from 4 inputs in under 5 minutes.
            </p>
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* ─── 9. PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '120px 48px' }}>
        <div style={S}>
          <Reveal style={{ marginBottom: 80, textAlign: 'center' }}>
            <SectionLabel label="Pricing" />
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--text)', lineHeight: 1.1,
            }}>
              Start free.<br />
              <span style={{ color: '#f17022' }}>Build iconic.</span>
            </h2>
          </Reveal>

          <div className="hi-flex-wrap" style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>

            {/* Explorer */}
            <Reveal delay={0} style={{ flex: 1, minWidth: 240 }}>
              <div className="hi-pricing-card" style={{ height: '100%' }}>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 12 }}>Explorer</p>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>Free</p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 8 }}>No card needed · Always free</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {['3 brand previews/month', 'Strategy + Naming output', 'Brand Card export', 'Basic color palette'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: '#f17022', fontSize: 11, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <button className="hi-btn-ghost" onClick={onStartBuilding} style={{ width: '100%' }}>
                    Get started free
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Creator — Featured */}
            <Reveal delay={130} style={{ flex: 1, minWidth: 240 }}>
              <div className="hi-pricing-card featured" style={{ height: '100%' }}>
                {/* MOST POPULAR badge */}
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  background: '#f17022', color: '#fff',
                  fontSize: 8, fontWeight: 900, letterSpacing: '0.2em',
                  textTransform: 'uppercase', padding: '5px 18px', borderRadius: '0 0 4px 4px',
                  whiteSpace: 'nowrap',
                }}>Most Popular</div>

                <div style={{ paddingTop: 12 }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: '#f17022', marginBottom: 12 }}>Creator</p>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>₹2,999</p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 8 }}>One-time · 1 complete brand</p>
                  {/* Agency comparison */}
                  <p style={{
                    fontSize: 10, color: 'var(--text-subtle)', marginTop: 6,
                    fontStyle: 'italic',
                  }}>vs. brand agency: ₹2–10 lakh</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {[
                    'Everything in Explorer',
                    'Full logo system',
                    'Brand mockups',
                    'PDF brand manual',
                    '.com domain availability report',
                    'Typography & voice guide',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: '#f17022', fontSize: 11, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <a
                    href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20to%20unlock%20HowIconic%20Creator%20(%E2%82%B92%2C999)%20for%20my%20brand%20project."
                    target="_blank" rel="noopener noreferrer"
                    className="hi-btn-primary"
                    style={{ width: '100%', fontSize: 12 }}
                  >
                    Get Creator →
                  </a>
                  <p style={{
                    textAlign: 'center', fontSize: 10, color: 'var(--text-subtle)',
                    marginTop: 10, letterSpacing: '0.05em',
                  }}>No subscription. No lock-in.</p>
                </div>
              </div>
            </Reveal>

            {/* Studio */}
            <Reveal delay={260} style={{ flex: 1, minWidth: 240 }}>
              <div className="hi-pricing-card" style={{ height: '100%' }}>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 12 }}>Studio</p>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>₹7,499</p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 8 }}>per month · 10–15 brands</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {[
                    'Everything in Creator',
                    '10–15 full brands / month',
                    'Brand comparison tool',
                    'Priority support',
                    'Team collaboration',
                    'Yearly: ₹59,999 (save 33%)',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: '#f17022', fontSize: 11, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <a
                    href="https://wa.me/919486183626?text=Hi%2C%20I%27d%20like%20the%20HowIconic%20Studio%20plan%20(%E2%82%B97%2C499%2Fmo)."
                    target="_blank" rel="noopener noreferrer"
                    className="hi-btn-ghost"
                    style={{ width: '100%' }}
                  >
                    Get Studio →
                  </a>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── 10. FINAL CTA ───────────────────────────────────────────────────── */}
      <section style={{
        padding: '140px 48px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'rgba(241,112,34,0.02)',
        borderTop: '1px solid rgba(241,112,34,0.07)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: theme === 'dark' ? 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)' : 'linear-gradient(rgba(26,26,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(241,112,34,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <MasterSeal className="w-12 h-12" />
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(2.4rem, 6.5vw, 5rem)', color: 'var(--text)',
              marginBottom: 24, lineHeight: 1.05,
            }}>
              Ready to build something<br />
              <span style={{ color: '#f17022' }}>iconic?</span>
            </h2>
            <p style={{
              fontSize: 16, color: 'var(--text-muted)',
              marginBottom: 52, fontWeight: 400,
              maxWidth: 420, margin: '0 auto 52px',
            }}>
              4 lines in. A complete brand system out.
            </p>
            <button className="hi-btn-primary btn-interactive" onClick={onStartBuilding}
              style={{ fontSize: 13, padding: '18px 52px' }}>
              Start building →
            </button>
          </Reveal>
        </div>
      </section>

      {/* ─── 11. FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '72px 48px 52px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary, #070707)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Top: Logo + About */}
          <div className="hi-flex-wrap" style={{ display: 'flex', gap: 60, marginBottom: 56, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <MasterSeal className="w-8 h-8" />
                <span style={{
                  fontFamily: 'Playfair Display, serif', fontWeight: 900,
                  fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text)',
                }}>HOWICONIC</span>
              </div>
              <p style={{
                fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.85,
                fontFamily: 'Georgia, serif', fontStyle: 'italic', maxWidth: 280,
              }}>
                Born from a flower on a terrace in Tirupur. HowIconic is a Brand Operating System built in India. Strategy-first. Parijata-inspired. Build what lasts.
              </p>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: 16 }}>Platform</p>
                {[['How It Works', '#how'], ['What You Get', '#'], ['Pricing', '#pricing']].map(([label, href]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <a href={href} style={{
                      fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >{label}</a>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: 16 }}>Company</p>
                {[['About', '#'], ['Privacy Policy', '#'], ['Terms', '#']].map(([label, href]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <a href={href} style={{
                      fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >{label}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
            <div className="hi-flex-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>

              <p style={{ fontSize: 10, color: 'var(--text-subtle)', letterSpacing: '0.1em' }}>
                © 2026 HowIconic. All rights reserved.
              </p>

              {/* Social / contact row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <a
                  href="https://wa.me/919486183626"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 10, color: 'var(--text-subtle)',
                    textDecoration: 'none', letterSpacing: '0.1em',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f17022'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-subtle)'; }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                <span style={{ color: 'var(--border)' }}>·</span>
                <p style={{
                  fontSize: 11, color: 'var(--text-subtle)',
                  fontStyle: 'italic', fontFamily: 'Georgia, serif',
                }}>
                  Built with 🔥 in India
                </p>
              </div>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
