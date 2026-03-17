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
  children: string;
  animate?: boolean;
  speakable?: boolean;
  speed?: number;
  onDone?: () => void;
  chatEnabled?: boolean; // Show chat input
  chatContext?: { step?: number; stepName?: string }; // Context for chat
}

const KeeAlive: React.FC<KeeAliveProps> = ({
  children,
  animate = true,
  speakable = true,
  speed = 25,
  onDone,
  chatEnabled = false,
  chatContext,
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : children);
  const [isTyping, setIsTyping] = useState(animate);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showTextInput, setShowTextInput] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'kee'; text: string }>>([]);
  const [isListening, setIsListening] = useState(false);
  const textRef = useRef(children);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Typewriter effect
  useEffect(() => {
    if (!animate) {
      setDisplayedText(children);
      setIsTyping(false);
      return;
    }
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
    timerRef.current = window.setTimeout(tick, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [children, animate, speed, onDone]);

  // OpenAI TTS
  const speak = useCallback(async (text: string) => {
    try {
      const token = localStorage.getItem('howiconic_token');
      if (!token) return;

      setIsSpeaking(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        setIsSpeaking(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.play().catch(() => setIsSpeaking(false));
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Auto-speak when voice enabled and text changes
  useEffect(() => {
    if (voiceEnabled && children) {
      const delay = animate ? children.length * speed + 500 : 300;
      const timer = setTimeout(() => speak(children), delay);
      return () => clearTimeout(timer);
    }
  }, [children, voiceEnabled, animate, speed, speak]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    if (next) speak(children);
  };

  // Voice input via Web Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        setChatInput(transcript.trim());
        setChatHistory(prev => [...prev, { role: 'user', text: transcript.trim() }]);
        setChatLoading(true);
        // Auto-enable voice when user speaks
        setVoiceEnabled(true);

        (async () => {
          try {
            const token = localStorage.getItem('howiconic_token');
            const res = await fetch('/api/guide/message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                action: 'chat',
                message: transcript.trim(),
                step: chatContext?.step || 0,
                step_name: chatContext?.stepName || 'general',
              }),
            });
            const data = await res.json();
            const reply = data.message || "I'm here. Ask me something specific.";
            setChatHistory(prev => [...prev, { role: 'kee', text: reply }]);
            // Always speak reply when voice input was used
            speak(reply);
          } catch {
            setChatHistory(prev => [...prev, { role: 'kee', text: "Something went wrong. Try again." }]);
          }
          setChatLoading(false);
          setChatInput('');
        })();
      }
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Chat with Kee
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);

    try {
      const token = localStorage.getItem('howiconic_token');
      const res = await fetch('/api/guide/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'chat',
          message: msg,
          step: chatContext?.step || 0,
          step_name: chatContext?.stepName || 'general',
        }),
      });
      const data = await res.json();
      const reply = data.message || "I'm here. Ask me something specific.";
      setChatHistory(prev => [...prev, { role: 'kee', text: reply }]);
      if (voiceEnabled) speak(reply);
    } catch {
      setChatHistory(prev => [...prev, { role: 'kee', text: "Something went wrong. Try again." }]);
    }
    setChatLoading(false);
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <KeeAvatar speaking={isTyping || isSpeaking} />
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#f17022', margin: 0, flex: 1,
        }}>Kee</p>
        {speakable && (
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

      {/* Main message */}
      <p style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14,
        lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0, minHeight: 24,
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

      {/* Chat history */}
      {chatHistory.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          {chatHistory.slice(-4).map((msg, i) => (
            <div key={i} style={{
              marginBottom: 8,
              textAlign: msg.role === 'user' ? 'right' : 'left',
            }}>
              <span style={{
                display: 'inline-block',
                background: msg.role === 'user' ? 'rgba(255,255,255,0.06)' : 'rgba(241,112,34,0.08)',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 12,
                color: msg.role === 'user' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.55)',
                fontFamily: msg.role === 'kee' ? 'Georgia, serif' : 'Inter, sans-serif',
                fontStyle: msg.role === 'kee' ? 'italic' : 'normal',
                maxWidth: '85%',
                lineHeight: 1.5,
              }}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Voice-first interaction */}
      {chatEnabled && (
        <div style={{ marginTop: chatHistory.length > 0 ? 8 : 12 }}>
          {/* Primary: Mic button — large, centered */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <button
              onClick={toggleListening}
              disabled={chatLoading}
              style={{
                background: isListening ? '#f17022' : 'rgba(241,112,34,0.12)',
                border: isListening ? '2px solid #f17022' : '2px solid rgba(241,112,34,0.25)',
                borderRadius: '50%',
                cursor: chatLoading ? 'wait' : 'pointer',
                color: isListening ? '#fff' : '#f17022',
                fontSize: 20,
                transition: 'all 0.2s ease',
                animation: isListening ? 'keeMicPulse 1.5s ease-in-out infinite' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, flexShrink: 0,
              }}
              title={isListening ? 'Stop listening' : 'Speak to Kee'}
            >
              {chatLoading ? '...' : isListening ? '⏺' : '🎤'}
            </button>
          </div>
          <p style={{
            textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.1em', margin: '0 0 6px',
          }}>
            {isListening ? 'listening...' : chatLoading ? 'thinking...' : 'tap to speak'}
          </p>

          {/* Secondary: Type instead (collapsed by default) */}
          {!showTextInput && (
            <button
              onClick={() => setShowTextInput(true)}
              style={{
                display: 'block', margin: '4px auto 0', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.15)', fontSize: 9, cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              or type instead
            </button>
          )}
          {showTextInput && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                placeholder="Type to Kee..."
                disabled={chatLoading || isListening}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '7px 10px',
                  fontSize: 11, color: 'rgba(255,255,255,0.5)',
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
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes keeBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes keeGlow { 0%, 100% { box-shadow: none; } 50% { box-shadow: 0 0 20px rgba(241,112,34,0.08); } }
        @keyframes keeCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes keeMicPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(241,112,34,0.4); } 50% { box-shadow: 0 0 0 8px rgba(241,112,34,0); } }
      `}</style>
    </div>
  );
};

export default KeeAlive;
