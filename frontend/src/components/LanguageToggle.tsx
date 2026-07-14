'use client';

import { useLanguage } from '@/lib/i18n';

const FLAGS = { fr: '🇫🇷', en: '🇺🇸' };

export default function LanguageToggle({ dark }: { dark?: boolean }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
        border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.09)',
        borderRadius: '50%', width: '34px', height: '34px',
        fontSize: '17px', cursor: 'pointer', lineHeight: 1,
      }}
    >
      <span role="img" aria-label={lang === 'fr' ? 'Français' : 'English'}>{FLAGS[lang]}</span>
    </button>
  );
}
