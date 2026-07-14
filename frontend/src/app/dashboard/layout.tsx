'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Factory, Plug, Bot, Receipt, LogOut, Zap, Menu, X, User as UserIcon, Search, MapPin } from 'lucide-react';
import { signOut, getCurrentUser, authHeaders } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import ChatWidget from './ChatWidget';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const SEARCHABLE_PAGES = [
    { href: '/dashboard',            label: t('nav', 'dashboard') },
    { href: '/dashboard/sites',       label: t('nav', 'sites') },
    { href: '/dashboard/appareils',   label: t('nav', 'appareils') },
    { href: '/dashboard/predictions', label: t('nav', 'predictions') },
    { href: '/dashboard/facturation', label: t('nav', 'facturation') },
  ];
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileNom, setProfileNom] = useState('');
  const [profileTypeCompte, setProfileTypeCompte] = useState('Particulier');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Recherche globale (navbar) : pages, sites et appareils de l'utilisateur
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMachines, setSearchMachines] = useState<any[]>([]);
  const [searchSites, setSearchSites] = useState<any[]>([]);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [machinesRes, sitesRes] = await Promise.all([
          fetch(`${API_URL}/api/machines`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/sites`, { headers: authHeaders() }),
        ]);
        setSearchMachines(await machinesRes.json());
        setSearchSites(await sitesRes.json());
      } catch {
        // silencieux : la recherche affichera simplement moins de résultats
      }
    };
    loadSearchData();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const matchedPages = q ? SEARCHABLE_PAGES.filter(p => p.label.toLowerCase().includes(q)) : [];
  const matchedMachines = q ? searchMachines.filter(m =>
    (m.nom || '').toLowerCase().includes(q) ||
    (m.machine_id || '').toLowerCase().includes(q) ||
    (m.categorie || '').toLowerCase().includes(q) ||
    (m.marque || '').toLowerCase().includes(q)
  ).slice(0, 6) : [];
  const matchedSites = q ? searchSites.filter(s =>
    (s.nom || '').toLowerCase().includes(q) || (s.localisation || '').toLowerCase().includes(q)
  ).slice(0, 6) : [];
  const hasResults = matchedPages.length > 0 || matchedMachines.length > 0 || matchedSites.length > 0;

  const goToFirstResult = () => {
    if (matchedPages[0]) router.push(matchedPages[0].href);
    else if (matchedMachines[0]) router.push('/dashboard/appareils');
    else if (matchedSites[0]) router.push('/dashboard/sites');
    setSearchOpen(false);
    setSearchQuery('');
  };

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
          type_compte: currentUser.role || 'Utilisateur',
          platform_role: currentUser.platform_role || null
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
    { href: '/dashboard',             label: t('nav', 'dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/sites',        label: t('nav', 'sites'),       icon: Factory },
    { href: '/dashboard/appareils',    label: t('nav', 'appareils'),   icon: Plug },
    { href: '/dashboard/predictions',  label: t('nav', 'predictions'), icon: Bot },
    { href: '/dashboard/facturation',  label: t('nav', 'facturation'), icon: Receipt },
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
              <div style={{ color: 'var(--foreground)', fontSize: '16px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>
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
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em' }}>{t('nav', 'systemsUp').toUpperCase()}</span>
          </div>
        </div>

        {/* Nav Label */}
        <div style={{ padding: '20px 20px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', position: 'relative', zIndex: 1 }}>
          {t('nav', 'navigation').toUpperCase()}
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
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative', zIndex: 1
        }}>
          <div
            onClick={openProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            title={t('common', 'myProfile')}
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
              <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '13px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nom}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user.type_compte}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title={t('common', 'logout')}
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
          background: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 40px',
          position: 'relative', zIndex: 50,
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
          <div className="header-search" ref={searchBoxRef} style={{ position: 'relative' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>⌕</span>
            <input
              type="text"
              placeholder={t('common', 'search')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') goToFirstResult(); if (e.key === 'Escape') setSearchOpen(false); }}
              style={{
                border: 'none', background: 'transparent',
                width: '100%', color: 'var(--foreground)',
                fontSize: '13px', outline: 'none'
              }}
            />
            <span style={{ fontSize: '10px', color: '#64748b', background: 'var(--tint-subtle)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>⏎</span>

            {searchOpen && q && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', left: 0, width: '360px', maxWidth: '80vw',
                backgroundColor: 'var(--surface-solid)', border: '1px solid var(--surface-border)', borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', overflow: 'hidden', zIndex: 500,
                maxHeight: '360px', overflowY: 'auto'
              }}>
                {!hasResults && (
                  <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t('common', 'noResults')} : « {searchQuery} »
                  </div>
                )}
                {matchedPages.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t('common', 'pages').toUpperCase()}</div>
                    {matchedPages.map(p => (
                      <div key={p.href} onClick={() => { router.push(p.href); setSearchOpen(false); setSearchQuery(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--tint-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Search size={14} color="var(--text-muted)" /> {p.label}
                      </div>
                    ))}
                  </div>
                )}
                {matchedSites.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', borderTop: '1px solid var(--surface-border)' }}>{t('nav', 'sites').toUpperCase()}</div>
                    {matchedSites.map(s => (
                      <div key={s.id} onClick={() => { router.push('/dashboard/sites'); setSearchOpen(false); setSearchQuery(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--tint-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <span>{s.nom} <span style={{ color: 'var(--text-muted)' }}>· {s.localisation}</span></span>
                      </div>
                    ))}
                  </div>
                )}
                {matchedMachines.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', borderTop: '1px solid var(--surface-border)' }}>{t('common', 'devices').toUpperCase()}</div>
                    {matchedMachines.map(m => (
                      <div key={m.machine_id} onClick={() => { router.push('/dashboard/appareils'); setSearchOpen(false); setSearchQuery(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--tint-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Plug size={14} color="var(--text-muted)" />
                        <span>{m.nom} <span style={{ color: 'var(--text-muted)' }}>· {m.site_nom}</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <LanguageToggle />
            {user.platform_role && (
              <Link href="/admin-portal" style={{
                fontSize: '11px', fontWeight: 700, color: '#F59E0B',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                padding: '5px 12px', borderRadius: '20px',
                textDecoration: 'none'
              }}>
                {t('nav', 'adminPortal')} →
              </Link>
            )}
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#10b981',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              padding: '5px 12px', borderRadius: '20px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
              {t('nav', 'apiConnected').toUpperCase()}
            </div>
            <div
              onClick={openProfile}
              title={t('common', 'myProfile')}
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
        <div className="nk-modal-overlay" style={{ zIndex: 2000 }}>
          <div className="glass-card nk-modal-content" style={{ maxWidth: '420px', backgroundColor: 'var(--surface-solid)', border: '1px solid var(--surface-border)', padding: '28px', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon size={20} /> {t('common', 'myProfile')}
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
              <label className="input-label">{t('common', 'fullName')}</label>
              <input
                type="text"
                className="input-field"
                value={profileNom}
                onChange={(e) => setProfileNom(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">{t('common', 'accountType')}</label>
              <select
                className="input-field"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--surface-border)', color: 'var(--foreground)' }}
                value={profileTypeCompte}
                onChange={(e) => setProfileTypeCompte(e.target.value)}
              >
                <option value="Particulier">Particulier</option>
                <option value="Entreprise">Entreprise</option>
                <option value="Industriel">Industriel</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsProfileOpen(false)}>{t('common', 'close')}</button>
              <button type="button" className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? t('common', 'saving') : t('common', 'save')}
              </button>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--surface-border)' }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
              >
                <LogOut size={16} /> {t('common', 'logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatWidget />
    </div>
  );
}
