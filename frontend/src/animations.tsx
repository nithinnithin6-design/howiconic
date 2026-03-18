import { useEffect, useRef, useState } from 'react';

// Hook: triggers when element enters viewport
export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // Only animate once
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Component: wraps children with reveal animation
interface RevealProps {
  children: React.ReactNode;
  delay?: number; // ms
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  duration?: number; // ms
  style?: React.CSSProperties;
  className?: string;
}

export function Reveal({ children, delay = 0, direction = 'up', duration = 800, style, className }: RevealProps) {
  const { ref, isVisible } = useReveal();

  const transforms: Record<string, string> = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
    fade: 'translateY(0)',
    scale: 'scale(0.92)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) translateX(0) scale(1)' : transforms[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Component: staggered children reveal
interface StaggerProps {
  children: React.ReactNode[];
  staggerMs?: number;
  direction?: 'up' | 'left' | 'scale';
  style?: React.CSSProperties;
}

export function Stagger({ children, staggerMs = 100, direction = 'up', style }: StaggerProps) {
  const { ref, isVisible } = useReveal();

  return (
    <div ref={ref} style={style}>
      {children.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : direction === 'up' ? 'translateY(30px)' : direction === 'left' ? 'translateX(30px)' : 'scale(0.9)',
            transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerMs}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerMs}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Component: text that reveals letter by letter
interface TextRevealProps {
  text: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  style?: React.CSSProperties;
  className?: string;
  staggerMs?: number;
}

export function TextReveal({ text, tag: Tag = 'h1', style, className, staggerMs = 30 }: TextRevealProps) {
  const { ref, isVisible } = useReveal();

  return (
    <Tag ref={ref as any} style={style} className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: `opacity 400ms ease ${i * staggerMs}ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerMs}ms`,
            whiteSpace: char === ' ' ? 'pre' : undefined,
          }}
        >
          {char}
        </span>
      ))}
    </Tag>
  );
}
