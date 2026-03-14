import React, { useState, useEffect } from 'react';

const phases = [
  { msg: "SEEKING SENSORY ANCHOR", threshold: 15 },
  { msg: "SYNCHRONIZING RESONANCE", threshold: 35 },
  { msg: "SYNTHESIZING MATERIAL TRUTH", threshold: 55 },
  { msg: "ENCODING NARRATIVE HERITAGE", threshold: 75 },
  { msg: "ALIGNING INDUSTRIAL STRATEGY", threshold: 90 },
  { msg: "CRYSTALLIZING SOVEREIGN FORM", threshold: 100 }
];

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(phases[0].msg);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99.8) return 99.8;
        const increment = prev < 40 ? 0.5 : prev < 80 ? 0.22 : 0.015;
        const next = Math.min(99.8, prev + increment + Math.random() * 0.05);
        const phaseMatch = phases.find(p => next <= p.threshold);
        if (phaseMatch) setCurrentPhase(phaseMatch.msg);
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const petalPath = "M0,0 C-15,-15 -25,-40 0,-70 C25,-40 15,-15 0,0";

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col z-[250] overflow-hidden select-none font-mono">
      <div className="absolute inset-0 blueprint-grid opacity-[0.08] pointer-events-none" />

      {/* Top bar */}
      <div className="p-8 md:p-12 flex justify-between items-center w-full relative z-20 border-b border-white/20 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-14 md:h-14">
            <g transform="translate(50, 50)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                <path key={a} d="M0 -3 C5 -12, 7 -22, 0 -25 C-7 -22, -5 -12, 0 -3 Z" fill="white" transform={`rotate(${a})`} />
              ))}
              <circle cx="0" cy="0" r="5" fill="#f17022" />
            </g>
          </svg>
          <div>
            <p className="text-white text-sm md:text-base font-black uppercase tracking-[0.8em]">HOWICONIC</p>
            <p className="text-white/60 text-[10px] uppercase tracking-[0.4em] mt-1">SOVEREIGN_ENGINE_7.0</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-3xl md:text-5xl font-black tabular-nums">
            {progress.toFixed(1)}<span className="text-white/40 text-xl">%</span>
          </p>
        </div>
      </div>

      {/* Bloom */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative z-10 w-64 h-64 md:w-[500px] md:h-[500px] flex items-center justify-center">
          <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible" style={{ animation: 'spin 100s linear infinite' }}>
            <g>
              {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                <g key={a} transform={`rotate(${a})`}>
                  <path d={petalPath} fill="white" opacity="0.9" />
                </g>
              ))}
            </g>
            <circle cx="0" cy="0" r="14" fill="rgba(241,112,34,0.15)" />
            <circle cx="0" cy="0" r="8.5" fill="#f17022" className="animate-pulse" />
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Bottom status */}
      <div className="pb-20 md:pb-32 flex flex-col items-center z-20 space-y-8">
        <h2 className="text-white text-lg md:text-2xl font-black uppercase tracking-[2em]">MANIFESTING</h2>
        <div className="w-64 md:w-96 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-white to-[#f17022] transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-[11px] md:text-sm uppercase tracking-[1em] font-black animate-pulse">{currentPhase}</p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoadingScreen;
