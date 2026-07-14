'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function LanguageToggle({ dark }: { dark?: boolean }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
        border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.09)',
        color: dark ? '#e2e8f0' : '#334155',
        borderRadius: '20px', padding: '6px 12px',
        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
        letterSpacing: '0.03em'
      }}
    >
      <Languages size={14} />
      {lang.toUpperCase()}
    </button>
  );
}
