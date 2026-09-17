import React from 'react';
import { useSalon } from '../../context/SalonContext';
import { 
  Home, 
  Calendar, 
  Sparkles, 
  Ticket, 
  User 
} from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickBook: () => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onTabChange, onOpenQuickBook }) => {
  const { appointments } = useSalon();

  // Active client appointments count
  const myActiveApts = appointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      <div className="theme-bg-header backdrop-blur-xl border-t theme-border px-3 py-2 flex items-center justify-around shadow-lg transition-colors duration-200">
        {/* Accueil */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'home' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Accueil</span>
        </button>

        {/* Catalogue */}
        <button
          onClick={() => onTabChange('services')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'services' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium">Prestations</span>
        </button>

        {/* Central Floating Book Action */}
        <button
          onClick={onOpenQuickBook}
          className="relative -top-4 flex flex-col items-center group"
        >
          <div className="w-13 h-13 p-3.5 rounded-full theme-btn-primary shadow-lg shadow-black/15 group-active:scale-95 transition-transform flex items-center justify-center">
            <Calendar className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold theme-text-accent mt-0.5">Réserver</span>
        </button>

        {/* Mes RDV */}
        <button
          onClick={() => onTabChange('appointments')}
          className={`relative flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'appointments' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mes RDV</span>
          {myActiveApts.length > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
              {myActiveApts.length}
            </span>
          )}
        </button>

        {/* Profil & Fidélité */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'profile' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Fidélité</span>
        </button>
      </div>
    </div>
  );
};
