import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandSystem, V3Strategy, V3Names, V3Visual, V3Integration, DalleLogo, Mockup } from '../types';
import LogoRenderer from './LogoRenderer';
import * as api from '../api';
import KeeAlive from './KeeAlive';

function hexToRgb(hex: string): string {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return '';
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return isNaN(r) ? '' : `${r}, ${g}, ${b}`;
}

// ─── EDITABLE FIELD ───────────────────────────────────────────────────────────

type EditableFieldType = 'text' | 'textarea' | 'color';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  type?: EditableFieldType;
  className?: string;
  style?: React.CSSProperties;
  renderValue?: (v: string) => React.ReactNode;
  placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  type = 'text',
  className,
  style,
  renderValue,
  placeholder = 'Click to edit...',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync value if parent updates it
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const commitSave = useCallback(async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setDraft(value); }
    finally { setSaving(false); setEditing(false); }
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') { e.preventDefault(); commitSave(); }
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  };

  if (editing) {
    if (type === 'color') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          />
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitSave}
            maxLength={7}
            style={{
              width: 90,
              background: 'var(--card-bg)',
              border: '1px solid rgba(241,112,34,0.5)',
              borderRadius: 6,
              padding: '4px 8px',
              color: 'var(--text)',
              fontSize: 13,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          {saving && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>…</span>}
        </span>
      );
    }

    if (type === 'textarea') {
      return (
        <span style={{ display: 'block', position: 'relative' }}>
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitSave}
            rows={4}
            style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: '1px solid rgba(241,112,34,0.4)',
              borderRadius: 10,
              padding: '12px 14px',
              color: 'var(--text)',
              fontSize: 14,
              lineHeight: 1.7,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          {saving && (
            <span style={{
              position: 'absolute', right: 10, bottom: 10,
              fontSize: 9, fontWeight: 900, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: 'var(--text-subtle)',
            }}>
              Saving…
            </span>
          )}
        </span>
      );
    }

    return (
      <span style={{ display: 'inline-block', position: 'relative' }}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitSave}
          placeholder={placeholder}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(241,112,34,0.5)',
            borderRadius: 6,
            padding: '4px 10px',
            color: 'var(--text)',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit',
            textTransform: 'inherit' as any,
            outline: 'none',
            minWidth: 80,
            width: Math.max(draft.length * 12, 80) + 'px',
          }}
        />
        {saving && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-subtle)' }}>…</span>}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        ...style,
        position: 'relative',
        cursor: 'pointer',
        display: 'inline-block',
        borderRadius: 4,
        transition: 'background 0.15s ease',
        background: hovered ? 'rgba(241,112,34,0.06)' : 'transparent',
        padding: '2px 4px',
        margin: '-2px -4px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {renderValue ? renderValue(value) : value || <span style={{ color: 'var(--text-subtle)' }}>{placeholder}</span>}
      {hovered && !saving && !saved && (
        <span style={{
          position: 'absolute',
          right: -20,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 11,
          opacity: 0.5,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          ✏️
        </span>
      )}
      {saved && (
        <span style={{
          position: 'absolute',
          right: -48,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: '#86efac',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: 'fadeInOut 2s ease',
        }}>
          Saved ✓
        </span>
      )}
      <style>{`@keyframes fadeInOut { 0% { opacity:0; } 15% { opacity:1; } 80% { opacity:1; } 100% { opacity:0; } }`}</style>
    </span>
  );
};

// ─── EDUCATION CALLOUT ────────────────────────────────────────────────────────

interface EducationCalloutProps {
  children: React.ReactNode;
}

const EducationCallout: React.FC<EducationCalloutProps> = ({ children }) => (
  <div style={{
    background: 'rgba(241, 112, 34, 0.05)',
    borderLeft: '2px solid #f17022',
    padding: '16px 20px',
    margin: '24px 0',
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.7,
    fontFamily: 'Georgia, serif',
  }}>
    <span style={{
      display: 'block', fontSize: 8, fontWeight: 900, letterSpacing: '0.5em',
      textTransform: 'uppercase', color: '#f17022', fontStyle: 'normal',
      marginBottom: 8, fontFamily: 'Inter, sans-serif',
    }}>
      💡 Why This Works
    </span>
    {children}
  </div>
);

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.8em] font-black text-white/30 mb-6">{children}</p>
);

// Playfair-styled section header for full brand manual
const ManualSectionHeader: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent = '#f17022' }) => (
  <div style={{ marginBottom: 32 }}>
    <h3 style={{
      fontFamily: 'Playfair Display, serif',
      fontWeight: 900, fontStyle: 'italic',
      fontSize: 'clamp(1.4rem, 3vw, 2rem)',
      color: 'var(--text, rgba(255,255,255,0.9))',
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    }}>
      {children}
    </h3>
  </div>
);

// Section divider — thin line with accent dot
const ManualDivider: React.FC<{ accent?: string }> = ({ accent = '#f17022' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', margin: '48px 0',
    opacity: 0.4,
  }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border, rgba(255,255,255,0.08))' }} />
    <div style={{
      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
      margin: '0 16px',
      background: accent,
      boxShadow: `0 0 8px ${accent}`,
    }} />
    <div style={{ flex: 1, height: 1, background: 'var(--border, rgba(255,255,255,0.08))' }} />
  </div>
);

// "ONLY ON HOWICONIC" badge
const OnlyBadge: React.FC = () => (
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

const Divider = () => <div className="border-t border-white/[0.05] my-2" />;

const NarrativeText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-serif-elegant italic text-white/55 leading-[1.85] text-base md:text-lg ${className}`}>
    {children}
  </p>
);

// ─── V3 BRAND CARD (first view) ───────────────────────────────────────────────

interface BrandCardProps {
  brand: BrandSystem;
  onExplore: () => void;
  onBack: () => void;
  onOpenRefine: () => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onExplore, onBack, onOpenRefine }) => {
  const v3i = brand.v3Integration as V3Integration | undefined;
  const v3v = brand.v3Visual as V3Visual | undefined;
  const primaryHex = brand.colors?.primary?.hex || '#f17022';
  const canvasColor = brand.colors?.canvasColor || 'var(--bg-secondary)';
  const [selectedDalleIdx, setSelectedDalleIdx] = useState<number>(0);

  const story = v3i?.story || [];
  const storyText = story.length > 0 ? story.join(' ') : brand.foundation?.story || '';

  const headlineFont = brand.typography?.hierarchy?.headline?.fontFamily || 'Playfair Display';
  const bodyFont = brand.typography?.hierarchy?.body?.fontFamily || 'Inter';

  // Colors to display (brand colors only, not background)
  const displayColors = [
    brand.colors?.primary,
    brand.colors?.secondary,
    brand.colors?.accent,
  ].filter(c => c?.hex);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: canvasColor }}
    >
      {/* Back button */}
      <div className="sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-black text-white/35 hover:text-white transition-all cursor-pointer group"
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          Back
        </button>
        <div className="flex items-center gap-3">
          {brand.isV3 && (
            <span className="text-[7px] uppercase tracking-[0.5em] font-black text-brand-primary/60 border border-brand-primary/20 px-3 py-1 rounded-full no-print">
              V3 Pipeline
            </span>
          )}
          <button
            onClick={onOpenRefine}
            className="no-print text-[9px] uppercase font-black tracking-[0.3em] text-white/40 hover:text-white px-4 py-2 border border-white/10 rounded-full transition-all cursor-pointer hover:border-brand-primary/40 hover:text-brand-primary/70"
          >
            ✦ Refine
          </button>
          <button
            onClick={() => window.print()}
            className="no-print text-[9px] uppercase font-black tracking-[0.3em] text-white/30 hover:text-white px-4 py-2 border border-white/10 rounded-full transition-all cursor-pointer"
          >
            ↓ Export
          </button>
          <button
            onClick={() => { const id = brand.id || brand.uid; if (id) window.open(`/api/brands/${id}/export/guide`, '_blank'); }}
            className="no-print text-[9px] uppercase font-black tracking-[0.3em] text-white/30 hover:text-white px-4 py-2 border border-white/10 rounded-full transition-all cursor-pointer hover:border-brand-primary/30 hover:text-brand-primary/60"
            title="Opens the brand guide in a new tab — use Cmd+P / Ctrl+P to save as PDF"
          >
            ⬇ Brand Kit
          </button>
        </div>
      </div>

      {/* Brand Card Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto w-full">

        {/* Brand Name — HUGE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-6"
        >
          <h1
            className="font-serif-display uppercase font-black text-white leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(4rem, 15vw, 8rem)',
              fontFamily: headlineFont,
            }}
          >
            {brand.name}
          </h1>

          {brand.voice?.tagline && (
            <p
              className="mt-4 text-white/50 font-serif-elegant italic"
              style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}
            >
              "{brand.voice.tagline}"
            </p>
          )}
        </motion.div>

        {/* Logo Mark — centered, prominent (always shown) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="my-12 md:my-16 flex items-center justify-center"
        >
          <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
            {brand.logoSystem?.dalleLogos && brand.logoSystem.dalleLogos.length > 0 ? (
              <img
                src={brand.logoSystem.dalleLogos[selectedDalleIdx]?.imageData}
                alt={`${brand.name} logo`}
                className="w-full h-full object-contain"
              />
            ) : (brand.logoSystem?.symbolOnlySvg || brand.logoSystem?.primaryLogoSvg) ? (
              <LogoRenderer
                svg={brand.logoSystem.symbolOnlySvg || brand.logoSystem.primaryLogoSvg!}
                className="w-full h-full"
                primaryColor={primaryHex}
              />
            ) : (
              // Fallback: initials in brand color ring
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="84" fill="none" stroke={primaryHex} strokeWidth="2.5"/>
                <circle cx="100" cy="100" r="60" fill="none" stroke={primaryHex} strokeWidth="4.5"/>
                <text
                  x="100" y="100" textAnchor="middle" dominantBaseline="central"
                  fill={primaryHex} fontSize="52" fontWeight="900"
                  fontFamily="'Helvetica Neue', Arial, sans-serif"
                  letterSpacing="2"
                >
                  {brand.name?.substring(0, 2).toUpperCase() || '??'}
                </text>
              </svg>
            )}
          </div>
        </motion.div>

        {/* Color Palette — horizontal swatches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full mb-12 md:mb-16"
        >
          <SectionLabel>Color System</SectionLabel>
          <div className="flex gap-3 md:gap-5">
            {displayColors.map((color, i) => (
              <div key={i} className="flex-1 group">
                <div
                  className="rounded-xl md:rounded-2xl mb-3 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg"
                  style={{
                    backgroundColor: color?.hex,
                    height: 'clamp(72px, 12vw, 110px)',
                    boxShadow: `0 4px 20px ${color?.hex}44`,
                  }}
                />
                <p className="text-[10px] font-mono text-white/50 font-black uppercase tracking-wider">{color?.hex}</p>
                {color?.name && (
                  <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-black mt-1 truncate">
                    {color.name}
                  </p>
                )}
                <p className="text-[8px] text-white/20 mt-0.5 capitalize" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Font Pairing — rendered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full mb-12 md:mb-16"
        >
          <SectionLabel>Typography</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-white/[0.07] rounded-xl">
              <p className="text-[7px] uppercase tracking-[0.6em] text-white/20 font-black mb-3">Headline · {headlineFont}</p>
              <p
                className="text-white font-black leading-tight"
                style={{ fontFamily: headlineFont, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
              >
                {brand.name}
              </p>
            </div>
            <div className="p-6 border border-white/[0.07] rounded-xl">
              <p className="text-[7px] uppercase tracking-[0.6em] text-white/20 font-black mb-3">Body · {bodyFont}</p>
              <p
                className="text-white/60 leading-relaxed text-sm md:text-base"
                style={{ fontFamily: bodyFont }}
              >
                Designed without compromise. Every detail deliberate, every choice earned.
              </p>
            </div>
          </div>
          {v3v?.font_pairing_why && (
            <p className="text-[9px] text-white/25 font-black uppercase tracking-widest mt-3">
              {v3v.font_pairing_why}
            </p>
          )}
        </motion.div>

        {/* Brand Story — 3 sentences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="w-full mb-16"
        >
          <SectionLabel>Brand Story</SectionLabel>
          {v3i?.story && v3i.story.length > 0 ? (
            <div className="space-y-3">
              {v3i.story.map((sentence, i) => (
                <p
                  key={i}
                  className="font-serif-elegant italic text-white/65 leading-[1.8]"
                  style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)' }}
                >
                  {sentence}
                </p>
              ))}
            </div>
          ) : (
            <p
              className="font-serif-elegant italic text-white/60 leading-[1.8]"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)' }}
            >
              {storyText || `${brand.name} was built on a conviction — that this category could be better, could be more honest, could mean something.`}
            </p>
          )}
        </motion.div>

        {/* Explore Full System CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <button
            onClick={onExplore}
            className="group flex items-center gap-3 px-10 py-5 border border-white/20 rounded-full text-[11px] uppercase font-black tracking-[0.5em] text-white/60 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer"
          >
            Explore full brand system
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </button>
          <p className="text-[8px] uppercase tracking-widest text-white/15 font-black">
            Strategy · Naming · Colors · Typography · Logo · Voice
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// ─── FULL BRAND SYSTEM (expanded) ─────────────────────────────────────────────

interface FullSystemProps {
  brand: BrandSystem;
  onBack: () => void;
  onCard: () => void;
  onOpenRefine: () => void;
  onFieldSave?: (updated: BrandSystem) => Promise<void>;
}

const FullSystem: React.FC<FullSystemProps> = ({ brand, onBack, onCard, onOpenRefine, onFieldSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryHex = brand.colors?.primary?.hex || '#f17022';
  const [selectedDalleIdx, setSelectedDalleIdx] = useState<number>(0);

  // V2 data (for backward compat)
  const v2s = brand.v2Strategy;
  const v2v = brand.v2Verbal;
  const v2vis = brand.v2Visual;
  const v2i = brand.v2Integration;

  // V3 data (for new brands)
  const v3s = brand.v3Strategy as V3Strategy | undefined;
  const v3n = brand.v3Names as V3Names | undefined;
  const v3vis = brand.v3Visual as V3Visual | undefined;
  const v3i = brand.v3Integration as V3Integration | undefined;

  const isV3 = !!brand.isV3;

  // Simple scroll-reveal using IntersectionObserver (no gsap dependency)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    const els = containerRef.current?.querySelectorAll('.manual-reveal');
    els?.forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(30px)';
      (el as HTMLElement).style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
    // Safety: make everything visible after 2s regardless
    const safety = setTimeout(() => {
      containerRef.current?.querySelectorAll('.manual-reveal').forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'translateY(0)';
      });
    }, 2000);
    return () => { observer.disconnect(); clearTimeout(safety); };
  }, [brand]);

  const colorEntries = [
    { ...brand.colors?.primary, role: 'Primary' },
    { ...brand.colors?.secondary, role: 'Secondary' },
    { ...brand.colors?.accent, role: 'Accent' },
  ].filter(c => c.hex);

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav bar */}
      <div className="sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between backdrop-blur-xl" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onCard}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-black text-white/35 hover:text-white transition-all cursor-pointer group"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
            Brand Card
          </button>
          <span className="text-white/10">·</span>
          <button
            onClick={onBack}
            className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20 hover:text-white/50 transition-all cursor-pointer"
          >
            Vault
          </button>
        </div>
        <div className="flex items-center gap-3">
          {isV3 && (
            <span className="text-[7px] uppercase tracking-[0.5em] font-black text-brand-primary/60 border border-brand-primary/20 px-3 py-1 rounded-full no-print">
              V3 Pipeline
            </span>
          )}
          <button
            onClick={onOpenRefine}
            className="no-print text-[9px] uppercase font-black tracking-[0.3em] text-white/40 hover:text-white px-4 py-2 border border-white/10 rounded-full transition-all cursor-pointer hover:border-brand-primary/40 hover:text-brand-primary/70"
          >
            ✦ Refine
          </button>
          <button
            onClick={() => window.print()}
            className="no-print text-[9px] uppercase font-black tracking-[0.3em] text-white/30 hover:text-white px-4 py-2 border border-white/10 rounded-full transition-all cursor-pointer"
          >
            ↓ Export
          </button>
          <button
            onClick={() => { const id = brand.id || brand.uid; if (id) window.open(`/api/brands/${id}/export/guide`, '_blank'); }}
            className="no-print text-[9px] uppercase font-black tracking-[0.3em] text-white/30 hover:text-white px-4 py-2 border border-white/10 rounded-full transition-all cursor-pointer hover:border-brand-primary/30 hover:text-brand-primary/60"
            title="Opens the brand guide in a new tab — use Cmd+P / Ctrl+P to save as PDF"
          >
            ⬇ Brand Kit PDF
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 md:px-12">

        {/* ── COVER ── */}
        <section className="pt-20 pb-28 relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
            style={{ backgroundColor: primaryHex }}
          />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="pl-8 md:pl-14"
          >
            <p className="text-[8px] uppercase tracking-[1.2em] font-black text-white/15 mb-8">
              {brand.uid || 'HI-XXXXXX'} · HowIconic · Full Brand System
            </p>
            <h1
              className="font-serif-display uppercase font-black text-white leading-[0.88] tracking-tighter mb-8 break-words"
              style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}
            >
              {onFieldSave ? (
                <EditableField
                  value={brand.name || ''}
                  onSave={async (v) => {
                    await onFieldSave({ ...brand, name: v });
                  }}
                  type="text"
                />
              ) : brand.name}
            </h1>
            <p className="text-xl md:text-2xl font-serif-elegant italic text-white/40 max-w-xl leading-relaxed">
              {onFieldSave ? (
                <>
                  "
                  <EditableField
                    value={brand.voice?.tagline || ''}
                    onSave={async (v) => {
                      await onFieldSave({ ...brand, voice: { ...(brand.voice || {}), tagline: v } as any });
                    }}
                    type="text"
                    placeholder="Add tagline..."
                  />
                  "
                </>
              ) : brand.voice?.tagline ? `"${brand.voice.tagline}"` : null}
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-10">
              <div className="h-[1px] w-8 opacity-25" style={{ backgroundColor: primaryHex }} />
              {[brand.sense, (v3s?.archetype || v2s?.archetype || brand.foundation?.archetype)].filter(Boolean).map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-white/10">·</span>}
                  <span className="text-[8px] uppercase tracking-[0.6em] font-black text-white/20">{item}</span>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Kee */}
        <div style={{ margin: '0 auto 0 32px', maxWidth: 520 }} className="manual-reveal">
          <KeeAlive animate={false}>
            {"Everything your team needs to stay on-brand. Send this to designers, developers, anyone who touches the brand."}
          </KeeAlive>
        </div>

        <Divider />

        {/* ── STRATEGY ── */}
        <section className="py-24 space-y-16 manual-reveal">
          <div className="flex items-center">
            <SectionLabel>01 · Strategy</SectionLabel>
            <span style={{ marginTop: '-24px', marginLeft: '8px' }}><OnlyBadge /></span>
          </div>

          {/* V3 tight strategy */}
          {isV3 && v3s ? (
            <div className="space-y-8">
              {/* Archetype */}
              {v3s.archetype && (
                <div className="flex items-start gap-6 p-6 border border-white/[0.07] rounded-2xl bg-white/[0.01]">
                  <div>
                    <p
                      className="text-2xl md:text-3xl font-serif-display uppercase font-black"
                      style={{ color: primaryHex }}
                    >
                      {v3s.archetype}
                    </p>
                    <p className="text-[8px] uppercase tracking-widest text-white/20 font-black mt-1">Archetype</p>
                  </div>
                  {v3s.archetype_why && (
                    <div className="flex-1 border-l border-white/[0.07] pl-6">
                      <p className="font-serif-elegant italic text-white/50 text-base leading-relaxed">
                        {v3s.archetype_why}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Positioning */}
              {v3s.positioning && (
                <div className="pl-0 md:pl-8 manual-reveal">
                  <SectionLabel>Positioning</SectionLabel>
                  <p
                    className="font-serif-display italic font-black text-white/80 leading-tight"
                    style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}
                  >
                    "{v3s.positioning}"
                  </p>
                </div>
              )}

              {/* Strategy grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 manual-reveal">
                {v3s.audience && (
                  <div className="p-5 border border-white/[0.06] rounded-xl space-y-2">
                    <SectionLabel>Audience</SectionLabel>
                    <p className="text-sm font-serif-elegant italic text-white/55 leading-relaxed">{v3s.audience}</p>
                  </div>
                )}
                {v3s.promise && (
                  <div className="p-5 border border-white/[0.06] rounded-xl space-y-2">
                    <SectionLabel>Brand Promise</SectionLabel>
                    <p className="text-sm font-serif-elegant italic text-white/55 leading-relaxed">{v3s.promise}</p>
                  </div>
                )}
              </div>

              {/* Tensions */}
              {v3s.tensions && v3s.tensions.length > 0 && (
                <div className="manual-reveal space-y-4">
                  <SectionLabel>Brand Tensions</SectionLabel>
                  <div className="flex flex-wrap gap-3">
                    {v3s.tensions.map((t, i) => (
                      <span
                        key={i}
                        className="px-5 py-2.5 border rounded-full text-[10px] uppercase font-black tracking-[0.3em] text-white/60"
                        style={{ borderColor: primaryHex + '40' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // V2 strategy fallback
            <div className="space-y-8">
              {(v2s?.archetype || brand.foundation?.archetype) && (
                <div className="flex items-center gap-4">
                  <span
                    className="text-[9px] uppercase tracking-[0.5em] font-black px-4 py-2 border rounded-full"
                    style={{ borderColor: primaryHex + '40', color: primaryHex }}
                  >
                    {v2s?.archetype || brand.foundation?.archetype}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.5em] font-black text-white/20">Archetype</span>
                </div>
              )}
              {(v2s?.positioning_statement || brand.foundation?.positioning) && (
                <p className="text-xl md:text-2xl font-serif-elegant italic text-white/65 leading-relaxed">
                  "{v2s?.positioning_statement || brand.foundation?.positioning}"
                </p>
              )}
              {(v2s?.brand_promise || brand.foundation?.purpose) && (
                <NarrativeText>{v2s?.brand_promise || brand.foundation?.purpose}</NarrativeText>
              )}
              {v2s?.brand_tensions && v2s.brand_tensions.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {v2s.brand_tensions.map((t, i) => (
                    <span key={i} className="px-4 py-2 border border-white/10 rounded-full text-[9px] uppercase font-black tracking-[0.3em] text-white/45">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <EducationCallout>
            Brand strategy is the invisible architecture everything else is built on. Brands with a clear archetype
            generate 2× more revenue than those without — because every decision becomes easier when you know who you are.
            Your positioning, tensions, and promise aren't constraints — they're the rules that make creativity possible.
          </EducationCallout>
        </section>

        <Divider />

        {/* ── NAMING ── */}
        <section className="py-24 space-y-14 manual-reveal">
          <div className="flex items-center">
            <SectionLabel>02 · Naming</SectionLabel>
            <span style={{ marginTop: '-24px', marginLeft: '8px' }}><OnlyBadge /></span>
          </div>

          {/* Brand name — hero */}
          <div className="manual-reveal">
            <h2
              className="font-serif-display uppercase font-black tracking-tighter leading-none"
              style={{ fontSize: 'clamp(4rem, 14vw, 9rem)', color: primaryHex }}
            >
              {brand.name}
            </h2>
            {brand.voice?.tagline && (
              <p className="text-lg md:text-xl font-serif-elegant italic text-white/35 mt-4">
                "{brand.voice.tagline}"
              </p>
            )}
          </div>

          {/* V3 naming — candidates with domain status */}
          {isV3 && v3n ? (
            <div className="space-y-8 manual-reveal">
              <SectionLabel>Name Candidates</SectionLabel>
              <div className="space-y-4">
                {v3n.candidates?.map((candidate, i) => (
                  <div
                    key={i}
                    className={`p-5 border rounded-xl transition-all ${
                      candidate.name === v3n.winner
                        ? 'border-white/30 bg-white/[0.04]'
                        : 'border-white/[0.07] bg-white/[0.01]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p
                            className="font-serif-display uppercase font-black text-xl"
                            style={{ color: candidate.name === v3n.winner ? primaryHex : 'var(--text-muted)' }}
                          >
                            {candidate.name}
                          </p>
                          {candidate.name === v3n.winner && (
                            <span
                              className="text-[7px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border"
                              style={{ borderColor: primaryHex + '50', color: primaryHex }}
                            >
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-serif-elegant italic text-white/40 leading-relaxed">
                          {candidate.origin}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${candidate.domain_available ? 'bg-green-400' : 'bg-red-400/60'}`}
                        />
                        <span className="text-[8px] uppercase tracking-widest font-black text-white/25">
                          {candidate.name.toLowerCase()}.com {candidate.domain_available ? '✓' : '✗'}
                        </span>
                        {candidate.domain_available && (
                          <span style={{
                            fontSize: '8px',
                            fontWeight: 700,
                            color: 'rgba(74,222,128,0.8)',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}>✓ Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {v3n.winner_reason && (
                <div className="pt-4 space-y-2 manual-reveal">
                  <SectionLabel>Why {v3n.winner}</SectionLabel>
                  <p className="font-serif-elegant italic text-white/50 text-base leading-relaxed max-w-2xl">
                    {v3n.winner_reason}
                  </p>
                </div>
              )}
            </div>
          ) : v2v ? (
            // V2 naming fallback
            <div className="space-y-6 manual-reveal">
              {v2v.selection_rationale && (
                <NarrativeText>{v2v.selection_rationale}</NarrativeText>
              )}
              {v2v.name_candidates && v2v.name_candidates.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {v2v.name_candidates.filter(c => c.name !== v2v.selected_name).slice(0, 4).map((c, i) => (
                    <div key={i} className="p-4 border border-white/[0.06] rounded-xl">
                      <p className="text-sm font-black uppercase text-white/40">{c.name}</p>
                      <p className="text-[8px] uppercase tracking-[0.3em] text-white/20 mt-1">{c.category}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <EducationCallout>
            Coined names like Kodak, Spotify, and Rolex have a massive trademark advantage — they can be legally
            protected in every category because they mean nothing except the brand itself. A coined name is a clean
            slate. It becomes whatever you make it. That's why strong brands often choose invented words over
            descriptive ones.
          </EducationCallout>
        </section>

        <Divider />

        {/* ── COLOR SYSTEM ── */}
        <section className="py-24 space-y-16 manual-reveal">
          <SectionLabel>03 · Color System</SectionLabel>

          {/* V3 colors with creative names and WHY */}
          {isV3 && v3vis?.colors ? (
            <div className="space-y-8">
              {/* Large swatches row */}
              <div className="flex gap-3 md:gap-4">
                {v3vis.colors.map((color, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="h-24 md:h-36 rounded-xl md:rounded-2xl mb-3"
                      style={{ backgroundColor: color.hex }}
                    />
                    {onFieldSave ? (
                      <EditableField
                        value={color.hex || ''}
                        onSave={async (v) => {
                          const newColors = [...(v3vis.colors || [])];
                          newColors[i] = { ...newColors[i], hex: v };
                          await onFieldSave({
                            ...brand,
                            v3Visual: { ...v3vis, colors: newColors } as any,
                          });
                        }}
                        type="color"
                      />
                    ) : (
                      <p className="text-[8px] font-mono text-white/35 font-black uppercase mb-1">{color.hex}</p>
                    )}
                    <p className="text-[7px] uppercase tracking-[0.5em] text-white/20 font-black truncate">
                      {color.creative_name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Color WHY cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 manual-reveal">
                {v3vis.colors.map((color, i) => (
                  <div key={i} className="p-5 border border-white/[0.06] rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color.hex }} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">{color.creative_name}</p>
                        <p className="text-[7px] font-mono text-white/25">{color.hex}</p>
                      </div>
                    </div>
                    <p className="text-xs font-serif-elegant italic text-white/45 leading-relaxed">{color.why}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // V2 colors fallback
            <div className="space-y-10">
              {colorEntries.map((color, i) => {
                const colorKeys = ['primary', 'secondary', 'accent'] as const;
                const colorKey = colorKeys[i];
                return (
                  <div key={i} className="manual-reveal grid grid-cols-[120px_1fr] gap-8 items-start">
                    <div>
                      <div
                        className="aspect-square rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: color.hex }}
                        title="Click to edit color"
                      />
                      {onFieldSave && colorKey ? (
                        <EditableField
                          value={color.hex || ''}
                          onSave={async (v) => {
                            await onFieldSave({
                              ...brand,
                              colors: {
                                ...brand.colors,
                                [colorKey]: { ...brand.colors?.[colorKey], hex: v },
                              } as any,
                            });
                          }}
                          type="color"
                        />
                      ) : (
                        <p className="text-[8px] font-mono text-white/30 mt-2">{color.hex}</p>
                      )}
                    </div>
                    <div className="space-y-2 pt-2">
                      <p className="text-sm uppercase font-black tracking-[0.2em] text-white/70">{color.name || color.role}</p>
                      {(color as any).theory && (
                        <p className="text-xs font-serif-elegant italic text-white/45 leading-relaxed">{(color as any).theory}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <EducationCallout>
            Color is the fastest brand signal the human brain processes. 85% of purchasing decisions are influenced
            by color — and research shows people form a color impression of a brand within 90 seconds. Your color
            system isn't decoration: it's your brand's emotional frequency, scientifically chosen to signal exactly
            what your audience needs to feel.
          </EducationCallout>
        </section>

        <Divider />

        {/* ── TYPOGRAPHY ── */}
        <section className="py-24 space-y-16 manual-reveal">
          <SectionLabel>04 · Typography</SectionLabel>

          {brand.typography?.hierarchy?.headline && (
            <div className="space-y-10">
              {/* Headline font specimen */}
              <div>
                <SectionLabel>{brand.typography.hierarchy.headline.fontFamily} · Headline</SectionLabel>
                <div className="space-y-3">
                  {[
                    { size: 'clamp(3rem, 8vw, 5.5rem)', weight: 900, text: brand.name },
                    { size: 'clamp(1.8rem, 4vw, 3rem)', weight: 800, text: brand.voice?.tagline || 'The mark is the message.' },
                    { size: 'clamp(1.2rem, 2.5vw, 1.8rem)', weight: 700, text: brand.foundation?.archetype ? `${brand.foundation.archetype} · Brand Archetype` : 'Built with intent.' },
                  ].map((s, i) => (
                    <p
                      key={i}
                      className="text-white leading-tight"
                      style={{
                        fontFamily: brand.typography!.hierarchy.headline.fontFamily,
                        fontSize: s.size,
                        fontWeight: s.weight,
                        opacity: 0.9 - i * 0.2,
                      }}
                    >
                      {s.text}
                    </p>
                  ))}
                </div>
              </div>

              {/* Body font specimen */}
              {brand.typography.hierarchy.body && (
                <div className="pt-8 border-t border-white/[0.05]">
                  <SectionLabel>{brand.typography.hierarchy.body.fontFamily} · Body</SectionLabel>
                  <p
                    className="text-white/55 leading-[1.85] text-base md:text-lg max-w-2xl"
                    style={{ fontFamily: brand.typography.hierarchy.body.fontFamily }}
                  >
                    Every decision in this identity system has a reason. The typography carries the brand's character: not just what it says, but how it breathes on the page.
                  </p>
                </div>
              )}

              {/* Pairing rationale */}
              {(v3vis?.font_pairing_why || brand.typography.rationale_headline) && (
                <div className="p-5 border border-white/[0.07] rounded-xl manual-reveal">
                  <SectionLabel>Why This Pairing</SectionLabel>
                  <p className="text-sm font-serif-elegant italic text-white/50 leading-relaxed">
                    {v3vis?.font_pairing_why || brand.typography.rationale_headline}
                  </p>
                </div>
              )}
            </div>
          )}

          <EducationCallout>
            Typography carries 40% of a brand's personality signal before anyone reads a single word. The weight,
            rhythm, and spacing of your type tells people whether to trust you, aspire to you, or feel comfortable
            with you. Great type pairings create tension: a serif heading paired with a clean sans creates contrast
            — authority meets accessibility.
          </EducationCallout>
        </section>

        <Divider />

        {/* ── LOGO SYSTEM ── */}
        {(brand.logoSystem?.symbolOnlySvg || brand.logoSystem?.primaryLogoSvg) && (
          <section className="py-24 space-y-16 manual-reveal">
            <SectionLabel>05 · Logo System</SectionLabel>

            {/* Logo concept */}
            {isV3 && v3vis?.logo_concept ? (
              <div className="space-y-6 manual-reveal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {v3vis.logo_concept.metaphor && (
                    <div className="p-5 border border-white/[0.07] rounded-xl space-y-2">
                      <SectionLabel>Visual Metaphor</SectionLabel>
                      <p className="text-sm font-serif-elegant italic text-white/55 leading-relaxed">
                        {v3vis.logo_concept.metaphor}
                      </p>
                    </div>
                  )}
                  {v3vis.logo_concept.negative_space_idea && v3vis.logo_concept.negative_space_idea !== 'none' && (
                    <div className="p-5 border border-white/[0.07] rounded-xl space-y-2">
                      <SectionLabel>Negative Space</SectionLabel>
                      <p className="text-sm font-serif-elegant italic text-white/55 leading-relaxed">
                        {v3vis.logo_concept.negative_space_idea}
                      </p>
                    </div>
                  )}
                </div>
                {v3vis.logo_concept.concept_summary && (
                  <p
                    className="font-serif-display italic font-black text-white/70 leading-tight"
                    style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}
                  >
                    "{v3vis.logo_concept.concept_summary}"
                  </p>
                )}
              </div>
            ) : brand.logoSystem.logic ? (
              <NarrativeText>{brand.logoSystem.logic}</NarrativeText>
            ) : null}

            {/* DALL-E Logo Concepts — shown if available */}
            {brand.logoSystem.dalleLogos && brand.logoSystem.dalleLogos.length > 0 && (
              <div className="space-y-6 manual-reveal">
                <SectionLabel>Concept Explorations</SectionLabel>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4">Visual direction — not final marks. Your logo needs a human hand.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {brand.logoSystem.dalleLogos.map((logo: DalleLogo, i: number) => {
                    const isSelected = selectedDalleIdx === i;
                    return (
                      <div key={i} className="space-y-3">
                        <button
                          onClick={() => setSelectedDalleIdx(i)}
                          className="w-full aspect-square flex items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:border-white/20 focus:outline-none"
                          style={{
                            backgroundColor: '#141414',
                            borderColor: isSelected ? primaryHex : 'var(--border)',
                            boxShadow: isSelected ? `0 0 0 1px ${primaryHex}40` : 'none',
                          }}
                        >
                          <img
                            src={logo.imageData}
                            alt={`${brand.name} ${logo.style} logo`}
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '200px' }}
                          />
                        </button>
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[8px] uppercase tracking-[0.5em] text-white/25 font-black capitalize">
                            {logo.style}
                          </p>
                          <button
                            onClick={() => setSelectedDalleIdx(i)}
                            className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.3em] font-black transition-colors"
                            style={{ color: isSelected ? primaryHex : 'var(--text-subtle)' }}
                          >
                            <span
                              className="w-3 h-3 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: isSelected ? primaryHex : 'var(--text-subtle)' }}
                            >
                              {isSelected && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: primaryHex }}
                                />
                              )}
                            </span>
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Geometric SVG variants (always shown as reference / fallback) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 manual-reveal">
              {[
                { label: 'Symbol Mark', svg: brand.logoSystem.symbolOnlySvg },
                { label: 'Wordmark', svg: brand.logoSystem.wordmarkOnlySvg },
                { label: 'Combined Mark', svg: brand.logoSystem.primaryLogoSvg },
              ].filter(v => v.svg).map((variant, i) => (
                <div key={i} className="space-y-3">
                  <div
                    className="flex items-center justify-center p-8 border border-white/[0.07] rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '140px' }}
                  >
                    <LogoRenderer
                      svg={variant.svg!}
                      className="w-full h-20"
                      primaryColor={primaryHex}
                    />
                  </div>
                  <p className="text-[8px] uppercase tracking-[0.5em] text-white/25 font-black text-center">
                    {variant.label}
                  </p>
                </div>
              ))}
            </div>

            <EducationCallout>
              The most iconic logos are built on geometric principles — the Nike swoosh is a single line with one
              curve, the Apple logo is circles aligned by the golden ratio, the Mercedes star is three perfect lines
              at 120°. Geometry is why logos work at 8px and at 8 meters. Simple geometric construction isn't a
              limitation — it's how marks achieve permanence.
            </EducationCallout>
          </section>
        )}

        <Divider />

        {/* ── VOICE ── */}
        <section className="py-24 space-y-12 manual-reveal">
          <SectionLabel>06 · Voice</SectionLabel>

          {isV3 && v3i?.voice_examples ? (
            <div className="space-y-6">
              <p className="text-[9px] uppercase tracking-[0.7em] text-white/20 font-black">
                The brand speaking — not about itself, but from itself.
              </p>
              <div className="space-y-4">
                {v3i.voice_examples.map((example, i) => (
                  <div
                    key={i}
                    className="pl-6 border-l-2 py-1"
                    style={{ borderColor: primaryHex + '40' }}
                  >
                    <p className="font-serif-elegant italic text-white/65 text-base md:text-lg leading-relaxed">
                      "
                      {onFieldSave ? (
                        <EditableField
                          value={example}
                          onSave={async (v) => {
                            const newExamples = [...v3i.voice_examples!];
                            newExamples[i] = v;
                            await onFieldSave({
                              ...brand,
                              v3Integration: { ...v3i, voice_examples: newExamples } as any,
                            });
                          }}
                          type="textarea"
                        />
                      ) : example}
                      "
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {(v2v?.brand_voice?.example_copy || brand.voice?.verbalSignature) && (
                <NarrativeText>
                  {onFieldSave ? (
                    <EditableField
                      value={v2v?.brand_voice?.example_copy || brand.voice?.verbalSignature || ''}
                      onSave={async (v) => {
                        await onFieldSave({
                          ...brand,
                          voice: { ...(brand.voice || {}), verbalSignature: v } as any,
                        });
                      }}
                      type="textarea"
                    />
                  ) : (v2v?.brand_voice?.example_copy || brand.voice?.verbalSignature)}
                </NarrativeText>
              )}
              {brand.voice?.tone && (
                <div>
                  <SectionLabel>Tone</SectionLabel>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-white/55">{brand.voice.tone}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <Divider />

        {/* ── APPLICATIONS & GUIDELINES ── */}
        <section className="py-24 space-y-14 manual-reveal">
          <SectionLabel>07 · Applications & Guidelines</SectionLabel>

          {isV3 && v3i ? (
            <div className="space-y-12">
              {/* Applications */}
              {v3i.applications && v3i.applications.length > 0 && (
                <div className="space-y-4 manual-reveal">
                  <SectionLabel>How the Brand Shows Up</SectionLabel>
                  <div className="space-y-3">
                    {v3i.applications.map((app, i) => (
                      <div key={i} className="flex items-start gap-4 py-3 border-b border-white/[0.04]">
                        <span className="text-[8px] font-mono text-white/20 font-black mt-1 w-6 shrink-0">0{i + 1}</span>
                        <p className="text-sm font-serif-elegant italic text-white/55 leading-relaxed">{app}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Do's and Don'ts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 manual-reveal">
                {v3i.dos && v3i.dos.length > 0 && (
                  <div className="space-y-4">
                    <SectionLabel>Do</SectionLabel>
                    <div className="space-y-3">
                      {v3i.dos.map((d, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-green-400/60 text-xs font-black mt-0.5 shrink-0">✓</span>
                          <p className="text-sm text-white/55 leading-relaxed">{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {v3i.donts && v3i.donts.length > 0 && (
                  <div className="space-y-4">
                    <SectionLabel>Never</SectionLabel>
                    <div className="space-y-3">
                      {v3i.donts.map((d, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-red-400/60 text-xs font-black mt-0.5 shrink-0">✗</span>
                          <p className="text-sm text-white/55 leading-relaxed">{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : v2i ? (
            <div className="space-y-10">
              {v2i.application_scenarios && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {v2i.application_scenarios.slice(0, 4).map((a, i) => (
                    <div key={i} className="p-5 border border-white/[0.06] rounded-xl space-y-2">
                      <p className="text-[9px] uppercase tracking-[0.5em] font-black text-white/30">{a.context}</p>
                      <p className="text-xs font-serif-elegant italic text-white/45 leading-relaxed">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {v2i.brand_dos && v2i.brand_dos.length > 0 && (
                  <div className="space-y-3">
                    <SectionLabel>Do</SectionLabel>
                    {v2i.brand_dos.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-green-400/50 text-xs mt-0.5">✓</span>
                        <p className="text-xs text-white/50 leading-relaxed">{d}</p>
                      </div>
                    ))}
                  </div>
                )}
                {v2i.brand_donts && v2i.brand_donts.length > 0 && (
                  <div className="space-y-3">
                    <SectionLabel>Never</SectionLabel>
                    {v2i.brand_donts.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-red-400/50 text-xs mt-0.5">✗</span>
                        <p className="text-xs text-white/50 leading-relaxed">{d}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* ── APPLICATIONS (MOCKUPS) ── */}
        {brand.mockups && brand.mockups.length > 0 && (
          <>
            <Divider />
            <section className="py-24 space-y-12 manual-reveal">
              <div className="flex items-center">
                <SectionLabel>08 · Applications</SectionLabel>
                <span style={{ marginTop: '-24px', marginLeft: '8px' }}><OnlyBadge /></span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.7em] text-white/20 font-black">
                The brand in the real world — applied across physical and digital touchpoints.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 manual-reveal">
                {brand.mockups.map((mockup: Mockup, i: number) => {
                  const labels: Record<string, string> = {
                    business_card: 'Business Card',
                    letterhead: 'Letterhead',
                    phone_screen: 'Phone App',
                    tshirt: 'Apparel',
                  };
                  return (
                    <div key={i} className="space-y-3">
                      <div
                        className="overflow-hidden rounded-2xl border border-white/[0.07] flex items-center justify-center p-4"
                        style={{ backgroundColor: '#141414', minHeight: '180px' }}
                      >
                        <div
                          className="w-full"
                          dangerouslySetInnerHTML={{ __html: mockup.svg }}
                          style={{ lineHeight: 0 }}
                        />
                      </div>
                      <p className="text-[8px] uppercase tracking-[0.6em] text-white/25 font-black text-center">
                        {labels[mockup.type] || mockup.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ── SOCIAL MEDIA TEMPLATES ── */}
        {brand.socialTemplates && brand.socialTemplates.length > 0 && (
          <>
            <Divider />
            <section className="py-24 space-y-12 manual-reveal">
              <div className="flex items-center">
                <SectionLabel>09 · Social Media</SectionLabel>
                <span style={{ marginTop: '-24px', marginLeft: '8px' }}><OnlyBadge /></span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.7em] text-white/20 font-black">
                Ready-to-use templates — brand applied to the platforms where audiences live.
              </p>
              <div className="space-y-6 manual-reveal">
                {brand.socialTemplates.map((tmpl: Mockup, i: number) => {
                  const labels: Record<string, string> = {
                    instagram_post: 'Instagram Post · 1:1 Square',
                    linkedin_banner: 'LinkedIn Banner · 4:1 Wide',
                    email_signature: 'Email Signature',
                  };
                  return (
                    <div key={i} className="space-y-3">
                      <div
                        className="overflow-hidden rounded-2xl border border-white/[0.07] flex items-center justify-center p-4"
                        style={{ backgroundColor: '#141414' }}
                      >
                        <div
                          className="w-full"
                          dangerouslySetInnerHTML={{ __html: tmpl.svg }}
                          style={{ lineHeight: 0 }}
                        />
                      </div>
                      <p className="text-[8px] uppercase tracking-[0.6em] text-white/25 font-black text-center">
                        {labels[tmpl.type] || tmpl.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="py-16 border-t border-white/[0.04] flex justify-between items-center text-white/15 text-xs">
          <span className="font-mono">{brand.uid || 'HI-XXXXXX'}</span>
          <span className="font-serif-elegant italic">HowIconic · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
};

// ─── REFINE PANEL ─────────────────────────────────────────────────────────────

interface RefinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  isRefining: boolean;
  error: string;
  refinementCount: number;
}

const RefinePanel: React.FC<RefinePanelProps> = ({ isOpen, onClose, onSubmit, isRefining, error, refinementCount }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || isRefining) return;
    onSubmit(feedback.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[200] backdrop-blur-xl px-6 md:px-12 py-6" style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--border)' }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.6em] font-black text-brand-primary/70">Refine Brand</p>
                {refinementCount > 0 && (
                  <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-0.5">
                    {refinementCount} refinement{refinementCount !== 1 ? 's' : ''} applied
                  </p>
                )}
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white transition-all text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="What would you change? e.g., make it warmer, try a sportier name, darker colors"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 text-sm font-serif-elegant italic"
                disabled={isRefining}
                autoFocus
              />
              <button
                type="submit"
                disabled={isRefining || !feedback.trim()}
                className={`px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-[0.3em] border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all cursor-pointer ${
                  isRefining ? 'opacity-40 cursor-wait' : ''
                }`}
              >
                {isRefining ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin inline-block" />
                    Refining
                  </span>
                ) : 'Apply'}
              </button>
            </form>
            {error && (
              <p className="text-red-400/70 text-xs font-serif-elegant italic mt-3">{error}</p>
            )}
            <p className="text-[8px] uppercase tracking-[0.5em] text-white/12 font-black mt-3">
              AI will modify only what you asked · keep everything else intact
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── BRAND MANUAL WRAPPER ─────────────────────────────────────────────────────

interface BrandManualProps {
  brand: BrandSystem;
  onBack: () => void;
  onBrandUpdate?: (brand: BrandSystem) => void;
}

// Print styles injected globally
const PRINT_STYLES = `
@media print {
  /* Hide interactive chrome */
  .no-print, nav, button, [data-no-print] { display: none !important; }

  /* Page setup */
  @page { margin: 15mm 12mm; size: A4; }

  /* Force color printing */
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Remove overlays */
  .noise-overlay, .blueprint-grid-overlay { display: none !important; }

  /* Light background for readability */
  body { background: #0a0a0a !important; }

  /* Page break rules */
  section { page-break-inside: avoid; }
  .manual-reveal { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }

  /* Sticky nav should not print */
  .sticky { position: relative !important; }

  /* Full width for print */
  .max-w-\\[1000px\\], .max-w-4xl { max-width: 100% !important; }

  /* Ensure text is readable */
  .text-white\\/55, .text-white\\/60, .text-white\\/65 { opacity: 0.8 !important; }
}
`;

const BrandManual: React.FC<BrandManualProps> = ({ brand: initialBrand, onBack, onBrandUpdate }) => {
  const [view, setView] = useState<'card' | 'full'>(initialBrand.isV3 ? 'card' : 'full');
  const [currentBrand, setCurrentBrand] = useState<BrandSystem>(initialBrand);
  const [refineOpen, setRefineOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState('');

  // Keep local brand in sync if parent updates it
  useEffect(() => { setCurrentBrand(initialBrand); }, [initialBrand]);

  // Generic field save — deep-merges the update into brand_data and patches API
  const handleFieldSave = useCallback(async (updatedBrand: BrandSystem) => {
    const id = updatedBrand.id || updatedBrand.uid;
    if (!id) return;
    try {
      await api.patchBrand(id as any, {
        name: updatedBrand.name,
        brand_data: updatedBrand,
      });
    } catch (e) {
      // patch failed silently
    }
    setCurrentBrand(updatedBrand);
    onBrandUpdate?.(updatedBrand);
  }, [onBrandUpdate]);

  // Inject print styles
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'howiconic-print-styles';
    styleEl.textContent = PRINT_STYLES;
    document.head.appendChild(styleEl);
    return () => { document.getElementById('howiconic-print-styles')?.remove(); };
  }, []);

  const handleRefine = async (feedback: string) => {
    setIsRefining(true);
    setRefineError('');
    try {
      const result = await api.refineBrand(
        currentBrand.uid || String(currentBrand.id || ''),
        currentBrand,
        feedback
      );
      if (result?.brand) {
        const refined: BrandSystem = {
          ...currentBrand,
          ...result.brand,
          uid: currentBrand.uid,
          id: currentBrand.id,
          timestamp: Date.now(),
          refinement_count: (currentBrand.refinement_count || 0) + 1,
          // Preserve logo system SVGs in case AI stripped them
          logoSystem: result.brand.logoSystem?.primaryLogoSvg?.includes('<svg')
            ? result.brand.logoSystem
            : currentBrand.logoSystem,
        };
        setCurrentBrand(refined);
        onBrandUpdate?.(refined);
        setRefineOpen(false);
      }
    } catch (e: any) {
      setRefineError(e.message || 'Refinement failed. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <>
      {view === 'card' ? (
        <BrandCard
          brand={currentBrand}
          onExplore={() => { setView('full'); window.scrollTo(0, 0); }}
          onBack={onBack}
          onOpenRefine={() => setRefineOpen(true)}
        />
      ) : (
        <FullSystem
          brand={currentBrand}
          onBack={onBack}
          onCard={currentBrand.isV3 ? () => { setView('card'); window.scrollTo(0, 0); } : onBack}
          onOpenRefine={() => setRefineOpen(true)}
          onFieldSave={handleFieldSave}
        />
      )}

      <RefinePanel
        isOpen={refineOpen}
        onClose={() => { setRefineOpen(false); setRefineError(''); }}
        onSubmit={handleRefine}
        isRefining={isRefining}
        error={refineError}
        refinementCount={currentBrand.refinement_count || 0}
      />
    </>
  );
};

export default BrandManual;
