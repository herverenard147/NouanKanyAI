import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'NouanKanyAI - NouanKanyAI',
  description: 'Gestion intelligente d\'énergie',
};

// Applique le thème sauvegardé avant le premier rendu React pour éviter un
// flash du thème clair par défaut le temps que ThemeProvider s'hydrate.
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('nk_theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
