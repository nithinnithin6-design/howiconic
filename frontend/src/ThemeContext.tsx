import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('howiconic_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('howiconic_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg', '#faf8f5');
      root.style.setProperty('--bg-secondary', '#f5f0ea');
      root.style.setProperty('--text', '#1a1a1a');
      root.style.setProperty('--text-muted', 'rgba(26,26,26,0.55)');
      root.style.setProperty('--text-subtle', 'rgba(26,26,26,0.25)');
      root.style.setProperty('--accent', '#f17022');
      root.style.setProperty('--card-bg', 'rgba(26,26,26,0.03)');
      root.style.setProperty('--border', 'rgba(26,26,26,0.08)');
      root.style.setProperty('--kee-bg', 'rgba(241,112,34,0.06)');
      root.style.setProperty('--shadow', '0 2px 12px rgba(0,0,0,0.06)');
      root.style.setProperty('--overlay', 'rgba(250,248,245,0.92)');
      root.style.setProperty('--input-bg', 'rgba(26,26,26,0.04)');
      root.style.setProperty('--nav-bg', 'rgba(250,248,245,0.93)');
      root.style.setProperty('--mobile-nav-bg', 'rgba(250,248,245,0.96)');
      root.style.setProperty('--sidebar-bg', '#faf8f5');
      root.style.setProperty('--brand-canvas', '#faf8f5');
      root.style.setProperty('--brand-text', '#1a1a1a');
    } else {
      root.style.setProperty('--bg', '#0a0a0a');
      root.style.setProperty('--bg-secondary', '#111111');
      root.style.setProperty('--text', '#ffffff');
      root.style.setProperty('--text-muted', 'rgba(255,255,255,0.5)');
      root.style.setProperty('--text-subtle', 'rgba(255,255,255,0.25)');
      root.style.setProperty('--accent', '#f17022');
      root.style.setProperty('--card-bg', 'rgba(255,255,255,0.03)');
      root.style.setProperty('--border', 'rgba(255,255,255,0.08)');
      root.style.setProperty('--kee-bg', 'rgba(241,112,34,0.04)');
      root.style.setProperty('--shadow', 'none');
      root.style.setProperty('--overlay', 'rgba(0,0,0,0.85)');
      root.style.setProperty('--input-bg', 'rgba(255,255,255,0.04)');
      root.style.setProperty('--nav-bg', 'rgba(10,10,10,0.93)');
      root.style.setProperty('--mobile-nav-bg', 'rgba(10,10,10,0.96)');
      root.style.setProperty('--sidebar-bg', '#0a0a0a');
      root.style.setProperty('--brand-canvas', '#0a0a0a');
      root.style.setProperty('--brand-text', '#f5f5f5');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
