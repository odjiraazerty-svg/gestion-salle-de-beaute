import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { 
  Sparkles, 
  Palette, 
  LogOut, 
  ChevronDown, 
  Check 
} from 'lucide-react';
import { AppTheme } from '../../types';


export const Header: React.FC = () => {
  const { 
    currentUser, 
    theme, 
    setTheme, 
    switchRoleQuick,
    logout 
  } = useSalon();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Available theme options
  const THEME_OPTIONS: { id: AppTheme; label: string; subLabel: string; color: string; bg: string; icon: string }[] = [
    { id: 'blanc', label: 'Blanc', subLabel: 'Lumineux & Épuré', color: '#d97706', bg: '#ffffff', icon: '⚪' },
    { id: 'bleu', label: 'Bleu', subLabel: 'Facebook & Moderne', color: '#1877f2', bg: '#eff6ff', icon: '🔵' },
    { id: 'vert', label: 'Vert Olive', subLabel: 'Spa & Naturel', color: '#4d7c0f', bg: '#f0fdf4', icon: '🟢' },
    { id: 'rose', label: 'Rose', subLabel: 'Blush & Beauté Chic', color: '#e11d48', bg: '#fff1f2', icon: '🌸' },
    { id: 'sombre', label: 'Sombre', subLabel: 'Nuit & Or Précieux', color: '#d7ab45', bg: '#161922', icon: '⚫' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full theme-bg-header backdrop-blur-md border-b theme-border px-3.5 pt-3 pb-3 transition-colors duration-200">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        {/* Platform Branding */}
        <div className="flex items-center gap-2.5 text-left rounded-xl p-1 -m-1 select-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-[1.5px] flex items-center justify-center shadow-sm flex-shrink-0">
            <div className="w-full h-full theme-bg-card rounded-[10px] flex items-center justify-center overflow-hidden">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <div>
            <h1 className="text-xs font-bold tracking-tight theme-text-primary flex items-center gap-1.5 font-serif">
              <span>Salle de Beauté</span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'owner' ? 'Pro' : currentUser?.role === 'employee' ? 'Staff' : 'Réservation'}
              </span>
            </h1>
            <p className="text-[10px] theme-text-secondary truncate">
              {currentUser?.role === 'admin' ? 'Console de Supervision' : currentUser?.role === 'owner' ? 'Espace Gérant de Salon' : currentUser?.role === 'employee' ? 'Espace Collaborateur' : 'Trouvez & réservez votre soin idéal'}
            </p>
          </div>
        </div>

        {/* User Account & Role Quick Switcher & Theme Chooser */}
        <div className="flex items-center gap-1.5">
          {/* Quick Role Switcher Pill */}
          <div className="hidden xs:flex items-center bg-black/20 rounded-xl p-0.5 border theme-border">
            <button
              type="button"
              onClick={() => switchRoleQuick('admin')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                currentUser?.role === 'admin'
                  ? 'theme-btn-primary shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
              title="Passer en Console Administrateur Plateforme"
            >
              <span>👑</span>
              <span className="hidden sm:inline">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => switchRoleQuick('owner')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                currentUser?.role === 'owner'
                  ? 'theme-btn-primary shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
              title="Passer en Espace Prestataire (Gérant)"
            >
              <span>💼</span>
              <span className="hidden sm:inline">Pro</span>
            </button>
            <button
              type="button"
              onClick={() => switchRoleQuick('employee')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                currentUser?.role === 'employee'
                  ? 'theme-btn-primary shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
              title="Passer en Espace Collaborateur (Staff)"
            >
              <span>✂️</span>
              <span className="hidden sm:inline">Staff</span>
            </button>
            <button
              type="button"
              onClick={() => switchRoleQuick('client')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                currentUser?.role === 'client'
                  ? 'theme-btn-primary shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
              title="Passer en Espace Client"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Client</span>
            </button>
          </div>

          {/* Theme Palette Button */}
          <button
            onClick={() => setShowThemeModal(true)}
            className="w-8 h-8 rounded-xl theme-bg-card border theme-border flex items-center justify-center theme-text-accent hover:opacity-80 transition shadow-sm cursor-pointer"
            title="Changer de thème de couleur (Blanc, Bleu, Vert, Rose, Sombre)"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* User Profile Button with Active Session Pulse */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border theme-badge-accent hover:opacity-90 transition shadow-sm cursor-pointer relative"
              title={`Connecté en tant que ${currentUser?.name} (Session Active)`}
            >
              <div className="relative">
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                  alt="avatar" 
                  className="w-4 h-4 rounded-full object-cover border border-amber-400/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-slate-900 animate-pulse" />
              </div>
              <span className="font-bold text-[11px] max-w-[80px] truncate">
                {currentUser?.name?.split(' ')[0] || 'Mon Compte'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* User Dropdown Menu with Active Session Card */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl theme-bg-card border theme-border shadow-2xl p-3.5 z-50 animate-fadeIn">
                  {/* Session Header */}
                  <div className="flex items-center gap-2.5 pb-3 mb-2.5 border-b theme-border">
                    <div className="relative">
                      <img 
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt="avatar" 
                        className="w-11 h-11 rounded-full object-cover border theme-border shadow-sm"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-bold theme-text-primary truncate">{currentUser?.name}</div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          En ligne
                        </span>
                      </div>
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5 theme-badge-accent">
                        {currentUser?.role === 'admin' ? '👑 Admin Plateforme' : currentUser?.role === 'owner' ? '💼 Gérant Pro' : currentUser?.role === 'employee' ? '✂️ Collaborateur' : '🌟 Client VIP'}
                      </div>
                      <div className="text-[10px] theme-text-muted truncate mt-0.5">{currentUser?.email}</div>
                    </div>
                  </div>

                  {/* Session Details Card */}
                  <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border theme-border mb-2.5 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>ID Utilisateur :</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{currentUser?.id || currentUser?.id_user || 'N/A'}</span>
                    </div>
                    {currentUser?.sessionId && (
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Session :</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentUser.sessionId.slice(0, 12)}...</span>
                      </div>
                    )}
                    {currentUser?.connectedAt && (
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Connecté à :</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {new Date(currentUser.connectedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Role Switcher in Menu */}
                  <div className="mb-2.5 pb-2.5 border-b theme-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary mb-1.5">
                      Bascule d'Espace Rapide :
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => { switchRoleQuick('admin'); setShowUserMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          currentUser?.role === 'admin'
                            ? 'theme-btn-primary font-bold'
                            : 'theme-bg-subtle theme-text-primary hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>👑</span>
                          <span>Console Administrateur (Listing)</span>
                        </div>
                        {currentUser?.role === 'admin' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { switchRoleQuick('owner'); setShowUserMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          currentUser?.role === 'owner'
                            ? 'theme-btn-primary font-bold'
                            : 'theme-bg-subtle theme-text-primary hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>💼</span>
                          <span>Espace Prestataire (Gérant)</span>
                        </div>
                        {currentUser?.role === 'owner' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { switchRoleQuick('employee'); setShowUserMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          currentUser?.role === 'employee'
                            ? 'theme-btn-primary font-bold'
                            : 'theme-bg-subtle theme-text-primary hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>✂️</span>
                          <span>Espace Collaborateur (Staff)</span>
                        </div>
                        {currentUser?.role === 'employee' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { switchRoleQuick('client'); setShowUserMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          currentUser?.role === 'client'
                            ? 'theme-btn-primary font-bold'
                            : 'theme-bg-subtle theme-text-primary hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>👤</span>
                          <span>Espace Client (Réservation)</span>
                        </div>
                        {currentUser?.role === 'client' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Se déconnecter / Fin de session button */}
                  <button
                    type="button"
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 transition border border-red-200 dark:border-red-900/40 font-bold shadow-sm cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter (Fin de Session)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Theme Palette Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="theme-bg-card border theme-border rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 theme-text-accent" />
                <h3 className="text-sm font-bold theme-text-primary">Thèmes de Couleur</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="theme-text-muted hover:theme-text-primary text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs theme-text-secondary mb-4">
              Choisissez l'ambiance visuelle de l'application selon vos préférences.
            </p>

            <div className="space-y-2">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTheme(opt.id);
                      setShowThemeModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-2 shadow-sm font-bold'
                        : 'border theme-border hover:opacity-80'
                    }`}
                    style={{
                      borderColor: isSelected ? opt.color : undefined,
                      backgroundColor: isSelected ? opt.bg : undefined
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm border"
                        style={{ backgroundColor: opt.bg, borderColor: opt.color }}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold theme-text-primary">{opt.label}</div>
                        <div className="text-[10px] theme-text-muted">{opt.subLabel}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <span 
                        className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: opt.color }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

