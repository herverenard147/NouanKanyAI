'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Factory, Plug, Bot, Receipt, Settings, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser({
          nom: session.user.user_metadata?.nom || session.user.email,
          email: session.user.email,
          type_compte: session.user.user_metadata?.role || 'Utilisateur'
        });
      } else {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '0 24px', marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '20px', fontWeight: 800, margin: 0 }}>
            NouanKanyAI
          </h1>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '4px' }}>
            INDUSTRIAL NODE
          </div>
        </div>

        <div className="sidebar-nav">
          <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Tableau de Bord</span>
          </Link>
          <Link href="/dashboard/sites" className={`nav-item ${pathname.includes('/sites') ? 'active' : ''}`}>
            <Factory size={18} />
            <span>Sites</span>
          </Link>
          <Link href="/dashboard/appareils" className={`nav-item ${pathname.includes('/appareils') ? 'active' : ''}`}>
            <Plug size={18} />
            <span>Appareils</span>
          </Link>
          <Link href="/dashboard/predictions" className={`nav-item ${pathname.includes('/predictions') ? 'active' : ''}`}>
            <Bot size={18} />
            <span>Assistant IA</span>
          </Link>
          <Link href="/dashboard/facturation" className={`nav-item ${pathname.includes('/facturation') ? 'active' : ''}`}>
            <Receipt size={18} />
            <span>Facturation</span>
          </Link>
          <Link href="/dashboard/admin" className={`nav-item ${pathname.includes('/admin') ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Admin</span>
          </Link>
        </div>

        <div style={{ padding: '24px', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user.nom.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '13px' }}>{user.nom}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.type_compte}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top Header */}
        <div style={{ height: '64px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '400px', backgroundColor: 'var(--background-alt)', borderRadius: '6px', padding: '8px 16px', border: '1px solid var(--surface-border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>🔍 Search audits, invoices, or metrics...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-light)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--primary)' }}>
              <ShieldCheck size={14} color="var(--primary)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>CERTIFIED NODE</span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
