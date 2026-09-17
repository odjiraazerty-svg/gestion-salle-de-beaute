import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { SalonInfo, ServiceItem, StaffMember } from '../../types';
import { SalonDetailModal } from './SalonDetailModal';
import { SalonRegistrationModal } from '../common/SalonRegistrationModal';
import { 
  Search, 
  MapPin, 
  Star, 
  Sparkles, 
  Calendar, 
  Scissors, 
  Clock, 
  Filter, 
  ChevronRight, 
  Store, 
  Plus, 
  ShieldCheck, 
  Flame,
  Layers,
  Heart
} from 'lucide-react';

interface Props {
  onSelectService: (service: ServiceItem) => void;
  onSelectStaff: (staff: StaffMember) => void;
  onNavigateToServices: () => void;
}

export const HomeScreen: React.FC<Props> = ({ 
  onSelectService, 
  onSelectStaff, 
  onNavigateToServices 
}) => {
  const { 
    salons, 
    currentSalon, 
    selectSalon, 
    selectedUniverse, 
    setSelectedUniverse 
  } = useSalon();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal inspection state
  const [selectedSalonForModal, setSelectedSalonForModal] = useState<SalonInfo | null>(null);
  const [isSalonModalOpen, setIsSalonModalOpen] = useState<boolean>(false);
  const [isRegisterSalonOpen, setIsRegisterSalonOpen] = useState<boolean>(false);

  // Available cities from salons
  const cities = ['all', ...Array.from(new Set(salons.map(s => s.city).filter(Boolean)))];

  // Quick categories
  const CATEGORIES = [
    { id: 'all', label: 'Tous', icon: '✨' },
    { id: 'coiffure', label: 'Coiffure', icon: '✂️' },
    { id: 'barber', label: 'Barber', icon: '💈' },
    { id: 'soins', label: 'Spa & Soins', icon: '🌿' },
    { id: 'ongles', label: 'Onglerie', icon: '💅' }
  ];

  // Filter salons according to search and filters
  const filteredSalons = salons.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tagline && s.tagline.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = selectedCity === 'all' || s.city === selectedCity;

    let matchesCategory = true;
    if (selectedCategory === 'barber') {
      matchesCategory = s.name.toLowerCase().includes('barber') || Boolean(s.tagline && s.tagline.toLowerCase().includes('barber'));
    } else if (selectedCategory === 'soins') {
      matchesCategory = s.name.toLowerCase().includes('spa') || Boolean(s.tagline && s.tagline.toLowerCase().includes('soin'));
    }

    return Boolean(matchesSearch && matchesCity && matchesCategory);

  });

  const handleOpenSalon = (salon: SalonInfo) => {
    setSelectedSalonForModal(salon);
    setIsSalonModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      
      {/* 1. Hero Search & Marketplace Banner */}
      <div className="px-3 pt-1">
        <div className="relative overflow-hidden rounded-3xl theme-btn-primary p-5 text-white shadow-xl shadow-black/10">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 rounded-full bg-white/20 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Plateforme Beauté & Réservation</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
              Trouvez votre salon idéal <br />
              <span className="font-sans font-light opacity-95 text-base sm:text-lg">
                et réservez en quelques clics.
              </span>
            </h1>

            {/* Smart Search Bar */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 absolute left-3.5 top-4 theme-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Salon, coiffure, massage, ville (ex: Paris)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white text-slate-900 placeholder:text-slate-400 shadow-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="px-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                selectedCategory === cat.id
                  ? 'theme-btn-primary text-white scale-105 font-bold shadow-md'
                  : 'theme-bg-card border theme-border theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Featured Salons Carousel / Highlights */}
      <div className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold theme-text-primary font-serif">
              Salons Coups de Cœur
            </h2>
          </div>
          <span className="text-[11px] theme-text-accent font-semibold">
            {salons.length} établissements partenaires
          </span>
        </div>

        <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar snap-x">
          {salons.slice(0, 3).map(salon => (
            <div
              key={salon.id}
              onClick={() => handleOpenSalon(salon)}
              className="min-w-[260px] sm:min-w-[290px] rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer snap-center group flex-shrink-0"
            >
              {/* Cover Image & Rating Badge */}
              <div className="relative h-32 w-full overflow-hidden">
                <img
                  src={salon.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600'}
                  alt={salon.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 border border-white/20">
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span>{salon.rating || 4.9}</span>
                </div>

                {/* Salon Logo & Name on Cover */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2 text-white">
                  <img
                    src={salon.logo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100'}
                    alt="logo"
                    className="w-8 h-8 rounded-xl object-cover border border-white/60 bg-slate-900"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold truncate leading-tight">{salon.name}</h3>
                    <p className="text-[10px] text-white/80 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 text-amber-400" /> {salon.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Card details */}
              <div className="p-3 flex items-center justify-between">
                <div className="text-[11px] theme-text-secondary truncate max-w-[170px]">
                  {salon.tagline || 'Salon & Soins de Beauté'}
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold theme-badge-accent border group-hover:theme-btn-primary group-hover:text-white transition"
                >
                  Explorer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Full Salons Directory (Grid) */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 theme-text-accent" />
            <h2 className="text-sm font-bold theme-text-primary font-serif">
              Tous les Salons de Beauté
            </h2>
          </div>
          <span className="text-[11px] theme-text-muted">
            {filteredSalons.length} résultat(s)
          </span>
        </div>

        {filteredSalons.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-subtle border theme-border space-y-3">
            <div className="w-12 h-12 rounded-full theme-bg-card border theme-border flex items-center justify-center mx-auto theme-text-muted">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs theme-text-secondary">
              Aucun salon ne correspond à votre recherche "<strong>{searchQuery}</strong>".
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCity('all'); setSelectedCategory('all'); }}
              className="px-4 py-2 rounded-2xl text-xs font-bold theme-badge-accent border"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSalons.map(salon => (
              <div
                key={salon.id}
                onClick={() => handleOpenSalon(salon)}
                className="p-3.5 rounded-3xl theme-bg-card border theme-border hover:border-amber-500/50 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border theme-border">
                    <img
                      src={salon.coverImage || salon.logo}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-amber-400 text-[9px] font-extrabold flex items-center gap-0.5">
                      <Star className="w-2 h-2 fill-current" /> {salon.rating}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-bold theme-text-primary group-hover:theme-text-accent transition truncate">
                      {salon.name}
                    </h3>
                    <p className="text-[11px] theme-text-muted line-clamp-1 mt-0.5">
                      {salon.tagline || 'Salon de Beauté & Soins'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] theme-text-secondary">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 theme-text-accent" /> {salon.city}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-emerald-500" /> {salon.openingHours?.hours || '09:00 - 19:30'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-2xl theme-bg-subtle border theme-border group-hover:theme-btn-primary group-hover:text-white flex items-center justify-center transition shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Pro Onboarding Incentive Banner */}
      <div className="px-4">
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold theme-text-primary flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-500" />
              <span>Vous possédez un salon ?</span>
            </div>
            <p className="text-[11px] theme-text-secondary">
              Répertoriez votre établissement pour recevoir des réservations en ligne.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterSalonOpen(true)}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md flex-shrink-0 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Répertorier</span>
          </button>
        </div>
      </div>

      {/* 7. Modals: Detail Salon & Register Salon */}
      <SalonDetailModal
        salon={selectedSalonForModal}
        isOpen={isSalonModalOpen}
        onClose={() => setIsSalonModalOpen(false)}
        onSelectService={(service) => {
          onSelectService(service);
        }}
        onSelectStaff={(staff) => {
          onSelectStaff(staff);
        }}
        onBookAny={() => {
          onNavigateToServices();
        }}
      />

      <SalonRegistrationModal
        isOpen={isRegisterSalonOpen}
        onClose={() => setIsRegisterSalonOpen(false)}
      />

    </div>
  );
};
