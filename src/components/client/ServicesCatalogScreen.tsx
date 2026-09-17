import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ServiceItem } from '../../types';
import { UniverseFilter } from '../common/UniverseFilter';
import { api } from '../../services/api';
import { Search, Clock, Sparkles, MapPin, Store, Check, Star, Filter, RefreshCw } from 'lucide-react';

interface Props {
  onSelectService: (service: ServiceItem) => void;
}

export const ServicesCatalogScreen: React.FC<Props> = ({ onSelectService }) => {
  const { 
    salonInfo, 
    salons, 
    currentUser, 
    selectSalon, 
    selectedUniverse, 
    setSelectedUniverse 
  } = useSalon();

  // Extract distinct cities from salons
  const availableCities = useMemo(() => {
    const rawCities = salons.map(s => s.city).filter(Boolean);
    if (currentUser?.city && !rawCities.includes(currentUser.city)) {
      rawCities.unshift(currentUser.city);
    }
    return Array.from(new Set(rawCities));
  }, [salons, currentUser]);

  // Initial city based on client profile or first available salon
  const initialCity = useMemo(() => {
    if (currentUser?.city && availableCities.includes(currentUser.city)) {
      return currentUser.city;
    }
    return availableCities[0] || 'all';
  }, [currentUser, availableCities]);

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [activeDetailService, setActiveDetailService] = useState<ServiceItem | null>(null);

  // Prestation Salons state
  const [prestationSalons, setPrestationSalons] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Extract distinct quartiers/districts for the selected city
  const availableQuartiers = useMemo(() => {
    const relevantSalons = selectedCity === 'all'
      ? salons
      : salons.filter(s => s.city.toLowerCase() === selectedCity.toLowerCase());
    
    const rawQuartiers = relevantSalons
      .map(s => (s.postalCode || s.address || '').trim())
      .filter(Boolean);

    return Array.from(new Set(rawQuartiers));
  }, [salons, selectedCity]);

  // Sync initial city when available cities are ready
  useEffect(() => {
    if (selectedCity === 'all' && availableCities.length > 0) {
      if (currentUser?.city && availableCities.includes(currentUser.city)) {
        setSelectedCity(currentUser.city);
      } else {
        setSelectedCity(availableCities[0]);
      }
    }
  }, [availableCities, currentUser, selectedCity]);

  // Reset quartier when city changes if not in new city
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedQuartier('all');
    setSelectedSubCategory('all');
  };

  // Fetch prestations from backend prestation_salons
  const loadPrestationSalons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getPrestationSalons({
        city: selectedCity !== 'all' ? selectedCity : undefined,
        quartier: selectedQuartier !== 'all' ? selectedQuartier : undefined,
        universe: selectedUniverse !== 'all' ? selectedUniverse : undefined,
        search: searchQuery.trim() || undefined,
      });
      setPrestationSalons(data);
    } catch (err) {
      console.warn('⚠️ Erreur lors du chargement des prestations personnalisées:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, selectedQuartier, selectedUniverse, searchQuery]);

  useEffect(() => {
    loadPrestationSalons();
  }, [loadPrestationSalons]);

  // Client-side filtering for subcategories and search refinement
  const filtered = useMemo(() => {
    let list = [...prestationSalons];

    // Filter by universe
    if (selectedUniverse !== 'all') {
      list = list.filter(s => {
        const u = (s.univers || s.universe || '').toLowerCase();
        return u === selectedUniverse.toLowerCase();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        (s.nom || s.name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.subCategory || s.univers || '').toLowerCase().includes(q) ||
        (s.salonName || '').toLowerCase().includes(q)
      );
    }

    // Filter by subCategory
    if (selectedSubCategory !== 'all') {
      list = list.filter(s => (s.subCategory || s.univers || 'Général') === selectedSubCategory);
    }

    return list;
  }, [prestationSalons, selectedUniverse, searchQuery, selectedSubCategory]);

  // Extract subcategories
  const subCategories: string[] = useMemo(() => {
    const set = new Set(prestationSalons.map(s => s.subCategory || s.univers || 'Général').filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [prestationSalons]);

  const handleBook = (service: ServiceItem) => {
    if (service.salonId) {
      selectSalon(service.salonId);
    }
    onSelectService(service);
  };

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Header & Search */}
      <div className="px-4 space-y-3 pt-1">
        <div>
          <h2 className="text-lg font-bold theme-text-primary font-serif">
            Menu des Prestations
          </h2>
          <p className="text-xs theme-text-secondary">
            Découvrez nos prestations et réservez votre soin en ligne
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une prestation, salon, soin..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl theme-bg-card border theme-border text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Universe Pills */}
      <UniverseFilter
        selected={selectedUniverse}
        onSelect={(u) => {
          setSelectedUniverse(u);
          setSelectedSubCategory('all');
        }}
      />

      {/* Subcategory mini chips */}
      {subCategories.length > 2 && (
        <div className="px-4 overflow-x-auto no-scrollbar flex gap-2">
          {subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubCategory(sub)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                selectedSubCategory === sub
                  ? 'theme-btn-primary font-bold shadow-sm'
                  : 'theme-bg-card theme-text-secondary border theme-border hover:opacity-80'
              }`}
            >
              {sub === 'all' ? 'Toutes catégories' : sub}
            </button>
          ))}
        </div>
      )}

      {/* Prestations List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12 space-y-2">
            <RefreshCw className="w-6 h-6 theme-text-accent mx-auto animate-spin opacity-60" />
            <p className="text-xs theme-text-secondary">Chargement des prestations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Sparkles className="w-8 h-8 theme-text-accent mx-auto opacity-40" />
            <p className="text-xs font-semibold theme-text-primary">Aucune prestation trouvée</p>
            <p className="text-[11px] theme-text-secondary max-w-xs mx-auto">
              Essayez de changer de ville, de quartier ou de réinitialiser vos filtres.
            </p>
            <button
              onClick={() => {
                setSelectedCity('all');
                setSelectedQuartier('all');
                setSelectedUniverse('all');
                setSearchQuery('');
                setSelectedSubCategory('all');
              }}
              className="mt-2 px-3 py-1.5 rounded-xl theme-btn-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Afficher tout le catalogue</span>
            </button>
          </div>
        ) : (
          filtered.map((service) => {
            const priceVal = service.cout ?? service.price ?? 0;
            const durationVal = service.duree ?? service.duration ?? 30;
            const currencyVal = service.salonCurrency || salonInfo.currency || 'FCFA';

            return (
              <div
                key={service.id}
                className="rounded-3xl theme-bg-card border theme-border p-4 space-y-3 hover:opacity-95 transition-all shadow-sm"
              >
                {/* Salon Tag & Location */}
                {service.salonName && (
                  <div className="flex items-center justify-between pb-2 border-b theme-border text-[11px]">
                    <div className="flex items-center gap-1.5 theme-text-primary font-bold">
                      <Store className="w-3.5 h-3.5 theme-text-accent" />
                      <span className="truncate max-w-[180px]">{service.salonName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] theme-text-secondary">
                      <MapPin className="w-3 h-3 theme-text-muted" />
                      <span className="truncate max-w-[140px]">
                        {service.salonCity} {service.salonQuartier ? `(${service.salonQuartier})` : ''}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3.5 items-start">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 theme-bg-subtle">
                    <img 
                      src={service.image} 
                      alt={service.name || service.nom} 
                      className="w-full h-full object-cover" 
                    />
                    {service.popular && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded theme-btn-primary text-[9px] font-extrabold uppercase">
                        Top
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold theme-text-accent uppercase tracking-wider">
                        {service.subCategory || service.univers || 'Soin'}
                      </span>
                      {service.univers && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded theme-badge-accent font-semibold">
                          {service.univers}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold theme-text-primary leading-snug">
                      {service.name || service.nom}
                    </h3>
                    <p className="text-xs theme-text-secondary line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Steps pills preview */}
                {service.includedSteps && service.includedSteps.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {service.includedSteps.map((step, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md theme-badge-accent text-[10px]"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>{step}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Price & Action Row */}
                <div className="pt-2 border-t theme-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black theme-text-accent">
                      {priceVal.toLocaleString()} {currencyVal}
                    </span>
                    <span className="flex items-center gap-1 text-xs theme-text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      {durationVal} min
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveDetailService(service)}
                      className="px-3 py-1.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-secondary hover:theme-text-primary transition-colors"
                    >
                      Détails
                    </button>

                    <button
                      onClick={() => handleBook(service)}
                      className="px-3.5 py-1.5 rounded-xl theme-btn-primary text-xs font-bold shadow-sm transition-all"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Service Detail Modal */}
      {activeDetailService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm theme-bg-card border theme-border rounded-3xl p-5 space-y-4 shadow-2xl animate-scaleIn relative">
            <div className="relative h-44 rounded-2xl overflow-hidden theme-bg-subtle">
              <img 
                src={activeDetailService.image} 
                alt={activeDetailService.name || activeDetailService.nom} 
                className="w-full h-full object-cover" 
              />
              <button
                onClick={() => setActiveDetailService(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Salon Info header in modal */}
            {activeDetailService.salonName && (
              <div className="p-2.5 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 theme-text-accent" />
                  <div>
                    <div className="font-bold theme-text-primary">{activeDetailService.salonName}</div>
                    <div className="text-[10px] theme-text-secondary">
                      {activeDetailService.salonCity} {activeDetailService.salonQuartier ? `• ${activeDetailService.salonQuartier}` : ''}
                    </div>
                  </div>
                </div>
                {activeDetailService.salonRating && (
                  <div className="flex items-center gap-1 text-[11px] font-bold theme-text-accent">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{activeDetailService.salonRating}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-bold theme-text-accent uppercase tracking-wider">
                {activeDetailService.subCategory || activeDetailService.univers}
              </span>
              <h3 className="text-base font-bold theme-text-primary">
                {activeDetailService.name || activeDetailService.nom}
              </h3>
              <p className="text-xs theme-text-secondary leading-relaxed pt-1">
                {activeDetailService.description}
              </p>
            </div>

            {activeDetailService.includedSteps && activeDetailService.includedSteps.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold theme-text-primary">Ce qui est inclus :</span>
                <div className="space-y-1">
                  {activeDetailService.includedSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs theme-text-secondary">
                      <Check className="w-3.5 h-3.5 theme-text-accent" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t theme-border flex items-center justify-between">
              <div>
                <span className="text-lg font-black theme-text-accent">
                  {(activeDetailService.cout ?? activeDetailService.price ?? 0).toLocaleString()} {activeDetailService.salonCurrency || salonInfo.currency || 'FCFA'}
                </span>
                <span className="text-xs theme-text-muted block">
                  Durée estimée : {activeDetailService.duree ?? activeDetailService.duration ?? 30} min
                </span>
              </div>

              <button
                onClick={() => {
                  const s = activeDetailService;
                  setActiveDetailService(null);
                  handleBook(s);
                }}
                className="px-4 py-2 rounded-xl theme-btn-primary text-xs font-bold shadow-md"
              >
                Choisir ce soin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
