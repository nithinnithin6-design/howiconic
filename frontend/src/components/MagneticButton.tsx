import React, { useRef, useCallback } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  strength?: number;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ children, className = '', onClick, disabled, type = 'button', strength = 0.3 }) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  }, [strength, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)';
  }, []);

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {children}
    </button>
  );
};

export default MagneticButton;
