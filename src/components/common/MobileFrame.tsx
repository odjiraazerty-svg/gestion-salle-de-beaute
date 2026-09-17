import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { useSalon } from '../../context/SalonContext';

interface Props {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<Props> = ({ children }) => {
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const { currentSalon } = useSalon();

  return (
    <div className="min-h-screen theme-bg-main theme-text-primary flex flex-col items-center justify-start relative transition-colors duration-200">
      {/* Top Desktop Controls Bar (Only visible on larger screens) */}
      <div className="hidden md:flex w-full max-w-4xl items-center justify-between py-2 px-6 my-2 theme-bg-card border theme-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold theme-text-primary">
            Salle de Beauté • Plateforme SaaS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceFrame(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              deviceFrame
                ? 'theme-btn-primary font-bold shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Vue Mobile</span>
          </button>

          <button
            onClick={() => setDeviceFrame(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              !deviceFrame
                ? 'theme-btn-primary font-bold shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Plein Écran</span>
          </button>
        </div>
      </div>

      {/* Main Container / Mobile Mockup Shell */}
      <div
        className={`w-full transition-all duration-300 relative ${
          deviceFrame
            ? 'md:max-w-[430px] md:my-3 md:rounded-[44px] md:border-[8px] md:border-slate-800/80 md:shadow-2xl md:overflow-hidden min-h-screen md:min-h-[880px] theme-bg-main'
            : 'max-w-md mx-auto min-h-screen theme-bg-main'
        }`}
      >
        {/* Dynamic Island / Notch on mobile mockup */}
        {deviceFrame && (
          <div className="hidden md:flex justify-center items-center pt-2 pb-1 theme-bg-header sticky top-0 z-50">
            <div className="w-28 h-4 bg-slate-950 rounded-full flex items-center justify-end px-3 gap-1.5 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-blue-900/50"></div>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="pb-24 overflow-y-auto max-h-[100vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
