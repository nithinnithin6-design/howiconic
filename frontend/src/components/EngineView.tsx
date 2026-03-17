import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrandVibe } from '../types';
import * as api from '../api';

const VIBES: BrandVibe[] = ['Bold', 'Clean', 'Warm', 'Raw', 'Future'];

const VIBE_DESC: Record<BrandVibe, string> = {
  Bold: 'High contrast. Unapologetic. Commands attention.',
  Clean: 'Restrained. Precise. Nothing extra.',
  Warm: 'Human. Textured. Built to be touched.',
  Raw: 'Industrial. Unpolished. Honest about what it is.',
  Future: 'Forward-looking. Minimal tension. Electric.',
};

// Blueprint grid background element
const BlueprintBloom = ({ vibe, isPressing }: { vibe: BrandVibe; isPressing?: boolean }) => {
  const colors: Record<BrandVibe, string> = {
    Bold: '#f17022',
    Clean: '#e8e8e8',
    Warm: '#c47a3a',
    Raw: '#8a8a7a',
    Future: '#3a7ac4',
  };
  const color = colors[vibe];
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <div
        className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full opacity-[0.04] blur-[120px] transition-all duration-1000"
        style={{ backgroundColor: color, transform: isPressing ? 'scale(1.2)' : 'scale(1)' }}
      />
    </div>
  );
};

// Education hint — shows below input fields
interface EducationHintProps {
  field: string;
}

const EducationHint: React.FC<EducationHintProps> = ({ field }) => {
  const [hint, setHint] = useState<{ content: string; source: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const data = await api.getFieldHint(field);
      if (!cancelled) {
        setHint(data);
        // Small extra delay for the fade-in after data arrives
        setTimeout(() => { if (!cancelled) setVisible(true); }, 100);
      }
    }, 400); // stagger based on field
    return () => { cancelled = true; clearTimeout(timer); };
  }, [field]);

  if (!hint) return null;

  return (
    <p
      style={{
        opacity: visible ? 0.35 : 0,
        transition: 'opacity 0.6s ease',
        fontSize: 11,
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      <span style={{ flexShrink: 0 }}>💡</span>
      <span>{hint.content}</span>
    </p>
  );
};

interface EngineViewProps {
  onManifest: (brandIdea: string, product: string, audience: string, vibe: BrandVibe) => void;
  isManifesting?: boolean;
  sound?: {
    click: () => void;
    whoosh: () => void;
    chime: () => void;
    muted: boolean;
    toggleMute: () => void;
  };
}

const GuideText = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderLeft: '2px solid rgba(241,112,34,0.3)', paddingLeft: 16, margin: '24px 0' }}>
    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
      {children}
    </p>
  </div>
);

const EngineView: React.FC<EngineViewProps> = ({ onManifest, isManifesting, sound }) => {
  const [brandIdea, setBrandIdea] = useState('');
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [vibe, setVibe] = useState<BrandVibe>('Bold');
  const [validationMsg, setValidationMsg] = useState('');
  const ideaRef = useRef<HTMLTextAreaElement>(null);

  const handleIdeaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBrandIdea(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.max(64, el.scrollHeight) + 'px';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isManifesting) return;
    if (!brandIdea.trim()) {
      setValidationMsg('Tell us what this brand believes first.');
      setTimeout(() => setValidationMsg(''), 4000);
      return;
    }
    if (!product.trim()) {
      setValidationMsg("Tell us what it sells.");
      setTimeout(() => setValidationMsg(''), 4000);
      return;
    }
    setValidationMsg('');
    sound?.click();
    onManifest(brandIdea.trim(), product.trim(), audience.trim(), vibe);
  };

  const inputClass =
    'w-full bg-transparent border-none text-xl md:text-2xl font-serif-elegant italic focus:outline-none placeholder:text-white/20 placeholder:not-italic text-white leading-snug';

  const cardClass =
    'p-7 md:p-9 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/22 focus-within:border-white/30 transition-all duration-300';

  return (
    <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-12 py-8 relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-[0.04] pointer-events-none" />
      <BlueprintBloom vibe={vibe} isPressing={isManifesting} />

      <div className="relative z-10 w-full max-w-2xl space-y-6 md:space-y-8 pt-4 md:pt-8">

        {/* Header */}
        <header className="text-center space-y-3 pb-4">
          <h1 className="text-[3rem] sm:text-[4.5rem] md:text-[6rem] font-serif-display uppercase italic font-black text-white leading-none tracking-tighter">
            Identity Engine
          </h1>
          <p className="text-[10px] md:text-[12px] uppercase tracking-[0.6em] text-white/40 font-black">
            Describe your vision. We'll build your brand.
          </p>
          <GuideText>Four questions. That's all it takes to start.</GuideText>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Field 1: Brand Idea */}
          <div className={cardClass}>
            <label className="text-[8px] uppercase tracking-[1em] text-white/30 font-black block mb-3">
              01 · Brand Idea
            </label>
            <textarea
              ref={ideaRef}
              value={brandIdea}
              onChange={handleIdeaChange}
              placeholder="What should this brand believe? e.g., Every athlete deserves gear that respects their effort"
              className={`${inputClass} resize-none min-h-[64px]`}
              disabled={isManifesting}
            />
            <EducationHint field="brand_idea" />
          </div>

          {/* Field 2: Product */}
          <div className={cardClass}>
            <label className="text-[8px] uppercase tracking-[1em] text-white/30 font-black block mb-3">
              02 · What Does It Sell?
            </label>
            <input
              type="text"
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder="e.g., Premium compression activewear"
              className={inputClass}
              disabled={isManifesting}
            />
            <EducationHint field="product" />
          </div>

          {/* Field 3: Audience */}
          <div className={cardClass}>
            <label className="text-[8px] uppercase tracking-[1em] text-white/30 font-black block mb-3">
              03 · Who Is It For?
            </label>
            <input
              type="text"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="e.g., Urban Indian athletes, 25–35"
              className={inputClass}
              disabled={isManifesting}
            />
            <EducationHint field="audience" />
          </div>

          {/* Field 4: Vibe */}
          <div className={cardClass}>
            <label className="text-[8px] uppercase tracking-[1em] text-white/30 font-black block mb-5">
              04 · Vibe
            </label>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {VIBES.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVibe(v)}
                  disabled={isManifesting}
                  className={`px-5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-[0.3em] border transition-all duration-200 cursor-pointer ${
                    vibe === v
                      ? 'border-white bg-white text-black'
                      : 'border-white/12 text-white/45 hover:border-white/30 hover:text-white/75'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            {vibe && (
              <p className="text-[9px] text-white/25 font-black uppercase tracking-widest">
                {VIBE_DESC[vibe]}
              </p>
            )}
            <EducationHint field="vibe" />
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 pt-2">
            <motion.button
              type="submit"
              disabled={isManifesting}
              whileHover={isManifesting ? {} : { scale: 1.01 }}
              whileTap={isManifesting ? {} : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={isManifesting ? {} : undefined}
              className={`manifest-btn w-full md:w-auto px-16 md:px-24 py-6 md:py-8 bg-[#0a0a0a] border border-[#f17022]/60 text-[#f17022] rounded-full text-[12px] md:text-[14px] uppercase tracking-[0.7em] font-black transition-all duration-300 ${
                isManifesting
                  ? 'opacity-50 cursor-wait'
                  : 'cursor-pointer hover:bg-[#f17022] hover:text-white hover:border-[#f17022] hover:shadow-[0_12px_40px_rgba(241,112,34,0.25)]'
              }`}
            >
              {isManifesting ? 'Your brand is taking shape...' : 'Start building'}
            </motion.button>

            {validationMsg && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-brand-primary text-sm font-serif-elegant italic"
              >
                {validationMsg}
              </motion.p>
            )}

            <p className="text-[9px] uppercase tracking-[0.5em] text-white/18 font-black">
              ~45–60 seconds · 5-step AI pipeline
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EngineView;
