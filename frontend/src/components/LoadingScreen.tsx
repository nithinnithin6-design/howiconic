import React, { useState, useEffect } from 'react';

const phases = [
  { msg: "Laying the foundation...", threshold: 20 },
  { msg: "Finding your voice...", threshold: 40 },
  { msg: "Shaping the visual system...", threshold: 60 },
  { msg: "Choosing your colors...", threshold: 75 },
  { msg: "Assembling your brand...", threshold: 90 },
  { msg: "Almost there...", threshold: 100 },
];

// Falling petal configs — each with unique timing
const PETALS = [
  { left: '12%', size: 8, duration: 6, delay: 0, rotation: 120 },
  { left: '28%', size: 5, duration: 7.5, delay: 1.2, rotation: 200 },
  { left: '45%', size: 10, duration: 5.5, delay: 0.5, rotation: 300 },
  { left: '62%', size: 6, duration: 8, delay: 2, rotation: 160 },
  { left: '78%', size: 7, duration: 6.5, delay: 0.8, rotation: 250 },
  { left: '88%', size: 4, duration: 9, delay: 1.5, rotation: 180 },
  { left: '35%', size: 9, duration: 7, delay: 3, rotation: 140 },
];

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(phases[0].msg);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99.8) return 99.8;
        const increment = prev < 40 ? 0.45 : prev < 80 ? 0.2 : 0.012;
        const next = Math.min(99.8, prev + increment + Math.random() * 0.04);
        const phaseMatch = phases.find(p => next <= p.threshold);
        if (phaseMatch) setCurrentPhase(phaseMatch.msg);
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 250, overflow: 'hidden', userSelect: 'none',
    }}>

      {/* Dawn glow at top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 400,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(241,112,34,0.12) 0%, rgba(241,112,34,0.04) 40%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'dawnPulse 8s ease-in-out infinite',
      }} />

      {/* Falling petals */}
      {PETALS.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: -20, left: p.left,
          width: p.size, height: p.size * 1.6,
          borderRadius: '50%',
          background: 'white',
          opacity: 0,
          animation: `petalFall ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}

      {/* Center: Parijata Mark */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ width: 120, height: 120, margin: '0 auto 48px', animation: 'gentleSpin 30s linear infinite' }}>
          {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
            <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.85}
              transform={`rotate(${angle} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="8" fill="#f17022"
            style={{ filter: 'drop-shadow(0 0 12px rgba(241,112,34,0.5))' }} />
          <circle cx="50" cy="50" r="3" fill="white" opacity="0.7" />
        </svg>

        {/* Phase text */}
        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 16, color: 'rgba(255,255,255,0.5)',
          marginBottom: 40, letterSpacing: '0.02em',
          transition: 'opacity 0.5s ease',
        }}>
          {currentPhase}
        </p>

        {/* Progress bar */}
        <div style={{
          width: 280, height: 2, background: 'rgba(255,255,255,0.08)',
          borderRadius: 1, overflow: 'hidden', margin: '0 auto 16px',
        }}>
          <div style={{
            height: '100%', borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.6), #f17022)',
            transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            width: `${progress}%`,
          }} />
        </div>

        {/* Percentage */}
        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.2)',
          fontFamily: 'Inter, sans-serif', fontWeight: 500,
          letterSpacing: '0.1em',
        }}>
          {Math.round(progress)}%
        </p>
      </div>

      {/* Bottom tagline */}
      <p style={{
        position: 'absolute', bottom: 40,
        fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.12)', fontWeight: 600,
      }}>
        Build what lasts.
      </p>

      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          8%   { opacity: 0.5; }
          85%  { opacity: 0.3; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes dawnPulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @keyframes gentleSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
