import React, { useState, useEffect, useRef, useCallback } from 'react';

// Mini Parijata mark for Kee's avatar
const KeeAvatar = ({ speaking }: { speaking: boolean }) => (
  <svg viewBox="0 0 100 100" fill="none" style={{
    width: 20, height: 20, flexShrink: 0,
    animation: speaking ? 'keeBreathe 2s ease-in-out infinite' : 'none',
    filter: speaking ? 'drop-shadow(0 0 6px rgba(241,112,34,0.4))' : 'none',
    transition: 'filter 0.3s ease',
  }}>
    {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
      <ellipse key={i} cx="50" cy="25" rx="8" ry="20" fill="white" opacity={0.85} transform={`rotate(${angle} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="8" fill="#f17022" />
    <circle cx="50" cy="50" r="3" fill="white" opacity="0.8" />
  </svg>
);

interface KeeAliveProps {
  children: string; // Text Kee will say
  animate?: boolean; // Whether to typewriter-animate (default true)
  speakable?: boolean; // Whether to show voice toggle (default true)
  speed?: number; // Typing speed in ms per char (default 25)
  onDone?: () => void; // Called when typing finishes
}

const KeeAlive: React.FC<KeeAliveProps> = ({
  children,
  animate = true,
  speakable = true,
  speed = 25,
  onDone
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : children);
  const [isTyping, setIsTyping] = useState(animate);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const textRef = useRef(children);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (!animate) {
      setDisplayedText(children);
      setIsTyping(false);
      return;
    }

    // Reset if text changes
    textRef.current = children;
    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);

    const tick = () => {
      if (indexRef.current < textRef.current.length) {
        indexRef.current++;
        setDisplayedText(textRef.current.slice(0, indexRef.current));
        timerRef.current = window.setTimeout(tick, speed);
      } else {
        setIsTyping(false);
        onDone?.();
      }
    };

    timerRef.current = window.setTimeout(tick, 300); // Small delay before starting

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [children, animate, speed, onDone]);

  // Voice synthesis
  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(children);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira') ||
      (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [children]);

  // Auto-speak when voice is enabled and text changes
  useEffect(() => {
    if (voiceEnabled && children) {
      // Wait for typing to finish, then speak
      const delay = animate ? children.length * speed + 500 : 300;
      const timer = setTimeout(speak, delay);
      return () => clearTimeout(timer);
    }
  }, [children, voiceEnabled, animate, speed, speak]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (next) speak();
  };

  return (
    <div style={{
      background: 'rgba(241,112,34,0.04)',
      borderLeft: '3px solid #f17022',
      borderRadius: '0 12px 12px 0',
      padding: '14px 18px 16px',
      margin: '20px auto', maxWidth: 520,
      animation: (isTyping || isSpeaking) ? 'keeGlow 2s ease-in-out infinite' : 'none',
      transition: 'box-shadow 0.5s ease',
    }}>
      {/* Header: avatar + label + voice toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <KeeAvatar speaking={isTyping || isSpeaking} />
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#f17022', margin: 0, flex: 1,
        }}>Kee</p>
        {speakable && 'speechSynthesis' in window && (
          <button
            onClick={toggleVoice}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, padding: '2px 4px',
              color: voiceEnabled ? '#f17022' : 'rgba(255,255,255,0.2)',
              transition: 'color 0.2s ease',
            }}
            title={voiceEnabled ? 'Mute Kee' : 'Let Kee speak'}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
        )}
      </div>

      {/* Text with cursor */}
      <p style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14,
        lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0,
        minHeight: 24,
      }}>
        {displayedText}
        {isTyping && (
          <span style={{
            display: 'inline-block', width: 2, height: 14,
            background: '#f17022', marginLeft: 2,
            animation: 'keeCursor 0.6s step-end infinite',
            verticalAlign: 'text-bottom',
          }} />
        )}
      </p>

      <style>{`
        @keyframes keeBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes keeGlow {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 20px rgba(241,112,34,0.08); }
        }
        @keyframes keeCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default KeeAlive;
