import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandSystem, User, BrandVibe } from './types';
import * as api from './api';
import AuthScreen from './components/AuthScreen';
import LoadingScreen from './components/LoadingScreen';
import EngineView from './components/EngineView';
import BrandManual from './components/BrandManual';
import LandingPage from './components/LandingPage';
import CustomCursor from './components/CustomCursor';
import MagneticButton from './components/MagneticButton';
import LogoRenderer from './components/LogoRenderer';
import CompareView from './components/CompareView';
import VaultView from './components/VaultView';
import AppSidebar from './components/AppSidebar';
import ArchitectureView from './components/ArchitectureView';
import StudioView from './components/StudioView';
import { useSound } from './hooks/useSound';

const SplitChars: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={className}>
    {text.split('').map((char, i) => (
      <span key={i} className="split-char inline-block" style={{ opacity: 0, transform: 'translateY(40px)' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </span>
);

// The Parijata Mark — stylized flower, white petals, orange center
const ParijataMark = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]`}>
    {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
      <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.9} transform={`rotate(${angle} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="8" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px rgba(241,112,34,0.6))' }} />
    <circle cx="50" cy="50" r="3" fill="white" opacity="0.8" />
  </svg>
);
const MasterSeal = ParijataMark; // backward compat

// Decorative vault empty state SVG
const VaultEmptyIllustration = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-40 md:w-56 md:h-56 mx-auto opacity-20">
    <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
    <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="0.5" />
    <g transform="translate(100, 100)">
      {[0, 60, 120, 180, 240, 300].map(a => (
        <path key={a} d="M0 0 C-4 -6, -7 -18, 0 -25 C7 -18, 4 -6, 0 0 Z" fill="white" opacity="0.3" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="4" fill="#f17022" opacity="0.6" />
    </g>
    <path d="M60 140 L100 160 L140 140" stroke="white" strokeWidth="0.5" opacity="0.3" />
    <path d="M70 150 L100 165 L130 150" stroke="white" strokeWidth="0.5" opacity="0.2" />
  </svg>
);

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return isNaN(r) ? '' : `${r}, ${g}, ${b}`;
}

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// Counter animation component
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ end, suffix = '', duration = 2 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current || started) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || !ref.current) return;
    const el = ref.current;
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * end) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
};

// ─── GENERATION PROGRESS OVERLAY ─────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done';

interface GenerationStep {
  label: string;
  status: StepStatus;
}

const PIPELINE_STEPS: GenerationStep[] = [
  { label: 'Defining strategy', status: 'pending' },
  { label: 'Crafting name', status: 'pending' },
  { label: 'Checking availability', status: 'pending' },
  { label: 'Building visual system', status: 'pending' },
  { label: 'Assembling brand', status: 'pending' },
];

// V3 step name → display step index mapping
const V3_STEP_TO_INDEX: Record<string, number> = {
  'strategy': 0,
  'naming': 1,
  'domain_check': 2,
  'visual': 3,
  'logo': 3,       // logo is part of visual
  'integration': 4,
};

// Legacy V2 step number mapping (backward compat)
const SSE_STEP_TO_INDEX: Record<number, number> = { 1: 0, 2: 1, 3: 2, 5: 3 };

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="#f17022" strokeWidth="3" />
    <path className="opacity-90" fill="none" stroke="#f17022" strokeWidth="3" strokeLinecap="round"
      d="M12 2 a10 10 0 0 1 10 10" />
  </svg>
);

// Rotating education tips component
const RotatingTips: React.FC = () => {
  const [tips, setTips] = useState<Array<{ content: string; source: string }>>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    // Fetch multiple tips upfront
    const fetchTips = async () => {
      const fetched: Array<{ content: string; source: string }> = [];
      for (let i = 0; i < 6; i++) {
        try {
          const tip = await api.getLoadingTip();
          fetched.push(tip);
        } catch {}
      }
      if (fetched.length > 0) setTips(fetched);
    };
    fetchTips();
  }, []);

  useEffect(() => {
    if (tips.length < 2) return;
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIdx(prev => (prev + 1) % tips.length);
        setFadeIn(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips]);

  if (tips.length === 0) return null;

  const tip = tips[currentIdx];

  return (
    <div
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.4s ease',
        textAlign: 'center',
        maxWidth: 400,
        padding: '0 16px',
      }}
    >
      <p style={{
        fontSize: 13,
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.7,
        fontFamily: 'Georgia, serif',
        marginBottom: 8,
      }}>
        "{tip.content}"
      </p>
      <p style={{
        fontSize: 9,
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: 'rgba(241,112,34,0.5)',
        fontWeight: 700,
      }}>
        — {tip.source}
      </p>
    </div>
  );
};

const GenerationProgress: React.FC<{ steps: GenerationStep[] }> = ({ steps }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 px-6"
  >
    {/* Ambient glow */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[500px] h-[500px] rounded-full bg-[#f17022]/[0.04] blur-[120px]" />
    </div>

    {/* Animated seal */}
    <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center flex-shrink-0">
      <div className="absolute inset-0 rounded-full bg-[#f17022]/[0.08] animate-ping" style={{ animationDuration: '2.8s' }} />
      <div className="absolute inset-3 rounded-full bg-[#f17022]/[0.04] animate-pulse" style={{ animationDuration: '1.8s' }} />
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" style={{ animation: 'spin 10s linear infinite' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <path
            key={i}
            d="M50 50 C50 50, 44 46, 41 28 C38 12, 50 5, 50 5 C50 5, 62 12, 59 28 C56 46, 50 50, 50 50 Z"
            fill="white"
            opacity="0.06"
            transform={`rotate(${(360 / 24) * i} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="8" fill="#f17022" opacity="0.95" />
      </svg>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>

    {/* Step list */}
    <div className="relative z-10 flex flex-col gap-4 w-full max-w-[340px]">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4"
        >
          {/* Icon column — fixed 20px wide */}
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
            {step.status === 'done' && (
              <motion.span
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                className="text-[#f17022] text-[15px] leading-none font-black"
              >
                ✓
              </motion.span>
            )}
            {step.status === 'running' && <SpinnerIcon />}
            {step.status === 'pending' && (
              <span className="text-white/20 text-[12px] font-black leading-none">→</span>
            )}
          </div>

          {/* Label */}
          <span className={`text-[11px] md:text-[12px] uppercase font-black tracking-[0.3em] transition-colors duration-500 ${
            step.status === 'done'
              ? 'text-white/45 line-through decoration-white/20'
              : step.status === 'running'
              ? 'text-white'
              : 'text-white/18'
          }`}>
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>

    {/* Rotating education tips */}
    <div className="relative z-10 border-t border-white/[0.06] pt-8 w-full max-w-[400px] flex flex-col items-center">
      <p className="text-[8px] uppercase tracking-[0.6em] text-white/20 font-black mb-4">While you wait · Brand wisdom</p>
      <RotatingTips />
    </div>

    <p className="relative z-10 text-[9px] uppercase tracking-[0.8em] font-black text-white/12">
      HowIconic · 5-Step AI Pipeline
    </p>
  </motion.div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

// ─── PRICING MODAL ────────────────────────────────────────────────────────────

const PricingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const WA = 'https://wa.me/919486183626';
  const plans = [
    {
      name: 'CREATOR',
      price: '₹2,999',
      period: 'one-time',
      desc: '1 full brand system',
      cta: 'Get Started →',
      link: `${WA}?text=${encodeURIComponent("Hi, I'd like to unlock HowIconic Creator (₹2,999) for my brand project.")}`,
    },
    {
      name: 'STUDIO',
      price: '₹7,499',
      period: '/mo',
      desc: '10 brands monthly',
      cta: 'Subscribe →',
      link: `${WA}?text=${encodeURIComponent("Hi, I'd like the HowIconic Studio plan (₹7,499/mo).")}`,
      featured: true,
    },
    {
      name: 'STUDIO YEARLY',
      price: '₹59,999',
      period: '/yr',
      desc: '15 brands/mo · save 33%',
      cta: 'Subscribe →',
      link: `${WA}?text=${encodeURIComponent("Hi, I'd like the HowIconic Studio Yearly plan (₹59,999/yr).")}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.1] rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 border-b border-white/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.8em] font-black text-brand-primary/70 mb-3">HowIconic</p>
              <h2 className="text-2xl font-serif-display uppercase font-black text-white leading-tight">
                You've created<br />3 brand systems.
              </h2>
              <p className="text-white/40 font-serif-elegant italic text-base mt-2">
                Upgrade to keep building.
              </p>
            </div>
            <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-all text-xl cursor-pointer mt-1">✕</button>
          </div>
        </div>

        {/* Plans */}
        <div className="px-8 py-6 space-y-3">
          {plans.map((plan) => (
            <a
              key={plan.name}
              href={plan.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-5 border rounded-2xl transition-all group hover:-translate-y-0.5 ${
                plan.featured
                  ? 'border-brand-primary/40 bg-brand-primary/[0.04]'
                  : 'border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[10px] uppercase font-black tracking-[0.4em] ${plan.featured ? 'text-brand-primary' : 'text-white/70'}`}>
                    {plan.name}
                  </p>
                  <p className="text-[8px] uppercase tracking-widest text-white/30 font-black mt-0.5">{plan.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg leading-none">{plan.price}<span className="text-white/40 text-xs font-black">{plan.period}</span></p>
                  <p className={`text-[9px] uppercase font-black tracking-[0.3em] mt-1 group-hover:translate-x-0.5 transition-transform ${plan.featured ? 'text-brand-primary' : 'text-white/40 group-hover:text-white/70'}`}>
                    {plan.cta}
                  </p>
                </div>
              </div>
            </a>
          ))}

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 border-t border-white/[0.06]" />
            <span className="text-[8px] uppercase tracking-[0.5em] text-white/15 font-black">or</span>
            <div className="flex-1 border-t border-white/[0.06]" />
          </div>

          {/* Consulting */}
          <a
            href={`${WA}?text=${encodeURIComponent("Hi, I'd like to discuss brand consulting with HowIconic.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 border border-white/[0.06] rounded-2xl hover:border-white/20 transition-all group"
          >
            <p className="text-[9px] uppercase font-black tracking-[0.4em] text-white/50 group-hover:text-white/80 transition-colors">
              Want us to build your brand?
            </p>
            <p className="text-brand-primary/60 text-[10px] font-black tracking-[0.3em] uppercase mt-1 group-hover:text-brand-primary transition-colors">
              Talk to us on WhatsApp →
            </p>
          </a>
        </div>

        <div className="px-8 pb-8">
          <p className="text-[7px] uppercase tracking-[0.6em] text-white/10 font-black text-center">
            All plans via WhatsApp · Razorpay checkout coming soon
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<'engine' | 'audit' | 'manual' | 'about' | 'vault' | 'architecture' | 'studio'>('engine');
  const [brand, setBrand] = useState<BrandSystem | null>(null);
  const [history, setHistory] = useState<BrandSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [generationsCount, setGenerationsCount] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const sound = useSound();

  // Smooth scroll via native CSS scroll-behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  // Auth check — use existing token only; no auto-login
  useEffect(() => {
    const tryAuth = async () => {
      if (api.isLoggedIn()) {
        try {
          const data = await api.getMe();
          setUser(data);
          if (data.generations_count !== undefined) {
            setGenerationsCount(data.generations_count);
          }
          try {
            const brands = await api.listBrands();
            if (Array.isArray(brands)) {
              setHistory(brands.map((b: any) => ({
                ...JSON.parse(typeof b.brand_data === 'string' ? b.brand_data : JSON.stringify(b.brand_data)),
                id: b.id, uid: b.uid,
              })));
            }
          } catch {}
        } catch {
          // Token invalid — clear it and show landing page
          api.logout();
        }
      }
      setAuthChecked(true);
    };
    tryAuth();
  }, []);

  const switchView = (v: typeof view) => {
    sound.whoosh();
    sound.click();
    setView(v);
    setMobileMenuOpen(false);
  };

  // Maps the raw API result (either from SSE complete event or direct call) into BrandSystem
  const mapBrandResult = (raw: any, sense: string): BrandSystem => {
    const r = raw;
    const uid = r.uid || `HI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // V3 pipeline result — all fields already properly shaped (isV3 flag)
    if (r.isV3 || r.v3Strategy || r.v3Names) {
      return {
        ...r,
        uid,
        timestamp: Date.now(),
        sense: sense || r.sense || 'Bold',
        name: r.name || 'UNNAMED',
        isV3: true,
        foundation: r.foundation || { purpose: '', marketWedge: '', archetype: '', customerPsychology: '', positioning: '', designPrinciples: [], story: '' },
        voice: r.voice || { personalityTraits: [], tone: '', tagline: '', messagingPillars: [], verbalSignature: '' },
        logoSystem: r.logoSystem || { primaryLogoSvg: '', symbolOnlySvg: '', wordmarkOnlySvg: '', logic: '', metaphor: '', kineticLogic: '' },
        colors: r.colors || { primary: { name: 'Primary', hex: '#f17022', rgb: '', cmyk: '', usage: '', emotion: '', ratio: 60 }, secondary: { name: 'Secondary', hex: '#1a1a1a', rgb: '', cmyk: '', usage: '', emotion: '', ratio: 30 }, accent: { name: 'Accent', hex: '#f5f5f5', rgb: '', cmyk: '', usage: '', emotion: '', ratio: 10 }, canvasColor: '#0a0a0a' },
        typography: r.typography || { move: '', hierarchy: { headline: { fontFamily: 'Playfair Display', weight: 'Black', size: '72px', lineHeight: '1.1', letterSpacing: '-0.04em', usage: '' }, body: { fontFamily: 'Inter', weight: 'Regular', size: '16px', lineHeight: '1.6', letterSpacing: '0', usage: '' }, subheadline: { fontFamily: 'Playfair Display', weight: 'Bold', size: '24px', lineHeight: '1.2', letterSpacing: '0', usage: '' }, caption: { fontFamily: 'Inter', weight: 'Regular', size: '12px', lineHeight: '1.5', letterSpacing: '0.1em', usage: '' } } },
        visualLanguage: r.visualLanguage || { shapes: '', textureStyle: '', geometry: '' },
        applications: r.applications || { packaging: '', website: '' },
      } as BrandSystem;
    }

    // V2 pipeline result — all fields already properly shaped
    if (r.v2Strategy || r.v2Verbal || r.v2Visual) {
      return {
        ...r,
        uid,
        timestamp: Date.now(),
        sense: sense || r.sense || 'Modern',
        name: r.name || 'UNNAMED',
        foundation: r.foundation || { purpose: '', marketWedge: '', archetype: '', customerPsychology: '', positioning: '', designPrinciples: [], story: '' },
        voice: r.voice || { personalityTraits: [], tone: '', tagline: '', messagingPillars: [], verbalSignature: '' },
        logoSystem: r.logoSystem || { primaryLogoSvg: '', symbolOnlySvg: '', wordmarkOnlySvg: '', logic: '', metaphor: '', kineticLogic: '' },
        colors: r.colors || { primary: { name: 'Primary', hex: '#f17022', rgb: '', cmyk: '', usage: '', emotion: '', ratio: 60 }, secondary: { name: 'Secondary', hex: '#1a1a1a', rgb: '', cmyk: '', usage: '', emotion: '', ratio: 30 }, accent: { name: 'Accent', hex: '#f5f5f5', rgb: '', cmyk: '', usage: '', emotion: '', ratio: 10 }, canvasColor: '#0a0a0a' },
        typography: r.typography || { move: '', hierarchy: { headline: { fontFamily: 'Playfair Display', weight: 'Black', size: '72px', lineHeight: '1.1', letterSpacing: '-0.04em', usage: '' }, body: { fontFamily: 'Inter', weight: 'Regular', size: '16px', lineHeight: '1.6', letterSpacing: '0', usage: '' }, subheadline: { fontFamily: 'Playfair Display', weight: 'Bold', size: '24px', lineHeight: '1.2', letterSpacing: '0', usage: '' }, caption: { fontFamily: 'Inter', weight: 'Regular', size: '12px', lineHeight: '1.5', letterSpacing: '0.1em', usage: '' } } },
        visualLanguage: r.visualLanguage || { shapes: '', textureStyle: '', geometry: '' },
        applications: r.applications || { packaging: '', website: '' },
      } as BrandSystem;
    }

    // V1 / demo format fallback
    return {
      ...r,
      uid,
      timestamp: Date.now(),
      sense: sense || 'Modern',
      name: r.brand_name || r.name || 'UNNAMED',
      foundation: {
        purpose: r.mission || r.brand_promise || '',
        marketWedge: r.elevator_pitch || '',
        archetype: r.personality?.voice || '',
        customerPsychology: r.target_audience?.psychographics || '',
        positioning: r.vision || '',
        designPrinciples: r.values || [],
        story: r.brand_story || '',
      },
      voice: {
        personalityTraits: r.personality?.traits || [],
        tone: r.personality?.tone || '',
        tagline: r.tagline || '',
        messagingPillars: r.values || [],
        verbalSignature: r.elevator_pitch || '',
      },
      logoSystem: { primaryLogoSvg: '', symbolOnlySvg: '', wordmarkOnlySvg: '', logic: '', metaphor: '', kineticLogic: '' },
      colors: {
        primary: { name: 'Primary', hex: r.colors?.primary || '#f17022', rgb: '', cmyk: '', usage: 'Primary brand color', emotion: 'Energy', ratio: 60 },
        secondary: { name: 'Secondary', hex: r.colors?.secondary || '#1a1a1a', rgb: '', cmyk: '', usage: 'Supporting', emotion: 'Depth', ratio: 30 },
        accent: { name: 'Accent', hex: r.colors?.accent || '#f5f5f5', rgb: '', cmyk: '', usage: 'Highlights', emotion: 'Clarity', ratio: 10 },
        canvasColor: r.colors?.background || '#0a0a0a',
      },
      typography: {
        move: '',
        hierarchy: {
          headline: { fontFamily: r.typography?.heading || 'Playfair Display', weight: 'Black', size: '72px', lineHeight: '1.1', letterSpacing: '-0.04em', usage: '' },
          body: { fontFamily: r.typography?.body || 'Inter', weight: 'Regular', size: '16px', lineHeight: '1.6', letterSpacing: '0', usage: '' },
          subheadline: { fontFamily: 'Playfair Display', weight: 'Bold', size: '24px', lineHeight: '1.2', letterSpacing: '0', usage: '' },
          caption: { fontFamily: 'Inter', weight: 'Regular', size: '12px', lineHeight: '1.5', letterSpacing: '0.1em', usage: '' },
        },
      },
      visualLanguage: { shapes: '', textureStyle: '', geometry: '' },
      applications: { packaging: '', website: '' },
    };
  };

  const handleManifest = async (
    brandIdea: string,
    product: string,
    audience: string,
    vibe: BrandVibe,
  ) => {
    if (!brandIdea?.trim() || !product?.trim()) {
      setError("Tell us what this brand believes and what it sells.");
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Usage gate — show pricing modal after 3 free generations
    if (generationsCount >= 3) {
      setShowPricingModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    const initSteps = PIPELINE_STEPS.map(s => ({ ...s }));
    setGenerationSteps(initSteps);

    const input = {
      brand_idea: brandIdea,
      product,
      audience,
      vibe,
    };

    try {
      let rawBrand: any = null;

      try {
        // Primary path: V3 SSE streaming
        await api.streamGenerateBrandV3(input, (type, data) => {
          if (type === 'step_start') {
            // Detect V3 by name field, fall back to V2 step number
            const stepName = data.name as string | undefined;
            const stepNum = data.step as number | undefined;
            let idx = -1;
            if (stepName && V3_STEP_TO_INDEX[stepName] !== undefined) {
              idx = V3_STEP_TO_INDEX[stepName];
            } else if (stepNum && SSE_STEP_TO_INDEX[stepNum] !== undefined) {
              idx = SSE_STEP_TO_INDEX[stepNum];
            }
            if (idx >= 0) {
              setGenerationSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));
            }
          } else if (type === 'step_complete') {
            const stepName = data.name as string | undefined;
            const stepNum = data.step as number | undefined;
            let idx = -1;
            if (stepName && V3_STEP_TO_INDEX[stepName] !== undefined) {
              idx = V3_STEP_TO_INDEX[stepName];
            } else if (stepNum && SSE_STEP_TO_INDEX[stepNum] !== undefined) {
              idx = SSE_STEP_TO_INDEX[stepNum];
            }
            if (idx >= 0) {
              setGenerationSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'done' } : s));
            }
          } else if (type === 'complete') {
            rawBrand = data.brand;
          } else if (type === 'error') {
            throw new Error(data.message || 'Pipeline error');
          }
        });
      } catch (sseErr: any) {
        // SSE failed — fall back to non-streaming
        console.warn('[handleManifest] SSE failed, falling back:', sseErr?.message);
        setGenerationSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
        const result = await api.generateBrandV3(input);
        rawBrand = result?.brand ?? null;
      }

      // Demo fallback if API completely unavailable
      if (!rawBrand) {
        const words = product.split(' ').filter((w: string) => w.length > 3);
        const nameWord = words[0] || 'Nova';
        const palettes = [
          { primary: '#8C1B1B', secondary: '#A87C3F', accent: '#F0E4D4', bg: '#0A0A0A' },
          { primary: '#1B4D8C', secondary: '#3FA87C', accent: '#E4F0D4', bg: '#060D15' },
          { primary: '#4D8C1B', secondary: '#7CA83F', accent: '#D4F0E4', bg: '#080D06' },
          { primary: '#F17022', secondary: '#2A2A2A', accent: '#F5E6D0', bg: '#0A0A0A' },
        ];
        const p = palettes[Math.floor(Math.random() * palettes.length)];
        rawBrand = {
          brand_name: nameWord.charAt(0).toUpperCase() + nameWord.slice(1) + (Math.random() > 0.5 ? 'forge' : 'mark'),
          tagline: `Where ${brandIdea.split(' ').slice(0, 3).join(' ')} meets intent.`,
          mission: `To redefine ${product.toLowerCase()} through purposeful design.`,
          vision: `The most iconic ${product.toLowerCase()} brand.`,
          brand_story: `Born from the conviction that ${product.toLowerCase()} deserves better.`,
          elevator_pitch: `${product} reimagined. For those who demand more.`,
          values: ['Authenticity', 'Precision', 'Boldness', 'Craftsmanship'],
          personality: { traits: ['Confident', 'Direct', 'Intentional'], tone: 'Authoritative yet warm.', voice: 'The Artisan' },
          target_audience: { psychographics: 'Values quality over quantity.' },
          colors: { primary: p.primary, secondary: p.secondary, accent: p.accent, background: p.bg },
          typography: { heading: 'Playfair Display', body: 'Inter' },
        };
      }

      const brandData = mapBrandResult(rawBrand, vibe);

      // Get logo SVG only for non-V3 brands (V3 generates its own in the pipeline)
      if (!brandData.isV3) {
        try {
          const logoResult = await api.generateLogo('auto', {
            text: brandData.name.substring(0, 3).toUpperCase(),
            primary_color: brandData.colors.primary.hex,
            secondary_color: brandData.colors.secondary.hex,
            accent_color: brandData.colors.accent.hex,
          });
          if (logoResult.svg) {
            brandData.logoSystem.primaryLogoSvg = logoResult.svg;
            brandData.logoSystem.symbolOnlySvg = logoResult.svg;
          }
        } catch {}
      }

      // Save to DB (best-effort)
      try {
        const saved = await api.createBrand(brandData.name, brandData);
        brandData.id = saved.id;
        brandData.uid = saved.uid;
      } catch {}

      sound.chime();
      setBrand(brandData);
      setHistory(prev => [brandData, ...prev]);
      setGenerationsCount(prev => prev + 1);
      setView('manual');
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('rate') || msg.includes('quota') || msg.includes('limit')) {
        setError('The engine needs a moment. Please try again in a few seconds.');
      } else if (msg.includes('connection') || msg.includes('network') || msg.includes('failed to fetch')) {
        setError('Connection lost. Check your network and try again.');
      } else if (msg.includes('api_key') || msg.includes('gemini')) {
        setError('Brand engine is warming up. Please try again.');
      } else {
        setError('The engine hit a snag. Please try again.');
      }
      setTimeout(() => setError(null), 6000);
    } finally {
      setLoading(false);
      setGenerationSteps([]);
    }
  };

  if (!authChecked) return <LoadingScreen />;

  // Not logged in — show landing page or auth screen
  if (!user) {
    if (showAuth) {
      return (
        <AuthScreen
          onAuth={async (u) => {
            setUser(u);
            if (u?.generations_count !== undefined) setGenerationsCount(u.generations_count);
            setShowAuth(false);
            // Fetch brands after login
            try {
              const brands = await api.listBrands();
              if (Array.isArray(brands)) {
                setHistory(brands.map((b: any) => ({
                  ...JSON.parse(typeof b.brand_data === 'string' ? b.brand_data : JSON.stringify(b.brand_data)),
                  id: b.id, uid: b.uid,
                })));
              }
            } catch {}
          }}
          onBack={() => setShowAuth(false)}
        />
      );
    }
    return (
      <LandingPage
        onStartBuilding={() => setShowAuth(true)}
        onLogin={() => setShowAuth(true)}
      />
    );
  }

  const navItems = [
    { key: 'engine' as const, label: 'Create' },
    { key: 'audit' as const, label: 'Analyze' },
    { key: 'vault' as const, label: 'Vault' },
    { key: 'about' as const, label: 'Our Story' },
  ];

  return (
    <div ref={mainRef} className="relative min-h-screen transition-colors duration-1000 overflow-x-hidden bg-[#0a0a0a] text-[#f5f5f5]">
      <CustomCursor />
      <div className="noise-overlay" />
      <div className="blueprint-grid-overlay" />

      {/* Sidebar navigation */}
      <AppSidebar
        currentView={view as any}
        onNavigate={(v) => switchView(v as typeof view)}
        brandCount={history.length}
      />

      <AnimatePresence>
        {loading && generationSteps.length > 0 && <GenerationProgress steps={generationSteps} />}
        {loading && generationSteps.length === 0 && <LoadingScreen />}
        {showPricingModal && <PricingModal onClose={() => setShowPricingModal(false)} />}
      </AnimatePresence>

      {/* Top nav bar — positioned to the right of sidebar */}
      <nav
        className="fixed top-0 right-0 h-16 border-b border-white/[0.06] backdrop-blur-xl z-[150] flex items-center justify-between px-6 no-print bg-black/90"
        style={{ left: 64, transition: 'left 0.25s' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[9px] uppercase tracking-[0.6em] font-black text-white/20">
            {view === 'engine' ? 'Brand Engine' : view === 'vault' ? 'Brand Vault' : view === 'audit' ? 'Audit Lab' : view === 'architecture' ? 'Brand Architecture' : view === 'studio' ? 'Design Studio' : 'Our Story'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={sound.toggleMute}
            className="text-[10px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-all cursor-pointer"
            title={sound.muted ? 'Unmute' : 'Mute'}>
            {sound.muted ? '🔇' : '🔊'}
          </button>
          <button onClick={() => { api.logout(); setUser(null); setShowAuth(false); }} className="text-[10px] uppercase font-black tracking-widest text-white/30 hover:text-red-400 transition-all cursor-pointer">
            Exit
          </button>
        </div>
      </nav>

      {/* Mobile menu fullscreen overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center lg:hidden"
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer text-2xl"
              aria-label="Close menu"
            >
              ✕
            </button>
            <nav className="flex flex-col items-center gap-10">
              {navItems.map((v, i) => (
                <motion.button
                  key={v.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.07 + 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => switchView(v.key)}
                  className={`text-4xl md:text-5xl uppercase font-black tracking-[0.35em] transition-all bg-transparent border-none cursor-pointer ${
                    view === v.key ? 'text-brand-primary' : 'text-white/55 hover:text-white'
                  }`}
                >
                  {v.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: navItems.length * 0.07 + 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => { api.logout(); setUser(null); setShowAuth(false); }}
                className="text-xl uppercase font-black tracking-[0.4em] text-white/25 hover:text-red-400 transition-all mt-4 bg-transparent border-none cursor-pointer"
              >
                Exit
              </motion.button>
            </nav>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-10 text-[9px] uppercase tracking-[0.8em] font-black text-white/15"
            >
              HowIconic · Build what lasts.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && !loading && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[300] w-full max-w-xl px-6">
          <div className="bg-black/95 border-l-[8px] border-brand-primary backdrop-blur-xl p-8 rounded-r-2xl flex justify-between items-center gap-6 border border-white/10 animate-fade-in">
            <p className="text-white font-serif-elegant italic text-lg">{error}</p>
            <button onClick={() => setError(null)} className="text-white/40 hover:text-white text-2xl cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {/* Views — offset for sidebar (desktop: 64px left, top: 64px) */}
      <div className="min-h-screen flex flex-col" style={{ paddingLeft: 64, paddingTop: 64 }}>
        <AnimatePresence mode="wait">
          {view === 'engine' && (
            <motion.div key="engine" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <EngineView
                onManifest={(brandIdea, product, audience, vibe) =>
                  handleManifest(brandIdea, product, audience, vibe)
                }
                isManifesting={loading}
                sound={sound}
              />
            </motion.div>
          )}

          {view === 'vault' && (
            <motion.div key="vault" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              {showCompare && compareIds.length === 2 && (() => {
                const bA = history.find(h => (h.uid || String(h.id)) === compareIds[0]);
                const bB = history.find(h => (h.uid || String(h.id)) === compareIds[1]);
                if (!bA || !bB) return null;
                return (
                  <CompareView
                    brandA={bA}
                    brandB={bB}
                    onBack={() => { setShowCompare(false); setCompareIds([]); setCompareMode(false); }}
                  />
                );
              })()}

              {!showCompare && (
                <VaultView
                  brands={history}
                  onOpen={(b) => { setBrand(b); switchView('manual' as any); }}
                  onNewBrand={() => switchView('engine')}
                  onDelete={(_, idx) => setHistory(prev => prev.filter((__, j) => j !== idx))}
                  compareMode={compareMode}
                  compareIds={compareIds}
                  onToggleCompare={() => {
                    setCompareMode(!compareMode);
                    setCompareIds([]);
                    setShowCompare(false);
                  }}
                  onSelectCompare={(id) => {
                    const isSelected = compareIds.includes(id);
                    setCompareIds(prev =>
                      isSelected ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
                    );
                  }}
                  onStartCompare={() => setShowCompare(true)}
                />
              )}
            </motion.div>
          )}

                    {view === 'manual' && brand && (
            <motion.div key="manual" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <BrandManual
                brand={brand}
                onBack={() => switchView('vault')}
                onBrandUpdate={(updated) => {
                  setBrand(updated);
                  setHistory(prev => prev.map(b => b.uid === updated.uid ? updated : b));
                }}
              />
            </motion.div>
          )}

          {view === 'architecture' && (
            <motion.div key="architecture" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              {brand ? (
                <ArchitectureView
                  brand={brand}
                  onSelectBrand={(id) => {
                    // Find brand in history by id or uid and open it
                    const found = history.find(h => String(h.id) === String(id) || h.uid === String(id));
                    if (found) { setBrand(found); switchView('manual' as any); }
                  }}
                />
              ) : (
                <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
                  <p className="text-[9px] uppercase tracking-[0.8em] font-black text-white/20 mb-6">Brand Architecture</p>
                  <p className="text-xl font-serif-elegant italic text-white/30 mb-8">
                    Select a brand first to view its architecture tree.
                  </p>
                  <button
                    onClick={() => switchView('vault')}
                    className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-primary/70 hover:text-brand-primary transition-all cursor-pointer bg-transparent border-none"
                  >
                    ← Go to Vault →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'studio' && (
            <motion.div key="studio" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <StudioView brand={brand} />
            </motion.div>
          )}

          {view === 'audit' && (
            <motion.div key="audit" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <main className="max-w-[1200px] mx-auto px-6 py-24 text-center">
                <h2 className="text-6xl md:text-8xl font-serif-display italic font-black text-white uppercase mb-8">
                  <SplitChars text="Audit Lab" />
                </h2>
                <p className="text-xl font-serif-elegant italic text-white/40 mb-16 gsap-reveal">Forensic brand maturity analysis. Coming soon.</p>
              </main>
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <main className="max-w-[1100px] mx-auto px-6 py-24 md:py-40 space-y-28">
                <header className="text-center space-y-8">
                  <h1 className="text-5xl sm:text-6xl md:text-[8rem] font-serif-display uppercase italic font-black text-white tracking-tighter leading-none">
                    <SplitChars text="Build What Lasts" />
                  </h1>
                  <p className="text-xl md:text-3xl font-serif-elegant italic text-white/50 max-w-3xl mx-auto gsap-reveal">
                    A Brand Operating System for companies between <span className="text-brand-primary">₹5CR and ₹200CR</span> annual revenue.
                  </p>
                </header>

                {/* Pullquote */}
                <motion.div variants={staggerItem} initial="initial" animate="animate" className="gsap-reveal py-16 md:py-24 text-center">
                  <blockquote className="text-3xl md:text-5xl font-serif-elegant italic text-white/80 leading-snug max-w-4xl mx-auto">
                    "A brand isn't a logo—<br />it's <span className="text-brand-primary">every choice, made coherent.</span>"
                  </blockquote>
                  <p className="mt-8 text-[10px] uppercase tracking-[0.8em] font-black text-white/30">The Parijata Story</p>
                </motion.div>

                {/* Origin story */}
                <div className="gsap-reveal p-10 md:p-16 border-l-4 border-brand-primary rounded-r-3xl bg-white/[0.02] space-y-4">
                  <p className="text-[11px] uppercase tracking-[0.5em] font-black text-white">Our story</p>
                  <p className="text-xl md:text-2xl font-serif-elegant italic text-white/70 leading-relaxed">
                    Born from a flower on a terrace in Tirupur. The Parijata blooms in the dark and leaves something beautiful at dawn — no announcement, no noise. That's how we believe brands should be built. Strategy first. Every color chosen with intent. Every name coined with care. Every element assembled into one coherent system.
                  </p>
                </div>

                {/* Feature cards */}
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {[
                    { title: 'Strategy-first', desc: 'Brand decisions rooted in what you believe and who you serve — not templates or trends.', icon: '◈' },
                    { title: 'Complete system', desc: 'Strategy, naming, colors, typography, voice, logo, brand manual — everything, together.', icon: '⬡' },
                    { title: 'Yours to keep', desc: 'Complete identity systems you own entirely. No subscriptions, no dependencies.', icon: '◇' },
                  ].map((f, i) => (
                    <motion.div key={i} variants={staggerItem} className="gsap-reveal p-8 md:p-10 border border-white/10 rounded-[2rem] bg-white/[0.02] hover:border-white/20 transition-all group">
                      <span className="text-3xl text-brand-primary block mb-6 group-hover:scale-110 transition-transform inline-block">{f.icon}</span>
                      <h4 className="text-lg font-black uppercase tracking-widest text-white mb-3">{f.title}</h4>
                      <p className="text-sm font-serif-elegant italic text-white/50 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Stats */}
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 md:py-20 border-t border-b border-white/10">
                  {[
                    { num: 47, suffix: '+', label: 'Brands Created' },
                    { num: 12, suffix: '', label: 'Sensory Anchors' },
                    { num: 200, suffix: 'CR', label: 'Revenue Ceiling' },
                    { num: 99, suffix: '%', label: 'Precision Rate' },
                  ].map((s, i) => (
                    <motion.div key={i} variants={staggerItem} className="text-center gsap-reveal">
                      <p className="text-4xl md:text-6xl font-black text-white tabular-nums">
                        <AnimatedCounter end={s.num} suffix={s.suffix} />
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 mt-3">{s.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/5 px-6 md:px-16 py-6 flex justify-between items-center text-white/20 text-xs">
          <span>© 2026 HowIconic</span>
          <span className="font-serif-elegant italic">Built with intent.</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
