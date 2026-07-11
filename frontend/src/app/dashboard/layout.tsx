'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, CreditCard, Plug, LineChart, LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null; // ou un loader

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '10px 0', marginBottom: '20px' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '24px', fontWeight: 800, margin: 0 }}>
            NouanKanyAI
          </h1>
        </div>

        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{user.nom}</div>
          <div style={{ fontSize: '13px', color: 'var(--secondary)' }}>{user.type_compte}</div>
        </div>

        <div className="sidebar-nav">
          <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Tableau de Bord</span>
          </Link>
          <Link href="/dashboard/abonnement" className={`nav-item ${pathname.includes('/abonnement') ? 'active' : ''}`}>
            <CreditCard size={20} />
            <span>Abonnement</span>
          </Link>
          <Link href="/dashboard/appareils" className={`nav-item ${pathname.includes('/appareils') ? 'active' : ''}`}>
            <Plug size={20} />
            <span>Appareils</span>
          </Link>
          <Link href="/dashboard/predictions" className={`nav-item ${pathname.includes('/predictions') ? 'active' : ''}`}>
            <LineChart size={20} />
            <span>Prédictions</span>
          </Link>
        </div>

        <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '24px', marginTop: 'auto' }}>
          <div className="nav-item" onClick={handleLogout} style={{ color: '#F56565' }}>
            <LogOut size={20} />
            <span>Se déconnecter</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {children}
      </div>
    </div>
  );
}
