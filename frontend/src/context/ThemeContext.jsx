import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const themes = {
  light: {
    bg: '#F7F7F5', surface: '#FFFFFF', surface2: '#F2F2F0',
    border: '#E5E5E3', border2: '#D0D0CE',
    txt1: '#111111', txt2: '#555555', txt3: '#999999',
    red: '#C41E3A', redDim: 'rgba(196,30,58,0.08)', redBorder: 'rgba(196,30,58,0.22)',
    navy: '#1A2235', green: '#1A7F5A', amber: '#B45309',
    shadow: '0 2px 8px rgba(0,0,0,0.07)', overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    bg: '#0C0C0E', surface: '#141416', surface2: '#1C1C1F',
    border: '#2A2A2E', border2: '#38383D',
    txt1: '#F0F0EE', txt2: '#A0A09E', txt3: '#606060',
    red: '#E02347', redDim: 'rgba(224,35,71,0.10)', redBorder: 'rgba(224,35,71,0.25)',
    navy: '#E8ECF4', green: '#34D399', amber: '#FBB839',
    shadow: '0 2px 8px rgba(0,0,0,0.3)', overlay: 'rgba(0,0,0,0.6)',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('ujl-theme') : null) || 'light';
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', saved);
    return saved;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ujl-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const c = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggle, c, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'light', toggle: () => {}, c: themes.light, isDark: false };
  return ctx;
}
