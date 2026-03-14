import React, { useState } from 'react';
import { login, register } from '../api';
import { User } from '../types';

interface AuthScreenProps {
  onAuth: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
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
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[300] overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-[0.06]" />

      {/* Bloom background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-primary/10 blur-[150px] animate-pulse" />

      <div className="relative z-10 w-full max-w-lg px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <g transform="translate(50, 50)">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <path key={angle} d="M0 0 C-6 -8, -10 -25, 0 -35 C10 -25, 6 -8, 0 0 Z" fill="white" transform={`rotate(${angle})`} />
                ))}
                <circle cx="0" cy="0" r="6" fill="#f17022" style={{ filter: 'drop-shadow(0 0 12px #f17022)' }} />
              </g>
            </svg>
          </div>
          <h1 className="font-serif-display text-5xl md:text-7xl uppercase italic font-black tracking-tighter text-white">
            HOWICONIC
          </h1>
          <p className="text-[11px] uppercase tracking-[1.2em] text-white/50 font-black">
            Sovereign Identity Engine
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-10 bg-black/70 backdrop-blur-xl border border-white/10 rounded-[2rem] space-y-6">
            <div className="flex gap-2 mb-8">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-full text-[10px] uppercase font-black tracking-[0.5em] transition-all ${
                  mode === 'login' ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Access
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-3 rounded-full text-[10px] uppercase font-black tracking-[0.5em] transition-all ${
                  mode === 'register' ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Initialize
              </button>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.5em] text-white/30 font-black">Identity</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg font-serif-elegant italic outline-none focus:border-brand-primary transition-all text-white placeholder:text-white/10"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.5em] text-white/30 font-black">Credential</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg font-serif-elegant italic outline-none focus:border-brand-primary transition-all text-white placeholder:text-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.5em] text-white/30 font-black">Passphrase</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg font-serif-elegant italic outline-none focus:border-brand-primary transition-all text-white placeholder:text-white/10"
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
            className={`w-full py-6 bg-white text-black rounded-full text-[13px] uppercase font-black tracking-[0.8em] transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] ${
              loading ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
            }`}
          >
            {loading ? 'Synchronizing...' : mode === 'login' ? 'Authenticate' : 'Initialize System'}
          </button>
        </form>

        <p className="text-center mt-12 text-[9px] uppercase tracking-[0.5em] text-white/20 font-black">
          Sovereign Engine v7.0 — Industrial Grade
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
