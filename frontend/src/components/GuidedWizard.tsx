import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

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

const GuideText = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderLeft: '2px solid rgba(241,112,34,0.3)', paddingLeft: 16, margin: '20px 0' }}>
    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
      {children}
    </p>
  </div>
);

const ParijataSpinner = () => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <svg viewBox="0 0 100 100" fill="none" style={{ width: 60, height: 60, margin: '0 auto 24px', animation: 'gentleSpin 4s linear infinite' }}>
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
        <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.7} transform={`rotate(${angle} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="8" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px rgba(241,112,34,0.5))' }} />
      <circle cx="50" cy="50" r="3" fill="white" opacity="0.7" />
    </svg>
    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
      Your brand is taking shape...
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
      color: filled ? '#f17022' : 'rgba(255,255,255,0.2)',
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
  <div style={{ padding: '24px 0', maxWidth: 600, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
      {/* Connecting line */}
      <div style={{
        position: 'absolute', top: 10, left: 20, right: 20, height: 2,
        background: 'rgba(255,255,255,0.08)',
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
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${isFuture ? 'rgba(255,255,255,0.15)' : isCurrent ? '#f17022' : '#fff'}`,
              background: isCompleted ? '#fff' : isCurrent ? '#f17022' : 'transparent',
              transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isCompleted && <span style={{ fontSize: 10, color: '#0a0a0a' }}>✓</span>}
            </div>
            <span style={{
              marginTop: 8, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              color: isCurrent ? '#f17022' : isFuture ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
              display: 'none',
            }} className="step-label">{name}</span>
          </div>
        );
      })}
    </div>
    <style>{`@media (min-width: 640px) { .step-label { display: block !important; } }`}</style>
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
  background: '#111',
  border: `2px solid ${selected ? '#f17022' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 16,
  padding: '28px 24px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  boxShadow: selected ? '0 0 24px rgba(241,112,34,0.12)' : 'none',
  flex: 1, minWidth: 260,
});

const StrategyCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div style={cardStyle(selected)} onClick={onSelect}>
    <HeartIcon filled={wishlisted} onClick={onWishlist} />
    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#f17022', marginBottom: 16 }}>
      {option.archetype}
    </p>
    <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 12, lineHeight: 1.3, paddingRight: 24 }}>
      {option.positioning}
    </h3>
    {option.archetype_why && (
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 12 }}>
        {option.archetype_why}
      </p>
    )}
    {option.brand_tensions && (
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Tensions</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{option.brand_tensions}</p>
      </div>
    )}
    {option.whitespace && (
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Whitespace</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{option.whitespace}</p>
      </div>
    )}
  </div>
);

const NamingCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div style={cardStyle(selected)} onClick={onSelect}>
    <HeartIcon filled={wishlisted} onClick={onWishlist} />
    <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 32, color: '#fff', marginBottom: 8, lineHeight: 1.1, paddingRight: 24 }}>
      {option.name}
    </h3>
    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>
      {option.meaning}
    </p>
    {option.origin && (
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Origin: {option.origin}
      </p>
    )}
    {option.tagline && (
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 12 }}>
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
  const primary = colors[0] || option.primary;
  const secondary = colors[1] || option.secondary;
  const accent = colors[2] || option.accent;
  return (
    <div style={cardStyle(selected)} onClick={onSelect}>
      <HeartIcon filled={wishlisted} onClick={onWishlist} />
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16, paddingRight: 24 }}>
        {option.palette_name || option.name || 'Palette'}
      </p>
      {/* Color swatches */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {primary && (
          <div style={{ flex: 2 }}>
            <div style={{ width: '100%', height: 56, borderRadius: 10, background: typeof primary === 'string' ? primary : primary.hex, marginBottom: 6 }} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{typeof primary === 'string' ? primary : primary.name || primary.hex}</p>
          </div>
        )}
        {secondary && (
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: 56, borderRadius: 10, background: typeof secondary === 'string' ? secondary : secondary.hex, marginBottom: 6 }} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{typeof secondary === 'string' ? secondary : secondary.name || secondary.hex}</p>
          </div>
        )}
        {accent && (
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: 56, borderRadius: 10, background: typeof accent === 'string' ? accent : accent.hex, marginBottom: 6 }} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{typeof accent === 'string' ? accent : accent.name || accent.hex}</p>
          </div>
        )}
      </div>
      {option.mood && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{option.mood}</p>
      )}
    </div>
  );
};

const TypographyCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => {
  // Load Google Font dynamically
  useEffect(() => {
    const fonts = [option.heading_font, option.body_font].filter(Boolean);
    fonts.forEach(font => {
      const id = `gfont-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [option.heading_font, option.body_font]);

  return (
    <div style={cardStyle(selected)} onClick={onSelect}>
      <HeartIcon filled={wishlisted} onClick={onWishlist} />
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 20, paddingRight: 24 }}>
        {option.name || 'Type System'}
      </p>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: `'${option.heading_font}', serif`, fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
          Aa Bb Cc
        </p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{option.heading_font}</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: `'${option.body_font}', sans-serif`, fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          The quick brown fox jumps over the lazy dog. 0123456789.
        </p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{option.body_font}</p>
      </div>
      {option.scale && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{option.scale}</p>
      )}
    </div>
  );
};

const LogoCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div style={cardStyle(selected)} onClick={onSelect}>
    <HeartIcon filled={wishlisted} onClick={onWishlist} />
    <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 12, paddingRight: 24 }}>
      {option.name}
    </h3>
    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 16 }}>
      {option.concept}
    </p>
    {option.construction && (
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Construction</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{option.construction}</p>
      </div>
    )}
    {option.colors && Array.isArray(option.colors) && (
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {option.colors.map((c: string, i: number) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
        ))}
      </div>
    )}
    {option.typography_note && (
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{option.typography_note}</p>
    )}
  </div>
);

const VoiceCard = ({ option, selected, wishlisted, onSelect, onWishlist }: CardProps) => (
  <div style={cardStyle(selected)} onClick={onSelect}>
    <HeartIcon filled={wishlisted} onClick={onWishlist} />
    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f17022', marginBottom: 8, paddingRight: 24 }}>
      {option.voice_name}
    </p>
    <div style={{ marginBottom: 16 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginRight: 12 }}>Tone: {option.tone}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Personality: {option.personality}</span>
    </div>
    {option.sample_tagline && (
      <p style={{ fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.5 }}>
        "{option.sample_tagline}"
      </p>
    )}
    {option.sample_social && (
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>Social post</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{option.sample_social}</p>
      </div>
    )}
    {option.sample_email && (
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>Email excerpt</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{option.sample_email}</p>
      </div>
    )}
  </div>
);

// ─── ASSEMBLY VIEW ────────────────────────────────────────────────────────────

const AssemblyView = ({ state }: { state: any }) => {
  if (!state?.steps) return null;

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

  const sectionStyle: React.CSSProperties = {
    background: '#111', borderRadius: 16, padding: '24px 20px', marginBottom: 16,
    border: '1px solid rgba(255,255,255,0.06)',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase',
    color: '#f17022', marginBottom: 12,
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <GuideText>Every choice you've made, assembled into one coherent system. Review it — this is your brand.</GuideText>

      {strategy && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Strategy</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
            {strategy.archetype}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{strategy.positioning}</p>
        </div>
      )}

      {naming && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Name</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            {naming.name}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{naming.meaning}</p>
          {naming.tagline && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>"{naming.tagline}"</p>}
        </div>
      )}

      {colors && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Colors</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[colors.primary || colors.colors?.[0], colors.secondary || colors.colors?.[1], colors.accent || colors.colors?.[2]].filter(Boolean).map((c: any, i: number) => (
              <div key={i} style={{ flex: i === 0 ? 2 : 1 }}>
                <div style={{ width: '100%', height: 48, borderRadius: 8, background: typeof c === 'string' ? c : c.hex }} />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{typeof c === 'string' ? c : c.name || c.hex}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {typography && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Typography</p>
          <p style={{ fontFamily: `'${typography.heading_font}', serif`, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {typography.heading_font}
          </p>
          <p style={{ fontFamily: `'${typography.body_font}', sans-serif`, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            {typography.body_font}
          </p>
        </div>
      )}

      {logo && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Logo Concept</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
            {logo.name}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{logo.concept}</p>
        </div>
      )}

      {voice && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Voice</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
            {voice.voice_name}
          </p>
          {voice.sample_tagline && (
            <p style={{ fontSize: 14, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
              "{voice.sample_tagline}"
            </p>
          )}
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
        // Final step — complete
        await api.guidedStep(brandId, currentStep, selectedIndex, wishlisted);
        onComplete(brandId);
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

  return (
    <main style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: '#0a0a0a',
      padding: '0 16px',
    }}>
      {/* Progress */}
      <ProgressBar currentStep={currentStep} completedSteps={currentStep} />

      {/* Step title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
          Step {currentStep} of 7
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#fff', margin: '8px 0 0', textTransform: 'uppercase', fontStyle: 'italic' }}>
          {STEP_NAMES[currentStep - 1]}
        </h2>
      </div>

      {/* Guide message — the AI soul */}
      <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        {guideLoading ? (
          <div style={{ borderLeft: '2px solid rgba(241,112,34,0.3)', paddingLeft: 16, margin: '20px 0' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>···</span>
            </p>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }`}</style>
          </div>
        ) : guideMessage ? (
          <GuideText>{guideMessage}</GuideText>
        ) : null}
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', paddingBottom: 100 }}>
        {loading ? (
          <ParijataSpinner />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', padding: '10px 24px', borderRadius: 100,
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
              }}
            >
              Try again
            </button>
          </div>
        ) : currentStep === 7 ? (
          <AssemblyView state={fullState} />
        ) : (
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap',
            justifyContent: 'center', padding: '16px 0',
          }}>
            {options.map((opt, i) =>
              renderCard(currentStep, opt, i, selectedIndex === i, wishlisted.includes(i),
                () => handleSelect(i), (e) => handleWishlist(i, e))
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {!loading && !error && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, #0a0a0a 30%)',
          padding: '40px 24px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: 900, margin: '0 auto',
          zIndex: 10,
        }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600,
              padding: '12px 20px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            ← Back
          </button>

          <button
            onClick={handleContinue}
            disabled={currentStep !== 7 && selectedIndex === null}
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
