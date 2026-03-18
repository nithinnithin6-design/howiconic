import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import KeeAlive from './KeeAlive';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STEP_NAMES = ['Strategy', 'Naming', 'Colors', 'Typography', 'Logo', 'Voice', 'Assembly'];

const STEP_GUIDE_FALLBACK: Record<number, string> = {
  1: 'Strategy is the foundation. Everything else grows from what you choose here.',
  2: 'A name is the first thing people hear. Choose the one that feels like yours.',
  3: 'Color is emotion before language. Trust your instinct.',
  4: 'Typography carries your voice before anyone reads a word.',
  5: 'Your mark is how the world recognizes you at a glance.',
  6: 'Voice is how your brand speaks when you\'re not in the room.',
  7: 'Every choice you\'ve made, assembled into one coherent system. This is your brand.',
};

// Fetch AI guide message (non-blocking, falls back gracefully)
async function fetchGuideMessage(params: {
  step: number;
  stepName: string;
  inputs?: any;
  selections?: any;
  options?: any;
  action: 'welcome' | 'entering_step' | 'selected_option' | 'going_back';
  selectedIdx?: number;
}): Promise<string> {
  try {
    const res = await api.guideMessage({
      step: params.step,
      step_name: params.stepName,
      inputs: params.inputs,
      selections: params.selections,
      options: params.options,
      action: params.action,
      selected_idx: params.selectedIdx,
    });
    return res.message || STEP_GUIDE_FALLBACK[params.step] || '';
  } catch {
    return STEP_GUIDE_FALLBACK[params.step] || '';
  }
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const KeeMessage = ({ children, loading }: { children: React.ReactNode; loading?: boolean }) => (
  <div style={{
    background: 'rgba(241,112,34,0.04)',
    borderLeft: '3px solid #f17022',
    borderRadius: '0 12px 12px 0',
    padding: '16px 20px 18px',
    margin: '16px 0 24px',
  }}>
    <p style={{
      fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
      color: '#f17022', margin: '0 0 8px',
    }}>Kee</p>
    {loading ? (
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--text-subtle)', margin: 0 }}>
        <span style={{ animation: 'keePulse 1.5s ease-in-out infinite' }}>· · ·</span>
      </p>
    ) : (
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
        {children}
      </p>
    )}
    <style>{`@keyframes keePulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }`}</style>
  </div>
);

// Keep backward compat
const GuideText = ({ children }: { children: React.ReactNode }) => <KeeMessage>{children}</KeeMessage>;

const ParijataSpinner = () => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <svg viewBox="0 0 100 100" fill="none" style={{ width: 60, height: 60, margin: '0 auto 24px', animation: 'gentleSpin 4s linear infinite' }}>
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
        <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.7} transform={`rotate(${angle} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="8" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px rgba(241,112,34,0.5))' }} />
      <circle cx="50" cy="50" r="3" fill="white" opacity="0.7" />
    </svg>
    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--text-subtle)' }}>
      Kee is thinking...
    </p>
    <style>{`@keyframes gentleSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

const HeartIcon = ({ filled, onClick }: { filled: boolean; onClick: (e: React.MouseEvent) => void }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute', top: 12, right: 12,
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 18, padding: 4, lineHeight: 1,
      color: filled ? '#f17022' : 'var(--text-subtle)',
      transition: 'color 0.2s ease, transform 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    title={filled ? 'Remove from wishlist' : 'Add to wishlist'}
  >
    {filled ? '♥' : '♡'}
  </button>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

const ProgressBar = ({ currentStep, completedSteps }: { currentStep: number; completedSteps: number }) => (
  <div style={{ padding: '24px 16px', maxWidth: 640, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', gap: 8 }}>
      {/* Connecting line */}
      <div style={{
        position: 'absolute', top: 10, left: 20, right: 20, height: 2,
        background: 'var(--border)',
      }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, #fff, #f17022)',
          width: `${Math.max(0, (completedSteps - 1) / 6 * 100)}%`,
          transition: 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }} />
      </div>

      {STEP_NAMES.map((name, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isFuture = stepNum > currentStep;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, minWidth: 64 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${isFuture ? 'var(--border)' : isCurrent ? '#f17022' : 'var(--text)'}`,
              background: isCompleted ? 'var(--text)' : isCurrent ? '#f17022' : 'transparent',
              transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isCompleted && <span style={{ fontSize: 10, color: 'var(--bg)' }}>✓</span>}
            </div>
            <span style={{
              marginTop: 8, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              color: isCurrent ? '#f17022' : isFuture ? 'var(--text-subtle)' : 'var(--text-muted)',
              textAlign: 'center',
            }} className="step-label">{name}</span>
          </div>
        );
      })}
    </div>
    <style>{`
      .step-label { display: none; }
      @media (min-width: 640px) { .step-label { display: block !important; } }
    `}</style>
  </div>
);

// ─── CARD RENDERERS ───────────────────────────────────────────────────────────

interface CardProps {
  option: any;
  index: number;
  selected: boolean;
  wishlisted: boolean;
  onSelect: () => void;
  onWishlist: (e: React.MouseEvent) => void;
}

const cardStyle = (selected: boolean): React.CSSProperties => ({
  position: 'relative',
  background: selected ? 'rgba(241,112,34,0.06)' : 'var(--bg-secondary)',
  border: `${selected ? '2px' : '1px'} solid ${selected ? '#f17022' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 16,
  padding: '28px 24px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: selected
    ? '0 0 0 0 rgba(241,112,34,0), 0 0 30px rgba(241,112,34,0.15), inset 0 0 30px rgba(241,112,34,0.03)'
    : 'none',
  flex: 1, minWidth: 260,
  animation: selected ? 'selectionRipple 0.6s ease-out forwards' : undefined,
});

const SelectedCheck = () => (
  <div style={{
    position: 'absolute', top: -8, left: -8,
    width: 24, height: 24, borderRadius: '50%',
    background: '#f17022', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(241,112,34,0.4)',
    zIndex: 2,
  }}>
    <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>
  </div>
);

const StrategyCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div className={selected ? '' : 'card-hover'} style={cardStyle(selected)} onClick={onSelect}>
    {selected && <SelectedCheck />}
    <HeartIcon filled={wishlisted} onClick={onWishlist} />
    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#f17022', marginBottom: 16 }}>
      {option.archetype}
    </p>
    <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 12, lineHeight: 1.3, paddingRight: 24 }}>
      {option.positioning}
    </h3>
    {option.archetype_why && (
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.6, marginBottom: 12 }}>
        {option.archetype_why}
      </p>
    )}
    {option.brand_tensions && (
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Tensions</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{option.brand_tensions}</p>
      </div>
    )}
    {option.whitespace && (
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Whitespace</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{option.whitespace}</p>
      </div>
    )}
  </div>
);

const NamingCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div className={selected ? '' : 'card-hover'} style={cardStyle(selected)} onClick={onSelect}>
    {selected && <SelectedCheck />}
    <HeartIcon filled={wishlisted} onClick={onWishlist} />
    <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 8, lineHeight: 1.1, paddingRight: 24 }}>
      {option.name}
    </h3>
    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>
      {option.meaning}
    </p>
    {option.origin && (
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 12 }}>
        Origin: {option.origin}
      </p>
    )}
    {option.tagline && (
      <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 12 }}>
        "{option.tagline}"
      </p>
    )}
    {option.domain_available !== undefined && (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: option.domain_available ? '#22c55e' : '#ef4444',
        padding: '4px 10px', borderRadius: 100,
        border: `1px solid ${option.domain_available ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}>
        {option.domain_available ? '✓' : '✗'} .com {option.domain_available ? 'available' : 'taken'}
      </span>
    )}
  </div>
);

const ColorCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => {
  const colors = option.colors || option.palette || [];
  const primary = colors[0];
  const secondary = colors[1];
  const accent = colors[2];
  const getHex = (c: any) => typeof c === 'string' ? c : c?.hex || '#888';
  const getName = (c: any) => typeof c === 'string' ? c : c?.creative_name || c?.name || c?.hex || '';

  return (
    <div className={selected ? '' : 'card-hover'} style={cardStyle(selected)} onClick={onSelect}>
      {selected && <SelectedCheck />}
      <HeartIcon filled={wishlisted} onClick={onWishlist} />
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 16, paddingRight: 24 }}>
        {option.palette_name || option.name || 'Palette'}
      </p>

      {/* Primary color — full-width hero swatch */}
      {primary && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ width: '100%', height: 80, borderRadius: 12, background: getHex(primary), marginBottom: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{getName(primary)}</p>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{getHex(primary)}</p>
          </div>
        </div>
      )}

      {/* Secondary + Accent side by side */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {secondary && (
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: 48, borderRadius: 10, background: getHex(secondary), marginBottom: 4 }} />
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{getName(secondary)}</p>
            <p style={{ fontSize: 9, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{getHex(secondary)}</p>
          </div>
        )}
        {accent && (
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: 48, borderRadius: 10, background: getHex(accent), marginBottom: 4 }} />
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{getName(accent)}</p>
            <p style={{ fontSize: 9, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{getHex(accent)}</p>
          </div>
        )}
      </div>

      {/* Mini brand preview card */}
      {primary && (
        <div style={{
          background: getHex(primary), borderRadius: 10, padding: '14px 16px',
          marginBottom: 12,
        }}>
          <p style={{
            fontSize: 14, fontWeight: 800, letterSpacing: '0.1em',
            color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            margin: 0,
          }}>Brand Preview</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>
            How your brand feels in color
          </p>
        </div>
      )}

      {option.mood && (
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>{option.mood}</p>
      )}
      {option.contrast_note && (
        <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 6 }}>{option.contrast_note}</p>
      )}
    </div>
  );
};

const TypographyCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => {
  useEffect(() => {
    const fonts = [option.headline_font || option.heading_font, option.body_font].filter(Boolean);
    fonts.forEach(font => {
      const id = `gfont-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;700;900&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [option.headline_font, option.heading_font, option.body_font]);

  const headingFont = option.headline_font || option.heading_font || 'serif';
  const bodyFont = option.body_font || 'sans-serif';

  return (
    <div className={selected ? '' : 'card-hover'} style={cardStyle(selected)} onClick={onSelect}>
      {selected && <SelectedCheck />}
      <HeartIcon filled={wishlisted} onClick={onWishlist} />
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 20, paddingRight: 24 }}>
        {option.pairing_name || option.name || 'Type System'}
      </p>

      {/* Heading font — large showcase */}
      <div style={{ marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <p style={{
          fontFamily: `'${headingFont}', serif`,
          fontSize: 36, fontWeight: 900, color: 'var(--text)',
          lineHeight: 1.1, marginBottom: 8,
        }}>
          {option.sample_headline || 'Your Brand'}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'Inter, sans-serif' }}>
          {headingFont} · {option.headline_weight || 'Bold'}
        </p>
      </div>

      {/* Body font — paragraph showcase */}
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontFamily: `'${bodyFont}', sans-serif`,
          fontSize: 14, color: 'var(--text-muted)',
          lineHeight: 1.7, marginBottom: 8,
        }}>
          {option.sample_body || 'The quick brown fox jumps over the lazy dog. Typography carries your voice before anyone reads a word.'}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'Inter, sans-serif' }}>
          {bodyFont} · {option.body_weight || 'Regular'}
        </p>
      </div>

      {option.pairing_why && (
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {option.pairing_why}
        </p>
      )}
    </div>
  );
};

const LogoCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div className={selected ? '' : 'card-hover'} style={cardStyle(selected)} onClick={onSelect}>
    {selected && <SelectedCheck />}
    <HeartIcon filled={wishlisted} onClick={onWishlist} />

    {/* Render the SVG logo */}
    {option.combined_svg ? (
      <div style={{
        textAlign: 'center', marginBottom: 20, padding: '20px 0',
        background: 'rgba(255,255,255,0.02)', borderRadius: 12,
      }} dangerouslySetInnerHTML={{ __html: option.combined_svg }} />
    ) : option.symbol_svg ? (
      <div style={{
        textAlign: 'center', marginBottom: 20, padding: '20px 0',
        background: 'rgba(255,255,255,0.02)', borderRadius: 12,
      }} dangerouslySetInnerHTML={{ __html: option.symbol_svg }} />
    ) : null}

    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f17022', marginBottom: 8, paddingRight: 24 }}>
      {option.concept_name || option.name}
    </p>
    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
      {option.concept_summary || option.concept}
    </p>
    {option.metaphor && (
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
        Metaphor: {option.metaphor}
      </p>
    )}
  </div>
);

const VoiceCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => {
  // Support both old field names (tone/personality) and new ones (tone_description/tone_attributes)
  const toneText = option.tone_description || option.tone || '';
  const toneAttrs: string[] = option.tone_attributes || (option.personality ? [option.personality] : []);
  const sampleCopy = option.sample_copy || {};
  const tagline = sampleCopy.tagline || option.sample_tagline || '';
  const socialPost = sampleCopy.social_post || option.sample_social || '';
  const emailSubject = sampleCopy.email_subject || option.sample_email || '';
  const headline = sampleCopy.headline || '';

  return (
    <div className={selected ? '' : 'card-hover'} style={cardStyle(selected)} onClick={onSelect}>
      {selected && <SelectedCheck />}
      <HeartIcon filled={wishlisted} onClick={onWishlist} />
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f17022', marginBottom: 8, paddingRight: 24 }}>
        {option.voice_name}
      </p>
      {toneText && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          {toneText}
        </p>
      )}
      {toneAttrs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {toneAttrs.map((attr: string, i: number) => (
            <span key={i} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 100,
              border: '1px solid var(--border)',
            }}>{attr}</span>
          ))}
        </div>
      )}
      {tagline && (
        <p style={{ fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'var(--text)', marginBottom: 16, lineHeight: 1.5 }}>
          "{tagline}"
        </p>
      )}
      {headline && (
        <div style={{ background: 'var(--card-bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Headline</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>{headline}</p>
        </div>
      )}
      {socialPost && (
        <div style={{ background: 'var(--card-bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Social post</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{socialPost}</p>
        </div>
      )}
      {emailSubject && (
        <div style={{ background: 'var(--card-bg)', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Email subject</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{emailSubject}</p>
        </div>
      )}
    </div>
  );
};

// ─── ASSEMBLY VIEW ────────────────────────────────────────────────────────────

const AssemblyView = ({ state, brandId }: { state: any; brandId: number | null }) => {
  if (!state?.steps) return null;

  // Extract assembly options (step 7) which contains AI-generated summary + mockups
  const assemblyOptions = (() => {
    const step7 = state.steps?.find((s: any) => s.step_number === 7);
    if (!step7?.options) return null;
    try {
      const opts = typeof step7.options === 'string' ? JSON.parse(step7.options) : step7.options;
      return Array.isArray(opts) ? opts[0] : opts;
    } catch { return null; }
  })();

  const getSelected = (stepNum: number) => {
    const step = state.steps.find((s: any) => s.step_number === stepNum);
    if (!step || step.selected_index === null || step.selected_index === undefined) return null;
    try {
      const options = typeof step.options === 'string' ? JSON.parse(step.options) : step.options;
      return Array.isArray(options) ? options[step.selected_index] : null;
    } catch { return null; }
  };

  const strategy = getSelected(1);
  const naming = getSelected(2);
  const colors = getSelected(3);
  const typography = getSelected(4);
  const logo = getSelected(5);
  const voice = getSelected(6);

  const getHex = (c: any) => typeof c === 'string' ? c : c?.hex || '#888';
  const colorsList = colors?.colors || [];
  const headingFont = typography?.headline_font || typography?.heading_font || 'Playfair Display';
  const bodyFont = typography?.body_font || 'Inter';

  // Load fonts
  useEffect(() => {
    [headingFont, bodyFont].forEach(font => {
      const id = `gfont-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;700;900&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [headingFont, bodyFont]);

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)', borderRadius: 16, padding: '28px 24px', marginBottom: 16,
    border: '1px solid var(--border)',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase',
    color: '#f17022', marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Brand Name Hero */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <p style={labelStyle}>Your Brand</p>
        {naming && (
          <>
            <h2 style={{
              fontFamily: `'${headingFont}', serif`,
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: 900, color: 'var(--text)',
              lineHeight: 1.1, margin: '0 0 12px',
            }}>
              {naming.name}
            </h2>
            {voice?.sample_copy?.tagline && (
              <p style={{
                fontFamily: `'${bodyFont}', sans-serif`,
                fontSize: 16, color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}>
                "{voice.sample_copy.tagline}"
              </p>
            )}
          </>
        )}
      </div>

      {/* Color Palette Strip */}
      {colorsList.length > 0 && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Color System</p>
          <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', height: 80, marginBottom: 16 }}>
            {colorsList.map((c: any, i: number) => (
              <div key={i} style={{ flex: i === 0 ? 2 : 1, background: getHex(c) }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {colorsList.map((c: any, i: number) => (
              <div key={i} style={{ flex: i === 0 ? 2 : 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {typeof c === 'string' ? c : c?.creative_name || c?.name || ''}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                  {getHex(c)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography Pairing */}
      {typography && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Typography</p>
          <p style={{
            fontFamily: `'${headingFont}', serif`,
            fontSize: 28, fontWeight: 900, color: 'var(--text)',
            lineHeight: 1.2, marginBottom: 8,
          }}>
            {naming?.name || 'Brand Name'}
          </p>
          <p style={{
            fontFamily: `'${bodyFont}', sans-serif`,
            fontSize: 14, color: 'var(--text-muted)',
            lineHeight: 1.7, marginBottom: 12,
          }}>
            {typography.sample_body || 'Your brand speaks with clarity and intention. Every word carries weight.'}
          </p>
          <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Heading: {headingFont}</p>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Body: {bodyFont}</p>
          </div>
        </div>
      )}

      {/* Strategy */}
      {strategy && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Strategy</p>
          <p style={{
            fontFamily: `'${headingFont}', serif`, fontSize: 20, fontWeight: 900,
            color: '#f17022', marginBottom: 8,
          }}>
            The {strategy.archetype}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {strategy.positioning}
          </p>
          {strategy.promise && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
              Promise: {strategy.promise}
            </p>
          )}
        </div>
      )}

      {/* Logo Concept */}
      {logo && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Logo Concept</p>
          {logo.combined_svg && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}
              dangerouslySetInnerHTML={{ __html: logo.combined_svg }}
            />
          )}
          {!logo.combined_svg && logo.symbol_svg && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}
              dangerouslySetInnerHTML={{ __html: logo.symbol_svg }}
            />
          )}
          <p style={{ fontFamily: `'${headingFont}', serif`, fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
            {logo.concept_name || logo.name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {logo.concept_summary || logo.concept}
          </p>
        </div>
      )}

      {/* Voice */}
      {voice && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Brand Voice</p>
          <p style={{ fontFamily: `'${headingFont}', serif`, fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>
            {voice.voice_name}
          </p>
          {voice.sample_copy?.headline && (
            <div style={{ background: 'rgba(241,112,34,0.04)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontFamily: `'${headingFont}', serif`, fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                "{voice.sample_copy.headline}"
              </p>
            </div>
          )}
          {voice.tone_attributes && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {voice.tone_attributes.map((attr: string, i: number) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 100,
                  border: '1px solid var(--border)',
                }}>
                  {attr}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mockups Preview */}
      {assemblyOptions?.mockups && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Brand Applications</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {assemblyOptions.mockups.business_card && (
              <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <div dangerouslySetInnerHTML={{ __html: assemblyOptions.mockups.business_card }}
                     style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '100%' }} />
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 8 }}>Business Card</p>
              </div>
            )}
            {assemblyOptions.mockups.social_header && (
              <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <div dangerouslySetInnerHTML={{ __html: assemblyOptions.mockups.social_header }}
                     style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '100%' }} />
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 8 }}>Social Header</p>
              </div>
            )}
            {assemblyOptions.mockups.app_icon && (
              <div>
                <div dangerouslySetInnerHTML={{ __html: assemblyOptions.mockups.app_icon }}
                     style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} />
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 8 }}>App Icon</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Brand Guide */}
      {brandId && (
        <div style={{ textAlign: 'center', padding: '24px 0 60px' }}>
          <a
            href={`/api/brands/${brandId}/export/guide`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f17022', color: '#fff',
              padding: '16px 32px', borderRadius: 100,
              fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(241,112,34,0.25)',
            }}
          >
            ↗ Export Brand Guide
          </a>
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 12 }}>
            Opens a printable brand guide — use your browser's print to save as PDF
          </p>
        </div>
      )}
    </div>
  );
};

// ─── CARD RENDERER DISPATCH ───────────────────────────────────────────────────

const renderCard = (step: number, option: any, index: number, selected: boolean, wishlisted: boolean, onSelect: () => void, onWishlist: (e: React.MouseEvent) => void) => {
  const props: CardProps = { option, index, selected, wishlisted, onSelect, onWishlist };
  switch (step) {
    case 1: return <StrategyCard key={index} {...props} />;
    case 2: return <NamingCard key={index} {...props} />;
    case 3: return <ColorCard key={index} {...props} />;
    case 4: return <TypographyCard key={index} {...props} />;
    case 5: return <LogoCard key={index} {...props} />;
    case 6: return <VoiceCard key={index} {...props} />;
    default: return null;
  }
};

// ─── MAIN WIZARD ──────────────────────────────────────────────────────────────

interface GuidedWizardProps {
  onComplete: (brandId: number) => void;
  onBack: () => void;
  initialInputs?: { brandIdea: string; product: string; audience: string; vibe: string };
}

const GuidedWizard: React.FC<GuidedWizardProps> = ({ onComplete, onBack, initialInputs }) => {
  const [brandId, setBrandId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState<any[]>([]);
  const [guideMessage, setGuideMessage] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [guideLoading, setGuideLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullState, setFullState] = useState<any>(null);
  const [selections, setSelections] = useState<Record<number, any>>({});
  const [buildSuccess, setBuildSuccess] = useState(false);

  // Start the guided flow
  useEffect(() => {
    if (!initialInputs) return;
    const start = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.guidedStart(
          initialInputs.brandIdea, initialInputs.product,
          initialInputs.audience, initialInputs.vibe
        );
        setBrandId(res.brand_id);
        setCurrentStep(res.step);
        const opts = typeof res.options === 'string' ? JSON.parse(res.options) : res.options;
        setOptions(Array.isArray(opts) ? opts : []);
        setLoading(false);

        // Fetch AI guide message (non-blocking)
        setGuideLoading(true);
        const msg = await fetchGuideMessage({
          step: res.step,
          stepName: STEP_NAMES[res.step - 1],
          inputs: initialInputs,
          options: opts,
          action: 'entering_step',
        });
        setGuideMessage(msg);
        setGuideLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to start. Please try again.');
        setLoading(false);
      }
    };
    start();
  }, [initialInputs]);

  const handleSelect = useCallback(async (index: number) => {
    setSelectedIndex(index);
    // Get AI reaction to selection (non-blocking)
    if (currentStep < 7) {
      setGuideLoading(true);
      const msg = await fetchGuideMessage({
        step: currentStep,
        stepName: STEP_NAMES[currentStep - 1],
        inputs: initialInputs,
        selections,
        options,
        action: 'selected_option',
        selectedIdx: index,
      });
      setGuideMessage(msg);
      setGuideLoading(false);
    }
  }, [currentStep, initialInputs, selections, options]);

  const handleWishlist = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlisted(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedIndex === null || brandId === null) return;
    try {
      setLoading(true);
      setError('');

      if (currentStep === 7) {
        // Final step — brand was already finalized in background when step 6 completed.
        // Show success state, then redirect.
        setBuildSuccess(true);
        setLoading(false);
        setTimeout(() => {
          if (brandId !== null) onComplete(brandId);
        }, 2500);
        return;
      }

      // Save current selection
      const selectedOption = options[selectedIndex];
      const newSelections = { ...selections, [currentStep]: selectedOption };
      setSelections(newSelections);

      const res = await api.guidedStep(brandId, currentStep, selectedIndex, wishlisted);
      setCurrentStep(res.step);
      const opts = typeof res.options === 'string' ? JSON.parse(res.options) : res.options;
      setOptions(Array.isArray(opts) ? opts : []);
      setSelectedIndex(null);
      setWishlisted([]);
      setLoading(false);

      // If assembly step, fetch full state
      if (res.step === 7) {
        const state = await api.guidedState(brandId);
        setFullState(state);
      }

      // Fetch AI guide for new step (non-blocking)
      setGuideLoading(true);
      const msg = await fetchGuideMessage({
        step: res.step,
        stepName: STEP_NAMES[res.step - 1],
        inputs: initialInputs,
        selections: newSelections,
        options: opts,
        action: 'entering_step',
      });
      setGuideMessage(msg);
      setGuideLoading(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [brandId, currentStep, selectedIndex, wishlisted, onComplete]);

  const handleBack = useCallback(async () => {
    if (currentStep <= 1) {
      onBack();
      return;
    }
    if (brandId === null) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.guidedBack(brandId, currentStep - 1);
      setCurrentStep(res.step);
      const opts = typeof res.options === 'string' ? JSON.parse(res.options) : res.options;
      setOptions(Array.isArray(opts) ? opts : []);
      setSelectedIndex(res.selected_index ?? null);
      setWishlisted(res.wishlisted || []);
      setLoading(false);

      // Fetch AI guide for back step (non-blocking)
      setGuideLoading(true);
      const msg = await fetchGuideMessage({
        step: res.step,
        stepName: STEP_NAMES[res.step - 1],
        inputs: initialInputs,
        selections,
        action: 'going_back',
      });
      setGuideMessage(msg);
      setGuideLoading(false);
    } catch (err: any) {
      setError(err.message || 'Could not go back.');
    } finally {
      setLoading(false);
    }
  }, [brandId, currentStep, onBack]);

  // Success overlay — shown after "Build my brand" for 2.5s
  if (buildSuccess) {
    return (
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)',
        padding: '0 16px',
      }}>
        <div style={{ textAlign: 'center', animation: 'fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f17022, #ff8c42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 60px rgba(241,112,34,0.5)',
          }}>
            <span style={{ fontSize: 36 }}>✓</span>
          </div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 900,
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            color: 'var(--text)', marginBottom: 16,
            textTransform: 'uppercase', fontStyle: 'italic',
          }}>
            Your brand is ready.
          </h2>
          <p style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7,
          }}>
            Taking you to your Brand Manual…
          </p>
        </div>
        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page-enter" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: 'var(--bg)',
      padding: '0 16px',
      position: 'relative', zIndex: 5,
    }}>
      {/* Progress */}
      <ProgressBar currentStep={currentStep} completedSteps={currentStep} />

      {/* Step title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
          Step {currentStep} of 7
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text)', margin: '8px 0 0', textTransform: 'uppercase', fontStyle: 'italic' }}>
          {STEP_NAMES[currentStep - 1]}
        </h2>
      </div>

      {/* Kee — the AI soul */}
      <div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
        {guideLoading ? (
          <KeeAlive animate={false} chatEnabled={true} chatContext={{ step: currentStep, stepName: STEP_NAMES[currentStep - 1] }}>{'· · ·'}</KeeAlive>
        ) : (
          <KeeAlive animate={true} speed={20} chatEnabled={true} chatContext={{ step: currentStep, stepName: STEP_NAMES[currentStep - 1] }}>
            {guideMessage || STEP_GUIDE_FALLBACK[currentStep] || ''}
          </KeeAlive>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', paddingBottom: 100 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="kee-breathe" style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--accent, #f17022)', opacity: 0.6 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Generating your options...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text)', fontSize: 16, marginBottom: 12 }}>Something went wrong</p>
            <button className="btn-interactive" onClick={() => window.location.reload()} style={{ background: 'var(--accent, #f17022)', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        ) : currentStep === 7 ? (
          <AssemblyView state={fullState} brandId={brandId} />
        ) : (
          <div className="wizard-options-grid" style={{
            display: 'flex', gap: 16, flexWrap: 'wrap',
            justifyContent: 'center', padding: '16px 0',
          }}>
            <style>{`
              @media (max-width: 640px) {
                .wizard-options-grid {
                  flex-direction: column !important;
                  align-items: stretch !important;
                }
                .wizard-options-grid > * {
                  flex: unset !important;
                  min-width: unset !important;
                  width: 100% !important;
                }
              }
            `}</style>
            {options.map((opt, i) =>
              renderCard(currentStep, opt, i, selectedIndex === i, wishlisted.includes(i),
                () => handleSelect(i), (e) => handleWishlist(i, e))
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {!loading && !error && (
        <div className="wizard-bottom-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--overlay)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 10,
        }}>
        <style>{`
          @media (max-width: 640px) {
            .wizard-bottom-nav {
              padding: 12px 16px !important;
              gap: 12px;
            }
            .wizard-bottom-nav .wizard-step-label {
              display: none !important;
            }
            .wizard-continue-btn {
              flex: 1;
              justify-content: center;
            }
          }
        `}</style>
          {/* Step counter — center */}
          <p className="wizard-step-label" style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--text-subtle)', margin: 0,
          }}>
            Step {currentStep} of 7 · {STEP_NAMES[currentStep - 1]}
          </p>
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
              padding: '12px 20px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            ← Back
          </button>

          <button
            onClick={handleContinue}
            disabled={currentStep !== 7 && selectedIndex === null}
            className="btn-interactive wizard-continue-btn"
            style={{
              background: (currentStep !== 7 && selectedIndex === null) ? 'rgba(241,112,34,0.3)' : '#f17022',
              border: 'none', cursor: (currentStep !== 7 && selectedIndex === null) ? 'not-allowed' : 'pointer',
              color: '#fff', fontSize: 13, fontWeight: 700,
              padding: '14px 32px', borderRadius: 100,
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease',
              boxShadow: (currentStep !== 7 && selectedIndex === null) ? 'none' : '0 8px 24px rgba(241,112,34,0.25)',
            }}
          >
            {currentStep === 7 ? 'Build my brand' : 'Continue →'}
          </button>
        </div>
      )}
    </main>
  );
};

export default GuidedWizard;
