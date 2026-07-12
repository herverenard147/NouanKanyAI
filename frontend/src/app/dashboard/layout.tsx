'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Factory, Plug, Bot, Receipt, Settings, LogOut, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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

  const navItems = [
    { href: '/dashboard',             label: 'Tableau de Bord', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/sites',        label: 'Sites',           icon: Factory },
    { href: '/dashboard/appareils',    label: 'Appareils',       icon: Plug },
    { href: '/dashboard/predictions',  label: 'Assistant IA',    icon: Bot },
    { href: '/dashboard/facturation',  label: 'Facturation',     icon: Receipt },
    { href: '/dashboard/admin',        label: 'Admin',           icon: Settings },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Logo */}
        <div style={{ padding: '0 20px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                NouanKanyAI
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', letterSpacing: '0.1em' }}>
                ENERGY PLATFORM
              </div>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div style={{ padding: '0 20px', marginTop: '16px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '20px', padding: '4px 10px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em' }}>SYSTÈMES OPÉRATIONNELS</span>
          </div>
        </div>

        {/* Nav Label */}
        <div style={{ padding: '20px 20px 8px', fontSize: '10px', fontWeight: 700, color: 'rgba(100,116,139,0.7)', letterSpacing: '0.1em', position: 'relative', zIndex: 1 }}>
          NAVIGATION
        </div>

        {/* Nav Links */}
        <div className="sidebar-nav" style={{ position: 'relative', zIndex: 1 }}>
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Footer */}
        <div style={{
          padding: '16px 20px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative', zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: '13px'
            }}>
              {user.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '13px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nom}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{user.type_compte}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '7px', borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top Header */}
        <div style={{
          height: '60px',
          background: 'rgba(13,17,23,0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 40px',
          flexShrink: 0
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '360px', background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px', padding: '8px 14px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>⌕</span>
            <input
              type="text"
              placeholder="Rechercher des audits, métriques..."
              style={{
                border: 'none', background: 'transparent',
                width: '100%', color: '#e2e8f0',
                fontSize: '13px', outline: 'none'
              }}
            />
            <span style={{ fontSize: '10px', color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>⏎</span>
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#10b981',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              padding: '5px 12px', borderRadius: '20px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
              API CONNECTÉE
            </div>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer'
            }}>
              {user.nom.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
