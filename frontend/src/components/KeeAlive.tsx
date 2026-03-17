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
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'kee'; text: string }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

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

  // Cancel audio + re-speak when text changes (keeps voice and text in sync)
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
    try {
      const token = localStorage.getItem('howiconic_token');

      // Step 1: Transcribe with Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!transcribeRes.ok) {
        setChatLoading(false);
        return;
      }

      const { text } = await transcribeRes.json();
      if (!text || !text.trim()) {
        setChatLoading(false);
        return;
      }

      const transcript = text.trim();
      setChatHistory(prev => [...prev, { role: 'user', text: transcript }]);

      // Step 2: Send to Kee
      const chatRes = await fetch('/api/guide/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'chat',
          message: transcript,
          step: chatContext?.step || 0,
          step_name: chatContext?.stepName || 'general',
          history: chatHistory,
        }),
      });

      const data = await chatRes.json();
      const reply = data.message || "I'm here. Ask me something specific.";
      setChatHistory(prev => [...prev, { role: 'kee', text: reply }]);
      if (voiceEnabled) speak(reply);
    } catch {
      setChatHistory(prev => [...prev, { role: 'kee', text: "Something went wrong. Try again." }]);
    }
    setChatLoading(false);
  }, [chatContext, chatHistory, voiceEnabled, speak]);

  const detectVoice = useCallback((analyser: AnalyserNode, stream: MediaStream) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const SPEECH_THRESHOLD = 25;
    const SILENCE_DURATION = 1500;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/mp4';
    const filename = mimeType.startsWith('audio/webm') ? 'recording.webm' : 'recording.mp4';
    const blobType = mimeType.startsWith('audio/webm') ? 'audio/webm' : 'audio/mp4';

    const check = () => {
      if (!streamRef.current) return; // Stopped

      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg > SPEECH_THRESHOLD) {
        // Voice detected
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (!isRecordingRef.current) {
          // Start recording
          isRecordingRef.current = true;
          chunksRef.current = [];

          const recorder = new MediaRecorder(stream, { mimeType });
          recorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            isRecordingRef.current = false;
            const blob = new Blob(chunksRef.current, { type: blobType });
            if (blob.size > 1000) {
              await transcribeAndSend(blob, filename);
            }
          };

          recorder.start(100);
          setIsListening(true);
        }
      } else {
        // Silence
        if (isRecordingRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = window.setTimeout(() => {
            if (recorderRef.current && recorderRef.current.state === 'recording') {
              recorderRef.current.stop();
            }
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
    } catch {
      setMicPermission('denied');
      setMicActive(false);
    }
  }, [detectVoice]);

  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setMicActive(false);
    setIsListening(false);
  }, []);

  // Auto-start mic when chatEnabled
  useEffect(() => {
    if (chatEnabled && micPermission !== 'denied') {
      const timer = setTimeout(() => initMic(), 1500);
      return () => clearTimeout(timer);
    }
  }, [chatEnabled, initMic, micPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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

  // Chat with Kee (text input)
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
          history: chatHistory,
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

      {/* Always-on conversation */}
      {chatEnabled && (
        <div style={{ marginTop: chatHistory.length > 0 ? 8 : 12 }}>
          {/* Listening indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '6px 0', marginBottom: 6,
          }}>
            {isListening && (
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: '#f17022',
                animation: 'keeMicPulse 1.5s ease-in-out infinite',
              }} />
            )}
            {micActive && !isListening && !chatLoading && (
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: 'rgba(241,112,34,0.3)',
              }} />
            )}
            <span style={{
              fontSize: 10,
              color: isListening ? 'rgba(241,112,34,0.6)' : chatLoading ? 'rgba(255,255,255,0.3)' : micActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
              letterSpacing: '0.15em', fontWeight: 600,
              transition: 'color 0.3s ease',
            }}>
              {chatLoading ? 'thinking...' : isListening ? 'listening...' : micActive ? 'ready — just speak' : micPermission === 'denied' ? 'mic blocked' : 'mic off'}
            </span>
            {micActive && (
              <button
                onClick={stopMic}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, color: 'rgba(255,255,255,0.15)',
                }}
              >
                pause
              </button>
            )}
            {!micActive && micPermission !== 'denied' && (
              <button
                onClick={initMic}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, color: 'rgba(241,112,34,0.4)',
                }}
              >
                enable
              </button>
            )}
          </div>

          {/* Type instead */}
          {!showTextInput && (
            <button
              onClick={() => setShowTextInput(true)}
              style={{
                display: 'block', margin: '2px auto 0', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.12)', fontSize: 9, cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              or type
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
                disabled={chatLoading}
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
