import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type KeeState = 'idle' | 'thinking' | 'speaking' | 'listening';
type KeeReaction = 'happy' | 'celebrate' | 'error';

// ─── KEE ORB — Animated Parijata ─────────────────────────────────────────────

interface KeeOrbProps {
  size?: number;
  keeState?: KeeState;
  reaction?: KeeReaction | null;
  isFirstMount?: boolean;
}

const KeeOrb: React.FC<KeeOrbProps> = ({ size = 48, keeState = 'idle', reaction = null, isFirstMount = false }) => {
  const [reactionClass, setReactionClass] = useState('');
  const [appeared, setAppeared] = useState(!isFirstMount);

  useEffect(() => {
    if (isFirstMount) {
      // Trigger appear animation
      const t = setTimeout(() => setAppeared(true), 50);
      return () => clearTimeout(t);
    }
  }, [isFirstMount]);

  useEffect(() => {
    if (!reaction) return;
    const cls = `kee-react-${reaction}`;
    setReactionClass(cls);
    const t = setTimeout(() => setReactionClass(''), reaction === 'celebrate' ? 700 : 500);
    return () => clearTimeout(t);
  }, [reaction]);

  const animClass = reactionClass
    ? reactionClass
    : keeState === 'thinking' ? 'kee-thinking'
    : keeState === 'speaking' ? 'kee-speaking'
    : keeState === 'listening' ? 'kee-listening-pulse'
    : 'kee-breathing';

  const entryClass = isFirstMount ? (appeared ? 'kee-appeared' : 'kee-appearing') : '';

  return (
    <div
      className={`kee-orb-wrapper ${entryClass}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Burst ring — only on first mount */}
      {isFirstMount && appeared && (
        <>
          <div className="kee-burst kee-burst-1" style={{ width: size, height: size }} />
          <div className="kee-burst kee-burst-2" style={{ width: size, height: size }} />
        </>
      )}

      {/* Orbit ring for listening state */}
      {keeState === 'listening' && (
        <div className="kee-listen-ring" style={{ width: size + 16, height: size + 16 }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <span
              key={i}
              className="kee-listen-dot"
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'rgba(241,112,34,0.6)',
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateX(${(size + 16) / 2}px) translateY(-50%)`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* The orb itself */}
      <div
        className={`kee-orb ${animClass}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f17022 0%, #ff9a56 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
          willChange: 'transform',
        }}
      >
        {/* Inner parijata mark — white petals pattern */}
        <svg viewBox="0 0 100 100" fill="none" style={{ width: '55%', height: '55%', opacity: 0.85 }}>
          {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
            <ellipse key={i} cx="50" cy="25" rx="7" ry="18" fill="white" opacity={0.7} transform={`rotate(${angle} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="7" fill="white" opacity="0.9" />
          <circle cx="50" cy="50" r="3" fill="#f17022" />
        </svg>
      </div>
    </div>
  );
};

// ─── FLOATING KEE BUTTON ──────────────────────────────────────────────────────

interface FloatingKeeProps {
  chatContext?: { step?: number; stepName?: string };
}

export const FloatingKee: React.FC<FloatingKeeProps> = ({ chatContext }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [keeMsg] = useState("Hi! I'm Kee. Ask me anything about your brand.");

  return (
    <>
      {/* Mini overlay chat */}
      {open && (
        <div
          className="kee-float-overlay"
          style={{
            position: 'fixed',
            bottom: 72,
            right: 24,
            width: 300,
            maxHeight: 400,
            background: 'var(--bg-secondary, #111)',
            border: '1px solid rgba(241,112,34,0.25)',
            borderRadius: 16,
            boxShadow: '0 16px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(241,112,34,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            animation: 'keeFloatOpen 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* Header bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            borderBottom: '1px solid rgba(241,112,34,0.1)',
            flexShrink: 0,
          }}>
            <KeeOrb size={24} keeState="idle" />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f17022', flex: 1 }}>Kee</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle, rgba(255,255,255,0.3))', fontSize: 14, padding: '2px 4px', lineHeight: 1 }}
              title="Close"
            >×</button>
          </div>
          {/* Chat body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 2px' }}>
            <KeeAlive animate={true} speed={20} chatEnabled={true} chatContext={chatContext} style={{ borderRadius: 0, borderLeft: 'none', margin: 0, padding: '12px 14px' }}>
              {keeMsg}
            </KeeAlive>
          </div>
        </div>
      )}

      {/* FAB button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        {/* Tooltip */}
        {hovered && !open && (
          <div style={{
            position: 'absolute',
            bottom: '110%',
            right: 0,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            animation: 'keeTooltip 0.15s ease forwards',
            pointerEvents: 'none',
          }}>
            Ask Kee
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f17022, #ff9a56)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: open
              ? '0 0 0 3px rgba(241,112,34,0.3), 0 8px 24px rgba(241,112,34,0.4)'
              : '0 4px 16px rgba(241,112,34,0.35)',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease',
            animation: open ? 'none' : 'keeBreathing 3s cubic-bezier(0.16,1,0.3,1) infinite',
          }}
          title="Ask Kee"
        >
          <svg viewBox="0 0 100 100" fill="none" style={{ width: 20, height: 20, opacity: 0.9 }}>
            {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => (
              <ellipse key={i} cx="50" cy="25" rx="7" ry="18" fill="white" opacity={0.7} transform={`rotate(${angle} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="7" fill="white" opacity="0.9" />
            <circle cx="50" cy="50" r="3" fill="#f17022" />
          </svg>
        </button>
      </div>
    </>
  );
};

// ─── KEEALIVE COMPONENT ───────────────────────────────────────────────────────

interface KeeAliveProps {
  children: string;
  animate?: boolean;
  speakable?: boolean;
  speed?: number;
  onDone?: () => void;
  chatEnabled?: boolean;
  chatContext?: { step?: number; stepName?: string };
  style?: React.CSSProperties;
  // External state control
  externalKeeState?: KeeState;
}

export interface KeeAliveHandle {
  keeReact: (r: KeeReaction) => void;
  setKeeState: (s: KeeState) => void;
}

const KeeAlive = forwardRef<KeeAliveHandle, KeeAliveProps>((
  {
    children,
    animate = true,
    speakable = true,
    speed = 25,
    onDone,
    chatEnabled = false,
    chatContext,
    style,
    externalKeeState,
  },
  ref,
) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : children);
  const [isTyping, setIsTyping] = useState(animate);
  const [cursorVisible, setCursorVisible] = useState(animate);
  const [cursorFading, setCursorFading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'kee'; text: string; id: number }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [keeState, setKeeStateInternal] = useState<KeeState>('idle');
  const [reaction, setReaction] = useState<KeeReaction | null>(null);
  const [isFirstMount] = useState(true);
  const [entryDone, setEntryDone] = useState(false);

  const textRef = useRef(children);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const chunksRef = useRef<Blob[]>([]);
  const msgIdRef = useRef(0);

  // Derived kee state
  const derivedKeeState: KeeState = externalKeeState
    ?? (chatLoading ? 'thinking'
      : isTyping || isSpeaking ? 'speaking'
      : micActive && isListening ? 'listening'
      : keeState);

  // Expose handle
  useImperativeHandle(ref, () => ({
    keeReact: (r: KeeReaction) => {
      setReaction(r);
      setTimeout(() => setReaction(null), r === 'celebrate' ? 700 : 500);
    },
    setKeeState: (s: KeeState) => setKeeStateInternal(s),
  }));

  // Entry animation — on first mount, start typewriter after 500ms delay
  useEffect(() => {
    if (!isFirstMount) return;
    const t = setTimeout(() => setEntryDone(true), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Typewriter effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!animate) {
      setDisplayedText(children);
      setIsTyping(false);
      setCursorVisible(false);
      return;
    }
    textRef.current = children;
    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);
    setCursorVisible(true);
    setCursorFading(false);

    // Variable-speed typewriter — pause at punctuation
    const tick = () => {
      if (indexRef.current < textRef.current.length) {
        const char = textRef.current[indexRef.current];
        indexRef.current++;
        setDisplayedText(textRef.current.slice(0, indexRef.current));

        // Variable delay based on character
        let delay = speed;
        if (char === ',' || char === ';') delay = 150;
        else if (char === '.' || char === '!' || char === '?') delay = 300;
        else if (char === ' ') delay = speed * 0.7;
        else if ('aeiou'.includes(char.toLowerCase())) delay = speed * 0.8;
        else delay = speed;

        timerRef.current = window.setTimeout(tick, delay);
      } else {
        setIsTyping(false);
        // Cursor fade out
        setTimeout(() => {
          setCursorFading(true);
          setTimeout(() => setCursorVisible(false), 500);
        }, 800);
        onDone?.();
      }
    };

    // Delay start based on entry animation
    const startDelay = isFirstMount && !entryDone ? 500 : 300;
    timerRef.current = window.setTimeout(tick, startDelay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [children, animate, speed, onDone, entryDone]);

  // ── OpenAI TTS ───────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    try {
      const token = localStorage.getItem('howiconic_token');
      if (!token) return;
      setIsSpeaking(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setIsSpeaking(false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play().catch(() => setIsSpeaking(false));
    } catch { setIsSpeaking(false); }
  }, []);

  // Cancel audio + re-speak when text changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
      setIsSpeaking(false);
    }
    if (voiceEnabled && children) {
      const delay = animate ? children.length * speed + 500 : 300;
      const timer = setTimeout(() => speak(children), delay);
      return () => clearTimeout(timer);
    }
  }, [children, voiceEnabled, animate, speed, speak]);

  const transcribeAndSend = useCallback(async (audioBlob: Blob, filename: string) => {
    setChatLoading(true);
    const id = ++msgIdRef.current;
    try {
      const token = localStorage.getItem('howiconic_token');
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (!transcribeRes.ok) { setChatLoading(false); return; }
      const { text } = await transcribeRes.json();
      if (!text?.trim()) { setChatLoading(false); return; }
      const transcript = text.trim();
      setChatHistory(prev => [...prev, { role: 'user', text: transcript, id }]);
      const chatRes = await fetch('/api/guide/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'chat', message: transcript, step: chatContext?.step || 0, step_name: chatContext?.stepName || 'general', history: chatHistory }),
      });
      const data = await chatRes.json();
      const reply = data.message || "I'm here. Ask me something specific.";
      const rid = ++msgIdRef.current;
      setChatHistory(prev => [...prev, { role: 'kee', text: reply, id: rid }]);
      if (voiceEnabled) speak(reply);
    } catch {
      const rid = ++msgIdRef.current;
      setChatHistory(prev => [...prev, { role: 'kee', text: "Something went wrong. Try again.", id: rid }]);
    }
    setChatLoading(false);
  }, [chatContext, chatHistory, voiceEnabled, speak]);

  const detectVoice = useCallback((analyser: AnalyserNode, stream: MediaStream) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const SPEECH_THRESHOLD = 25;
    const SILENCE_DURATION = 1500;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/mp4';
    const filename = mimeType.startsWith('audio/webm') ? 'recording.webm' : 'recording.mp4';
    const blobType = mimeType.startsWith('audio/webm') ? 'audio/webm' : 'audio/mp4';

    const check = () => {
      if (!streamRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      if (avg > SPEECH_THRESHOLD) {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        if (!isRecordingRef.current) {
          isRecordingRef.current = true;
          chunksRef.current = [];
          const recorder = new MediaRecorder(stream, { mimeType });
          recorderRef.current = recorder;
          recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
          recorder.onstop = async () => {
            isRecordingRef.current = false;
            const blob = new Blob(chunksRef.current, { type: blobType });
            if (blob.size > 1000) await transcribeAndSend(blob, filename);
          };
          recorder.start(100);
          setIsListening(true);
        }
      } else {
        if (isRecordingRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = window.setTimeout(() => {
            if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
            setIsListening(false);
            silenceTimerRef.current = null;
          }, SILENCE_DURATION);
        }
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }, [transcribeAndSend]);

  const initMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPermission('granted');
      setMicActive(true);
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyserRef.current = analyser;
      detectVoice(analyser, stream);
    } catch { setMicPermission('denied'); setMicActive(false); }
  }, [detectVoice]);

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setMicActive(false);
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (chatEnabled && micPermission !== 'denied') {
      const timer = setTimeout(() => initMic(), 1500);
      return () => clearTimeout(timer);
    }
  }, [chatEnabled, initMic, micPermission]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next && audioRef.current) { audioRef.current.pause(); setIsSpeaking(false); }
    if (next) speak(children);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const id = ++msgIdRef.current;
    setChatHistory(prev => [...prev, { role: 'user', text: msg, id }]);
    setChatLoading(true);
    try {
      const token = localStorage.getItem('howiconic_token');
      const res = await fetch('/api/guide/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'chat', message: msg, step: chatContext?.step || 0, step_name: chatContext?.stepName || 'general', history: chatHistory }),
      });
      const data = await res.json();
      const reply = data.message || "I'm here. Ask me something specific.";
      const rid = ++msgIdRef.current;
      setChatHistory(prev => [...prev, { role: 'kee', text: reply, id: rid }]);
      if (voiceEnabled) speak(reply);
    } catch {
      const rid = ++msgIdRef.current;
      setChatHistory(prev => [...prev, { role: 'kee', text: "Something went wrong. Try again.", id: rid }]);
    }
    setChatLoading(false);
  };

  const recentHistory = chatHistory.slice(-4);
  const latestId = recentHistory[recentHistory.length - 1]?.id;

  return (
    <div
      className={`kee-alive-root ${isFirstMount ? 'kee-entry' : ''}`}
      style={{
        background: 'var(--kee-bg)',
        borderLeft: '3px solid #f17022',
        borderRadius: '0 12px 12px 0',
        padding: '14px 18px 16px',
        margin: '20px auto',
        maxWidth: 520,
        animation: derivedKeeState !== 'idle' ? 'keeContainerGlow 2s ease-in-out infinite' : 'none',
        transition: 'box-shadow 0.5s ease',
        ...style,
      }}
    >
      {/* Header */}
      <div className="kee-header-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <KeeOrb
          size={36}
          keeState={derivedKeeState}
          reaction={reaction}
          isFirstMount={isFirstMount && !entryDone}
        />
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#f17022', margin: 0, flex: 1,
        }}>Kee</p>
        {speakable && (
          <button
            onClick={toggleVoice}
            className="kee-voice-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, padding: '4px 6px',
              color: voiceEnabled ? '#f17022' : 'var(--text-subtle)',
              transition: 'color 0.2s ease',
            }}
            title={voiceEnabled ? 'Mute Kee' : 'Let Kee speak'}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
        )}
      </div>

      {/* Main message with typewriter */}
      <p style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14,
        lineHeight: 1.7, color: 'var(--text-muted)', margin: 0, minHeight: 24,
      }}>
        {displayedText}
        {cursorVisible && (
          <span
            className={cursorFading ? 'kee-cursor-fade' : ''}
            style={{
              display: 'inline-block', width: 2, height: 14,
              background: '#f17022', marginLeft: 2,
              animation: cursorFading ? 'none' : 'keeCursorBlink 0.6s step-end infinite',
              opacity: cursorFading ? 0 : 1,
              transition: cursorFading ? 'opacity 0.5s ease' : 'none',
              verticalAlign: 'text-bottom',
            }}
          />
        )}
      </p>

      {/* Chat history */}
      {chatHistory.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          {recentHistory.map((msg, i) => {
            const isLatest = msg.id === latestId;
            const isPrev = !isLatest;
            return (
              <div
                key={msg.id}
                className={msg.role === 'user' ? 'kee-msg-user' : 'kee-msg-kee'}
                style={{
                  marginBottom: 8,
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  opacity: isPrev ? 0.7 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  background: msg.role === 'user' ? 'var(--card-bg)' : 'rgba(241,112,34,0.08)',
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  fontFamily: msg.role === 'kee' ? 'Georgia, serif' : 'Inter, sans-serif',
                  fontStyle: msg.role === 'kee' ? 'italic' : 'normal',
                  maxWidth: '85%',
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Always-on conversation */}
      {chatEnabled && (
        <div style={{ marginTop: chatHistory.length > 0 ? 8 : 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '6px 0', marginBottom: 6,
          }}>
            {isListening && (
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: '#f17022', animation: 'keeMicPulse 1.5s ease-in-out infinite',
              }} />
            )}
            {micActive && !isListening && !chatLoading && (
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(241,112,34,0.3)' }} />
            )}
            <span style={{
              fontSize: 10, letterSpacing: '0.15em', fontWeight: 600,
              color: isListening ? 'rgba(241,112,34,0.6)' : 'var(--text-subtle)',
              transition: 'color 0.3s ease',
            }}>
              {chatLoading ? 'thinking...' : isListening ? 'listening...' : micActive ? 'ready — just speak' : micPermission === 'denied' ? 'mic blocked' : 'mic off'}
            </span>
            {micActive && (
              <button onClick={stopMic} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-subtle)' }}>pause</button>
            )}
            {!micActive && micPermission !== 'denied' && (
              <button onClick={initMic} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(241,112,34,0.4)' }}>enable</button>
            )}
          </div>

          {!showTextInput && (
            <button onClick={() => setShowTextInput(true)} style={{ display: 'block', margin: '2px auto 0', background: 'none', border: 'none', color: 'var(--text-subtle)', fontSize: 9, cursor: 'pointer', letterSpacing: '0.1em' }}>
              or type
            </button>
          )}
          {showTextInput && (
            <div className="kee-chat-input-row" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                placeholder="Type to Kee..."
                disabled={chatLoading}
                style={{
                  flex: 1, background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8, padding: '7px 10px',
                  fontSize: 11, color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  background: chatLoading ? 'rgba(241,112,34,0.3)' : '#f17022',
                  border: 'none', borderRadius: 8,
                  padding: '7px 12px', cursor: chatLoading ? 'wait' : 'pointer',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                }}
              >→</button>
            </div>
          )}
        </div>
      )}

      {/* ── All CSS animations ── */}
      <style>{`
        /* ── ORB STATES ─────────────────────────────── */
        @keyframes keeBreathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(241,112,34,0.3); }
          50% { transform: scale(1.06); box-shadow: 0 0 35px rgba(241,112,34,0.5); }
        }
        @keyframes keeThink {
          0% { transform: scale(1) rotate(0deg); box-shadow: 0 0 25px rgba(241,112,34,0.4); }
          50% { transform: scale(1.08) rotate(180deg); box-shadow: 0 0 40px rgba(241,112,34,0.6); }
          100% { transform: scale(1) rotate(360deg); box-shadow: 0 0 25px rgba(241,112,34,0.4); }
        }
        @keyframes keeSpeak {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-3px) scale(1.04); }
          75% { transform: translateY(1px) scale(0.98); }
        }
        @keyframes keeListenPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 4px rgba(241,112,34,0.15); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(241,112,34,0.08); }
        }
        @keyframes keeListenRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* State classes */
        .kee-breathing { animation: keeBreathe 3s cubic-bezier(0.16,1,0.3,1) infinite; }
        .kee-thinking { animation: keeThink 1.5s cubic-bezier(0.16,1,0.3,1) infinite; }
        .kee-speaking { animation: keeSpeak 0.4s cubic-bezier(0.16,1,0.3,1) infinite; }
        .kee-listening-pulse { animation: keeListenPulse 1.8s cubic-bezier(0.16,1,0.3,1) infinite; }

        /* ── ENTRY ANIMATION ─────────────────────────── */
        @keyframes keeAppear {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes keeBurst {
          0% { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .kee-appearing .kee-orb { transform: scale(0); opacity: 0; }
        .kee-appeared .kee-orb { animation: keeAppear 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .kee-burst {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(241,112,34,0.5);
          animation: keeBurst 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
          pointer-events: none;
        }
        .kee-burst-2 { animation-delay: 0.15s; border-color: rgba(241,112,34,0.3); }

        /* ── REACTIONS ───────────────────────────────── */
        @keyframes keeHappy {
          0% { transform: scale(1); }
          40% { transform: scale(1.15); box-shadow: 0 0 30px rgba(241,112,34,0.6); }
          100% { transform: scale(1); }
        }
        @keyframes keeCelebrate {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.12) rotate(180deg); box-shadow: 0 0 40px rgba(241,112,34,0.7); }
          100% { transform: scale(1) rotate(360deg); }
        }
        @keyframes keeError {
          0% { filter: none; }
          30% { filter: hue-rotate(160deg) saturate(1.5); }
          100% { filter: none; }
        }
        .kee-react-happy .kee-orb { animation: keeHappy 0.5s cubic-bezier(0.16,1,0.3,1) forwards !important; }
        .kee-react-celebrate .kee-orb { animation: keeCelebrate 0.6s cubic-bezier(0.16,1,0.3,1) forwards !important; }
        .kee-react-error .kee-orb { animation: keeError 0.5s cubic-bezier(0.16,1,0.3,1) forwards !important; }

        /* ── LISTEN RING ─────────────────────────────── */
        .kee-listen-ring {
          position: absolute;
          border-radius: 50%;
          animation: keeListenRing 2s linear infinite;
          pointer-events: none;
          top: 50%; left: 50%;
          transform-origin: center;
          margin-top: -4px; margin-left: -4px;
          transform: translate(-50%, -50%);
        }

        /* ── TYPEWRITER CURSOR ───────────────────────── */
        @keyframes keeCursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* ── CONTAINER GLOW ──────────────────────────── */
        @keyframes keeContainerGlow {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 20px rgba(241,112,34,0.08); }
        }

        /* ── CHAT ENTRY ANIMATIONS ───────────────────── */
        @keyframes keeMsgSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes keeMsgSlideRight {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .kee-msg-kee { animation: keeMsgSlideUp 0.2s cubic-bezier(0.16,1,0.3,1) both; }
        .kee-msg-user { animation: keeMsgSlideRight 0.2s cubic-bezier(0.16,1,0.3,1) both; }

        /* ── KEE ALIVE ROOT ENTRY ────────────────────── */
        @keyframes keeRootEntry {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kee-entry { animation: keeRootEntry 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }

        /* ── MIC PULSE ───────────────────────────────── */
        @keyframes keeMicPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(241,112,34,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(241,112,34,0); }
        }

        /* ── FLOATING KEE ────────────────────────────── */
        @keyframes keeBreathing {
          0%, 100% { box-shadow: 0 4px 16px rgba(241,112,34,0.35); transform: scale(1); }
          50% { box-shadow: 0 4px 24px rgba(241,112,34,0.55); transform: scale(1.04); }
        }
        @keyframes keeFloatOpen {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes keeTooltip {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── MOBILE ──────────────────────────────────── */
        @media (max-width: 640px) {
          .kee-chat-input-row { gap: 4px !important; }
          .kee-chat-input-row input { font-size: 16px !important; min-width: 0; }
          .kee-header-row { flex-wrap: wrap; }
          .kee-voice-btn { min-width: 32px; min-height: 32px; }
          .kee-float-overlay { width: calc(100vw - 48px) !important; right: 16px !important; }
        }

        /* ── REDUCED MOTION ──────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .kee-orb, .kee-breathing, .kee-thinking, .kee-speaking, .kee-listening-pulse,
          .kee-burst, .kee-listen-ring, .kee-entry, .kee-msg-kee, .kee-msg-user {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
});

KeeAlive.displayName = 'KeeAlive';

export { KeeOrb };
export type { KeeState, KeeReaction, KeeAliveHandle };
export default KeeAlive;
