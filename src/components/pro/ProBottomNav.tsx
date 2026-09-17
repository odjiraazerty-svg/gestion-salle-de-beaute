import React from 'react';
import { useSalon } from '../../context/SalonContext';
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  Users, 
  Scissors,
  Plus
} from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ProBottomNav: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const { appointments } = useSalon();

  const unpaidCount = appointments.filter(a => !a.paid && a.status !== 'cancelled').length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      <div className="theme-bg-header backdrop-blur-xl border-t theme-border px-2 py-2 flex items-center justify-around shadow-xl transition-colors duration-200">
        {/* Cockpit / Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'dashboard' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Cockpit</span>
        </button>

        {/* Planning */}
        <button
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'schedule' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium">Planning</span>
        </button>

        {/* Caisse POS */}
        <button
          onClick={() => onTabChange('pos')}
          className={`relative flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'pos' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Caisse</span>
          {unpaidCount > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center animate-pulse shadow-sm">
              {unpaidCount}
            </span>
          )}
        </button>

        {/* CRM Clients */}
        <button
          onClick={() => onTabChange('clients')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'clients' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Clients</span>
        </button>

        {/* Services & Prestations */}
        <button
          onClick={() => onTabChange('services')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === 'services' ? 'theme-text-accent scale-105 font-bold' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          <Scissors className="w-5 h-5" />
          <span className="text-[10px] font-medium">Services</span>
        </button>
      </div>
    </div>
  );
};
