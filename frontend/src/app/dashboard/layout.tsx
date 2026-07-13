'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Factory, Plug, Bot, Receipt, Settings, LogOut, Zap, Menu, X, User as UserIcon } from 'lucide-react';
import { signOut, getCurrentUser, authHeaders } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import ChatWidget from './ChatWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileNom, setProfileNom] = useState('');
  const [profileTypeCompte, setProfileTypeCompte] = useState('Particulier');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Ferme la sidebar mobile à chaque changement de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser({
          nom: currentUser.nom || currentUser.email,
          email: currentUser.email,
          type_compte: currentUser.role || 'Utilisateur'
        });
        setProfileNom(currentUser.nom || '');
        setProfileTypeCompte(currentUser.type_compte || 'Particulier');
      } else {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const openProfile = () => {
    setProfileMsg('');
    setIsProfileOpen(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ nom: profileNom, type_compte: profileTypeCompte })
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((u: any) => ({ ...u, nom: updated.nom, type_compte: updated.type_compte }));
        setProfileMsg('Profil mis à jour avec succès.');
      } else {
        setProfileMsg('Erreur lors de la mise à jour.');
      }
    } catch {
      setProfileMsg('Erreur lors de la mise à jour.');
    } finally {
      setSavingProfile(false);
    }
  };

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
      {/* Overlay mobile (visible seulement quand la sidebar est ouverte en dessous de 900px) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '0 20px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image 
              src="/NouankanyAI.png" 
              alt="NouanKanyAI Logo" 
              width={44} 
              height={44} 
              style={{ objectFit: 'contain' }} 
            />
            <div>
              <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>
                NouankanyAI
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em' }}>
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
          <div
            onClick={openProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            title="Mon profil"
          >
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
        <div className="dashboard-header" style={{
          height: '60px',
          background: 'rgba(13,17,23,0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 40px',
          flexShrink: 0
        }}>
          {/* Hamburger (mobile only) */}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Ouvrir le menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Search */}
          <div className="header-search">
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
            <div
              onClick={openProfile}
              title="Mon profil"
              style={{
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

      {/* Modal Profil */}
      {isProfileOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '400px', maxWidth: '100%', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon size={20} /> Mon Profil
              </h2>
              <button onClick={() => setIsProfileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '22px'
              }}>
                {user.nom.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>

            {profileMsg && (
              <div style={{ backgroundColor: profileMsg.includes('succès') ? 'rgba(16,185,129,0.1)' : 'rgba(239, 68, 68, 0.1)', color: profileMsg.includes('succès') ? '#10b981' : '#ef4444', border: `1px solid ${profileMsg.includes('succès') ? 'rgba(16,185,129,0.2)' : 'rgba(239, 68, 68, 0.2)'}`, padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
                {profileMsg}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Nom complet</label>
              <input
                type="text"
                className="input-field"
                value={profileNom}
                onChange={(e) => setProfileNom(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Type de compte</label>
              <select
                className="input-field"
                style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                value={profileTypeCompte}
                onChange={(e) => setProfileTypeCompte(e.target.value)}
              >
                <option value="Particulier">Particulier</option>
                <option value="Entreprise">Entreprise</option>
                <option value="Industriel">Industriel</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsProfileOpen(false)}>Fermer</button>
              <button type="button" className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
              >
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatWidget />
    </div>
  );
}
