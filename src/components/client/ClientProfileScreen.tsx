import React from 'react';
import { useSalon } from '../../context/SalonContext';
import { 
  Award, 
  Sparkles, 
  Phone, 
  Mail, 
  Palette, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const ClientProfileScreen: React.FC = () => {
  const { activeClient, salonInfo, theme, setTheme, logout } = useSalon();

  // Loyalty calculation
  const nextTierPoints = 500;
  const progressPercent = Math.min(100, Math.round((activeClient.loyaltyPoints / nextTierPoints) * 100));

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Top Profile Card */}
      <div className="px-4 pt-1">
        <div className="rounded-3xl theme-bg-card border theme-border p-5 flex items-center gap-4 shadow-sm">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 theme-border shadow-md">
            <img 
              src={activeClient.avatar} 
              alt={activeClient.name} 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold theme-text-primary">
                {activeClient.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full theme-btn-primary text-[9px] font-black uppercase">
                VIP
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs theme-text-secondary">
              <Phone className="w-3 h-3 theme-text-accent" />
              <span>{activeClient.phone || '+33 6 00 00 00 00'}</span>
            </div>

            <div className="flex items-center gap-1 text-xs theme-text-secondary">
              <Mail className="w-3 h-3 theme-text-accent" />
              <span className="truncate max-w-[180px]">{activeClient.email || 'client@exemple.com'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Loyalty Card */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl theme-btn-primary p-5 text-white shadow-xl shadow-black/10 space-y-4 border border-white/20">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest block opacity-90">
                Carte de Privilège
              </span>
              <h4 className="text-base font-serif font-bold text-white">
                {salonInfo.name} Club
              </h4>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-2xl font-black text-white">
                {activeClient.loyaltyPoints} <span className="text-xs font-normal opacity-85">Points</span>
              </span>
              <span className="text-[11px] font-semibold opacity-90">
                {500 - (activeClient.loyaltyPoints % 500)} pts avant votre prochain soin offert
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 flex justify-between text-xs text-white/90">
            <span>Visites : <strong>{activeClient.visitsCount}</strong></span>
            <span>Total dépensé : <strong>{activeClient.totalSpent} {salonInfo.currency}</strong></span>
          </div>
        </div>
      </div>

      {/* Theme Quick Selector Section */}
      <div className="px-4 space-y-2">
        <h4 className="text-xs font-bold theme-text-muted uppercase tracking-wider">
          Ambiance & Thème de l'application
        </h4>

        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'blanc', label: 'Blanc', icon: '⚪', color: '#d97706' },
            { id: 'bleu', label: 'Bleu', icon: '🔵', color: '#1877f2' },
            { id: 'vert', label: 'Vert', icon: '🟢', color: '#4d7c0f' },
            { id: 'rose', label: 'Rose', icon: '🌸', color: '#e11d48' },
            { id: 'sombre', label: 'Sombre', icon: '⚫', color: '#d7ab45' },
          ].map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`py-2 px-1 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  isSelected 
                    ? 'border-2 font-bold shadow-sm' 
                    : 'theme-bg-card theme-border hover:opacity-80'
                }`}
                style={{ borderColor: isSelected ? t.color : undefined }}
              >
                <span className="text-base">{t.icon}</span>
                <span className="text-[10px] theme-text-primary truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Logout Actions */}
      <div className="px-4 pt-2 space-y-2">
        <div className="rounded-2xl theme-bg-card border theme-border p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 theme-text-accent" />
            <div>
              <div className="text-xs font-bold theme-text-primary">Données protégées</div>
              <div className="text-[10px] theme-text-secondary">Base PostgreSQL chiffrée & RGPD</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full py-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter de mon compte</span>
        </button>
      </div>
    </div>
  );
};
