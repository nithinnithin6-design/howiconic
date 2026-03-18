import React, { useState } from 'react';
import { login, register } from '../api';
import { User } from '../types';
import KeeAlive from './KeeAlive';
import { Reveal as AnimReveal } from '../animations';

interface AuthScreenProps {
  onAuth: (user: User) => void;
  onBack?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth, onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(email, password)
        : await register(email, password, name);
      onAuth(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[300] overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        [data-theme="light"] .auth-input {
          background: rgba(26,26,26,0.04) !important;
          border-color: rgba(26,26,26,0.12) !important;
          color: #1a1a1a !important;
        }
        [data-theme="light"] .auth-input::placeholder { color: rgba(26,26,26,0.25) !important; }
        [data-theme="light"] .auth-label { color: rgba(26,26,26,0.45) !important; }
        [data-theme="light"] .auth-title { color: #1a1a1a !important; }
        [data-theme="light"] .auth-sub { color: rgba(26,26,26,0.45) !important; }
        [data-theme="light"] .auth-back { color: rgba(26,26,26,0.35) !important; }
        [data-theme="light"] .auth-back:hover { color: #1a1a1a !important; }
        [data-theme="light"] .auth-footer-text { color: rgba(26,26,26,0.2) !important; }
      `}</style>
      <div className="absolute inset-0 blueprint-grid opacity-[0.04]" />

      {/* Bloom */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f17022]/[0.07] blur-[150px] animate-pulse" />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-white transition-all cursor-pointer group"
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          Back
        </button>
      )}

      <AnimReveal direction="scale" duration={700} style={{ width: '100%', maxWidth: '32rem', padding: '0 1.5rem' }}>
      <div className="relative z-10 w-full max-w-lg px-6 md:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
                <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.9} transform={`rotate(${angle} 50 50)`} />
              ))}
              <circle cx="50" cy="50" r="8" fill="#f17022" style={{ filter: 'drop-shadow(0 0 8px rgba(241,112,34,0.6))' }} />
              <circle cx="50" cy="50" r="3" fill="white" opacity="0.8" />
            </svg>
          </div>
          <h1 className="auth-title font-serif-display text-5xl md:text-7xl uppercase italic font-black tracking-tighter text-white">
            HOWICONIC
          </h1>
          <p className="auth-sub text-[11px] uppercase tracking-[1.2em] text-white/50 font-black">
            Brand Identity Engine
          </p>
          <KeeAlive animate={true}>
            {mode === 'login' ? 'Your brands are one step away.' : 'This takes two minutes. Then we build.'}
          </KeeAlive>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-10 backdrop-blur-xl rounded-[2rem] space-y-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex gap-2 mb-8">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-full text-[10px] uppercase font-black tracking-[0.5em] transition-all ${
                  mode === 'login' ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-3 rounded-full text-[10px] uppercase font-black tracking-[0.5em] transition-all ${
                  mode === 'register' ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Sign up
              </button>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="auth-label text-[9px] uppercase tracking-[0.5em] text-white/30 font-black">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="auth-input input-glow w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg font-serif-elegant italic outline-none focus:border-brand-primary transition-all text-white placeholder:text-white/10"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="auth-label text-[9px] uppercase tracking-[0.5em] text-white/30 font-black">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="auth-input input-glow w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg font-serif-elegant italic outline-none focus:border-brand-primary transition-all text-white placeholder:text-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="auth-label text-[9px] uppercase tracking-[0.5em] text-white/30 font-black">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input input-glow w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg font-serif-elegant italic outline-none focus:border-brand-primary transition-all text-white placeholder:text-white/10"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm font-serif-elegant italic">{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-interactive w-full py-5 md:py-6 bg-[#f17022] text-white rounded-full text-[12px] md:text-[13px] uppercase font-black tracking-[0.6em] md:tracking-[0.8em] transition-all shadow-[0_12px_40px_rgba(241,112,34,0.25)] ${
              loading ? 'opacity-50 cursor-wait' : 'hover:bg-[#d95e15] hover:shadow-[0_16px_50px_rgba(241,112,34,0.35)] active:scale-[0.98] cursor-pointer'
            }`}
          >
            {loading ? 'One moment...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer-text text-center mt-12 text-[9px] uppercase tracking-[0.5em] text-white/20 font-black">
          Build what lasts.
        </p>
      </div>
      </AnimReveal>
    </div>
  );
};

export default AuthScreen;
