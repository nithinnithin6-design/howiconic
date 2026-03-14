import { useCallback, useRef, useState } from 'react';

// Web Audio API sound synthesizer - no external files needed
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playClick() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.08);
}

function playWhoosh() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.25);
  filter.Q.value = 2;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

function playChime() {
  if (!audioCtx) return;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

export function useSound() {
  const [muted, setMuted] = useState(true);
  const mutedRef = useRef(true);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      mutedRef.current = !prev;
      if (!prev === false && audioCtx?.state === 'suspended') audioCtx.resume();
      return !prev;
    });
  }, []);

  const click = useCallback(() => { if (!mutedRef.current) playClick(); }, []);
  const whoosh = useCallback(() => { if (!mutedRef.current) playWhoosh(); }, []);
  const chime = useCallback(() => { if (!mutedRef.current) playChime(); }, []);

  return { muted, toggleMute, click, whoosh, chime };
}
