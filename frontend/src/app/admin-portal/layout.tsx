'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.platform_role) {
        // Portail distinct du dashboard client : un utilisateur sans rôle plateforme
        // (admin/superadmin) est renvoyé vers l'accueil, pas vers /dashboard.
        router.push('/');
        return;
      }
      setUser(currentUser);
      setAuthorized(true);
    };
    check();
  }, [router]);

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  if (!authorized) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', borderBottom: '1px solid var(--surface-border)',
        backgroundColor: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={20} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>NouanKanyAI — Portail Admin</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {t('admin', 'connectedAs')} {user?.nom} ({user?.platform_role === 'superadmin' ? 'Superadmin' : 'Admin'})
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <LanguageToggle />
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}
          >
            <LogOut size={14} /> {t('admin', 'logoutBtn')}
          </button>
        </div>
      </div>
      <div style={{ padding: '32px' }}>
        {children}
      </div>
    </div>
  );
}
