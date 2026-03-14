import React, { useEffect, useRef, useState } from 'react';

const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);

  useEffect(() => {
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(isTouchDevice);
    if (isTouchDevice) return;

    let raf: number;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Dot follows immediately
      if (dotRef.current) {
        dotRef.current.style.left = `${pos.current.x - 6}px`;
        dotRef.current.style.top = `${pos.current.y - 6}px`;
      }
      // Ring follows with lerp
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;
      if (ringRef.current) {
        const size = hovering.current ? 60 : 40;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
        ringRef.current.style.left = `${ringPos.current.x - size / 2}px`;
        ringRef.current.style.top = `${ringPos.current.y - size / 2}px`;
        ringRef.current.style.opacity = hovering.current ? '1' : '0.6';
      }
      raf = requestAnimationFrame(animate);
    };

    const onEnter = () => {
      hovering.current = true;
      if (dotRef.current) dotRef.current.style.transform = 'scale(0.5)';
    };
    const onLeave = () => {
      hovering.current = false;
      if (dotRef.current) dotRef.current.style.transform = 'scale(1)';
    };

    const bindHovers = () => {
      document.querySelectorAll('button, a, [role="button"], input, textarea, select').forEach(el => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };

    document.addEventListener('mousemove', onMove);
    bindHovers();
    // Re-bind on DOM changes
    const observer = new MutationObserver(() => bindHovers());
    observer.observe(document.body, { childList: true, subtree: true });
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div ref={dotRef} className="custom-cursor" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  );
};

export default CustomCursor;
