import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NouanKanyAI - NouanKanyAI',
  description: 'Gestion intelligente d\'énergie',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
