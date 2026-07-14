'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle({ dark }: { dark?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
        border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.09)',
        color: dark ? '#e2e8f0' : '#334155',
        borderRadius: '50%', width: '34px', height: '34px',
        cursor: 'pointer',
      }}
    >
      {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
