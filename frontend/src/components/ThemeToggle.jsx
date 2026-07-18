import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Apple/iOS-style sliding switch for light/dark mode — a pill track with a
// sun/moon icon fixed at each end and a circular knob that slides over
// whichever one is active. Replaces the old bare icon-button toggle used
// across every layout's header.
export default function ThemeToggle() {
  const { isDark, toggle, c } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'relative',
        width: '50px', height: '28px',
        minWidth: '50px', minHeight: '28px',
        flexShrink: 0,
        border: `1px solid ${c.border}`,
        borderRadius: '999px',
        background: isDark ? c.navy : c.surface2,
        cursor: 'pointer',
        padding: 0,
        display: 'flex', alignItems: 'center',
        transition: 'background 0.25s ease',
      }}>
      <span style={{ position: 'absolute', left: '6px', display: 'flex', color: isDark ? c.txt3 : c.amber }}>
        <Sun size={13} />
      </span>
      <span style={{ position: 'absolute', right: '6px', display: 'flex', color: isDark ? c.txt1 : c.txt3 }}>
        <Moon size={13} />
      </span>
      <span style={{
        position: 'absolute', top: '2px', left: '2px',
        width: '22px', height: '22px',
        borderRadius: '50%',
        background: c.surface,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transform: isDark ? 'translateX(22px)' : 'translateX(0)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </button>
  );
}
