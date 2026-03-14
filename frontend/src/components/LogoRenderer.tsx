import React, { useMemo } from 'react';

interface LogoRendererProps {
  svg: string;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  style?: React.CSSProperties;
}

const LogoRenderer: React.FC<LogoRendererProps> = ({ svg, className, primaryColor = '#f17022', secondaryColor = '#333333', accentColor = '#ffffff', style }) => {
  const sanitizedSvg = useMemo(() => {
    if (!svg || typeof svg !== 'string') {
      return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="${primaryColor}" stroke-width="2" fill="none" opacity="0.1" /></svg>`;
    }
    try {
      let processed = svg.trim();
      processed = processed.replace(/```(svg|xml)?/gi, '').replace(/```/g, '').trim();
      if (!processed.startsWith('<svg')) {
        processed = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${primaryColor}" stroke-width="2">${processed}</svg>`;
      }
      processed = processed
        .replace(/#PRIMARY#/g, primaryColor)
        .replace(/#SECONDARY#/g, secondaryColor)
        .replace(/#ACCENT#/g, accentColor);
      return processed;
    } catch {
      return `<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" stroke="${primaryColor}" stroke-width="1" fill="none" opacity="0.2" /></svg>`;
    }
  }, [svg, primaryColor, secondaryColor, accentColor]);

  return (
    <div className={`brand-svg-container ${className || ''}`} style={{ ...style, width: '100%', height: '100%' }}
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />
  );
};

export default LogoRenderer;
