import React from 'react';
import { motion } from 'framer-motion';
import { BrandSystem } from '../types';
import LogoRenderer from './LogoRenderer';

interface CompareViewProps {
  brandA: BrandSystem;
  brandB: BrandSystem;
  onBack: () => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[7px] uppercase tracking-[0.9em] font-black text-white/25 mb-3">{children}</p>
);

const ColorSwatch: React.FC<{ hex: string; name?: string }> = ({ hex, name }) => (
  <div className="flex items-center gap-2">
    <div
      className="w-8 h-8 rounded-lg flex-shrink-0"
      style={{ backgroundColor: hex }}
    />
    <div>
      <p className="text-[8px] font-mono text-white/40 font-black">{hex}</p>
      {name && <p className="text-[7px] uppercase tracking-widest text-white/20 font-black truncate max-w-[80px]">{name}</p>}
    </div>
  </div>
);

const BrandColumn: React.FC<{ brand: BrandSystem; side: 'left' | 'right' }> = ({ brand, side }) => {
  const primaryHex = brand.colors?.primary?.hex || '#f17022';
  const secondaryHex = brand.colors?.secondary?.hex || '#2a2a2a';
  const accentHex = brand.colors?.accent?.hex || '#f5f5f5';
  const headlineFont = brand.typography?.hierarchy?.headline?.fontFamily || 'Playfair Display';
  const bodyFont = brand.typography?.hierarchy?.body?.fontFamily || 'Inter';

  const archetype =
    (brand.v3Strategy as any)?.archetype ||
    (brand.v2Strategy as any)?.archetype ||
    brand.foundation?.archetype || '';

  const colors = [
    { hex: primaryHex, name: brand.colors?.primary?.name },
    { hex: secondaryHex, name: brand.colors?.secondary?.name },
    { hex: accentHex, name: brand.colors?.accent?.name },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 min-w-0 space-y-8 p-6 md:p-8 border border-white/[0.07] rounded-2xl bg-white/[0.01] compare-column"
    >
      {/* Logo */}
      <div
        className="w-full aspect-square max-w-[160px] mx-auto flex items-center justify-center rounded-2xl p-6"
        style={{ backgroundColor: brand.colors?.canvasColor || '#0a0a0a' }}
      >
        {brand.logoSystem?.dalleLogos && brand.logoSystem.dalleLogos.length > 0 ? (
          <img
            src={brand.logoSystem.dalleLogos[0].imageData}
            alt={brand.name}
            className="w-full h-full object-contain"
          />
        ) : brand.logoSystem?.symbolOnlySvg ? (
          <LogoRenderer
            svg={brand.logoSystem.symbolOnlySvg}
            className="w-full h-full"
            primaryColor={primaryHex}
          />
        ) : (
          <p
            className="text-4xl font-black font-serif-display"
            style={{ color: primaryHex }}
          >
            {brand.name?.substring(0, 2).toUpperCase()}
          </p>
        )}
      </div>

      {/* Brand Name */}
      <div>
        <h2
          className="font-serif-display uppercase font-black leading-none tracking-tighter"
          style={{
            color: primaryHex,
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          }}
        >
          {brand.name}
        </h2>
        {brand.voice?.tagline && (
          <p className="mt-2 font-serif-elegant italic text-white/45 text-sm leading-relaxed">
            "{brand.voice.tagline}"
          </p>
        )}
        {archetype && (
          <span
            className="inline-block mt-3 text-[8px] uppercase tracking-[0.4em] font-black px-3 py-1 border rounded-full"
            style={{ borderColor: primaryHex + '40', color: primaryHex }}
          >
            {archetype}
          </span>
        )}
      </div>

      {/* Colors */}
      <div>
        <SectionLabel>Colors</SectionLabel>
        <div className="space-y-2">
          {colors.map((c, i) => (
            <ColorSwatch key={i} hex={c.hex} name={c.name} />
          ))}
        </div>
        {/* Color bar */}
        <div className="flex mt-3 h-2 rounded-full overflow-hidden">
          <div className="flex-1" style={{ backgroundColor: primaryHex }} />
          <div className="flex-1" style={{ backgroundColor: secondaryHex }} />
          <div className="flex-1" style={{ backgroundColor: accentHex }} />
        </div>
      </div>

      {/* Typography */}
      <div>
        <SectionLabel>Typography</SectionLabel>
        <div className="space-y-3">
          <div>
            <p
              className="font-black leading-tight"
              style={{ fontFamily: headlineFont, color: primaryHex, fontSize: '1.4rem' }}
            >
              {brand.name}
            </p>
            <p className="text-[7px] uppercase tracking-widest text-white/20 font-black mt-0.5">{headlineFont}</p>
          </div>
          <div>
            <p
              className="text-white/50 text-sm leading-relaxed"
              style={{ fontFamily: bodyFont }}
            >
              Every detail deliberate.
            </p>
            <p className="text-[7px] uppercase tracking-widest text-white/20 font-black mt-0.5">{bodyFont}</p>
          </div>
        </div>
      </div>

      {/* Brand Story snippet */}
      {brand.foundation?.story || (brand.v3Integration as any)?.story?.[0] ? (
        <div>
          <SectionLabel>Story</SectionLabel>
          <p className="text-xs font-serif-elegant italic text-white/40 leading-relaxed line-clamp-3">
            {(brand.v3Integration as any)?.story?.[0] || brand.foundation?.story}
          </p>
        </div>
      ) : null}

      {/* Vibe tag */}
      {brand.sense && (
        <div>
          <SectionLabel>Vibe</SectionLabel>
          <span
            className="text-[8px] uppercase tracking-[0.5em] font-black text-white/40 border border-white/10 px-3 py-1.5 rounded-full"
          >
            {brand.sense}
          </span>
        </div>
      )}
    </motion.div>
  );
};

const CompareView: React.FC<CompareViewProps> = ({ brandA, brandB, onBack }) => {
  const primaryA = brandA.colors?.primary?.hex || '#f17022';
  const primaryB = brandB.colors?.primary?.hex || '#f17022';

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <div className="sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between bg-black/85 backdrop-blur-xl border-b border-white/[0.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-black text-white/35 hover:text-white transition-all cursor-pointer group"
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          Back to Vault
        </button>
        <p className="text-[9px] uppercase tracking-[0.5em] font-black text-white/20">
          Brand Comparison
        </p>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-[8px] uppercase tracking-[1em] font-black text-white/15 mb-4">HowIconic · Compare</p>
          <div className="flex items-center justify-center gap-6">
            <span
              className="text-2xl md:text-3xl font-serif-display uppercase font-black"
              style={{ color: primaryA }}
            >
              {brandA.name}
            </span>
            <span className="text-white/15 text-xl font-black">vs</span>
            <span
              className="text-2xl md:text-3xl font-serif-display uppercase font-black"
              style={{ color: primaryB }}
            >
              {brandB.name}
            </span>
          </div>
        </div>

        {/* Side by side columns */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <BrandColumn brand={brandA} side="left" />

          {/* Divider */}
          <div className="hidden md:flex flex-col items-center justify-center gap-2 flex-shrink-0">
            <div className="w-[1px] flex-1 bg-white/[0.05]" />
            <span className="text-[8px] uppercase tracking-[0.4em] font-black text-white/15 rotate-90 md:rotate-0 my-4">vs</span>
            <div className="w-[1px] flex-1 bg-white/[0.05]" />
          </div>

          <BrandColumn brand={brandB} side="right" />
        </div>

        {/* Color palette comparison bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 p-6 border border-white/[0.06] rounded-2xl space-y-4"
        >
          <p className="text-[8px] uppercase tracking-[0.8em] font-black text-white/20">Color Palette Comparison</p>
          <div className="space-y-3">
            <div>
              <p className="text-[7px] uppercase tracking-widest text-white/20 font-black mb-1">{brandA.name}</p>
              <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
                <div className="flex-1 rounded-l-lg" style={{ backgroundColor: brandA.colors?.primary?.hex }} />
                <div className="flex-1" style={{ backgroundColor: brandA.colors?.secondary?.hex }} />
                <div className="flex-1 rounded-r-lg" style={{ backgroundColor: brandA.colors?.accent?.hex }} />
              </div>
            </div>
            <div>
              <p className="text-[7px] uppercase tracking-widest text-white/20 font-black mb-1">{brandB.name}</p>
              <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
                <div className="flex-1 rounded-l-lg" style={{ backgroundColor: brandB.colors?.primary?.hex }} />
                <div className="flex-1" style={{ backgroundColor: brandB.colors?.secondary?.hex }} />
                <div className="flex-1 rounded-r-lg" style={{ backgroundColor: brandB.colors?.accent?.hex }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-[8px] uppercase tracking-[0.6em] font-black text-white/10 mt-12">
          HowIconic · Brand Comparison View
        </p>
      </div>
    </div>
  );
};

export default CompareView;
