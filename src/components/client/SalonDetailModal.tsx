import React, { useState, useEffect } from 'react';
import { SalonInfo, ServiceItem, StaffMember } from '../../types';
import { useSalon } from '../../context/SalonContext';
import { api } from '../../services/api';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  X, 
  Check, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Users, 
  Scissors,
  Flame
} from 'lucide-react';

interface SalonDetailModalProps {
  salon: SalonInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (service: ServiceItem, salon: SalonInfo) => void;
  onSelectStaff: (staff: StaffMember, salon: SalonInfo) => void;
  onBookAny: (salon: SalonInfo) => void;
}

export const SalonDetailModal: React.FC<SalonDetailModalProps> = ({
  salon,
  isOpen,
  onClose,
  onSelectService,
  onSelectStaff,
  onBookAny
}) => {
  const { selectSalon } = useSalon();

  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'info' | 'reviews'>('services');
  const [salonServices, setSalonServices] = useState<ServiceItem[]>([]);
  const [salonStaff, setSalonStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    if (!salon || !isOpen) return;

    // Fetch specific services & staff for this salon
    setIsLoading(true);
    Promise.all([
      api.getServices(salon.id).catch(() => []),
      api.getStaff(salon.id).catch(() => [])
    ]).then(([srvs, stf]) => {
      setSalonServices(srvs.length > 0 ? srvs : [
        {
          id: `srv-${salon.id}-1`,
          salonId: salon.id,
          name: 'Coupe & Coiffage Signature',
          universe: 'mixte',
          subCategory: 'Coiffure',
          description: 'Shampoing traitant relaxant, coupe sur-mesure et brushing stylisé',
          price: 45,
          duration: 45,
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
          popular: true,
          featured: true
        },
        {
          id: `srv-${salon.id}-2`,
          salonId: salon.id,
          name: 'Soin Éclat & Bien-Être',
          universe: 'mixte',
          subCategory: 'Soins',
          description: 'Modelage du cuir chevelu et soin réparateur intense aux huiles précieuses',
          price: 60,
          duration: 60,
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
          popular: true
        }
      ]);

      setSalonStaff(stf.length > 0 ? stf : [
        {
          id: `stf-${salon.id}-1`,
          salonId: salon.id,
          name: 'Équipe ' + salon.name.split(' ')[0],
          role: 'Master Stylist & Expert Soins',
          avatar: salon.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          universe: ['femme', 'homme', 'mixte'],
          rating: 4.9,
          reviewsCount: 42,
          bio: 'Praticiens passionnés dédiés à votre mise en beauté',
          workingDays: [1, 2, 3, 4, 5, 6],
          workingHours: { start: '09:00', end: '19:30' },
          color: '#d97706'
        }
      ]);
      setIsLoading(false);
    });
  }, [salon, isOpen]);

  if (!isOpen || !salon) return null;

  // Extract available subcategories
  const categories: string[] = ['all', ...Array.from(new Set(salonServices.map(s => (s.univers || s.subCategory || 'Général'))))];

  const filteredServices = selectedCategory === 'all' 
    ? salonServices 
    : salonServices.filter(s => (s.univers || s.subCategory || 'Général') === selectedCategory);

  const handleBookService = (service: ServiceItem) => {
    selectSalon(salon.id);
    onSelectService(service, salon);
    onClose();
  };

  const handleBookStaff = (member: StaffMember) => {
    selectSalon(salon.id);
    onSelectStaff(member, salon);
    onClose();
  };

  const handleBookDirect = () => {
    selectSalon(salon.id);
    onBookAny(salon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="theme-bg-card border theme-border sm:rounded-3xl w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        
        {/* Top Cover Banner with Actions */}
        <div className="relative h-48 sm:h-52 w-full flex-shrink-0">
          <img 
            src={salon.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000'} 
            alt={salon.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

          {/* Top buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition ${
                  isFavorite ? 'bg-rose-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Salon identity on bottom of cover */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white z-10">
            <div className="flex items-center gap-3">
              <img 
                src={salon.logo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150'} 
                alt="logo" 
                className="w-13 h-13 rounded-2xl object-cover border-2 border-white/80 shadow-lg bg-slate-900"
              />
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                  <Sparkles className="w-2.5 h-2.5" /> Partenaire Certifié
                </div>
                <h1 className="text-base sm:text-lg font-bold font-serif leading-tight truncate max-w-[220px]">
                  {salon.name}
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-white/85 mt-0.5">
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Star className="w-3 h-3 fill-current" /> {salon.rating} ({salon.reviewsCount || 48} avis)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-amber-400" /> {salon.city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs inside Salon */}
        <div className="flex items-center justify-around border-b theme-border theme-bg-subtle px-2 pt-1 flex-shrink-0">
          {[
            { id: 'services', label: 'Prestations', count: salonServices.length },
            { id: 'staff', label: 'L\'Équipe', count: salonStaff.length },
            { id: 'info', label: 'Infos & Horaires' },
            { id: 'reviews', label: 'Avis' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition relative ${
                activeTab === t.id 
                  ? 'border-amber-500 theme-text-accent font-bold' 
                  : 'border-transparent theme-text-muted hover:theme-text-primary'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="ml-1 text-[10px] opacity-75 font-normal">({t.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: PRESTATIONS / SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Category Pills */}
              {categories.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'theme-btn-primary text-white shadow-sm font-bold'
                          : 'theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-primary'
                      }`}
                    >
                      {cat === 'all' ? 'Toutes les prestations' : cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Services List */}
              <div className="space-y-2.5">
                {filteredServices.map(service => (
                  <div 
                    key={service.id}
                    className="p-3.5 rounded-2xl theme-bg-subtle border theme-border hover:border-amber-500/40 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={service.name} 
                          className="w-13 h-13 rounded-xl object-cover border theme-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-xl theme-bg-card border theme-border flex items-center justify-center flex-shrink-0 text-amber-500">
                          <Scissors className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold theme-text-primary truncate">{service.name}</h4>
                          {service.popular && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[9px] font-bold flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> Populaire
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] theme-text-muted line-clamp-1 mt-0.5">
                          {service.description || 'Prestation de soin personnalisée'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="font-extrabold theme-text-accent">
                            {service.price} {salon.currency || '€'}
                          </span>
                          <span className="text-[10px] theme-text-muted flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {service.duration} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookService(service)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold theme-btn-primary text-white shadow-sm flex items-center gap-1 flex-shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <span>Choisir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STAFF / PRATICIENS */}
          {activeTab === 'staff' && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-xs theme-text-secondary">
                Choisissez un expert de l'équipe de <strong>{salon.name}</strong> pour vos soins.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {salonStaff.map(member => (
                  <div 
                    key={member.id}
                    className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-center justify-between gap-3 hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40"
                      />
                      <div>
                        <h4 className="text-xs font-bold theme-text-primary">{member.name}</h4>
                        <p className="text-[10px] theme-text-accent font-medium">{member.role}</p>
                        <div className="flex items-center gap-1 text-[10px] theme-text-muted mt-0.5">
                          <Star className="w-2.5 h-2.5 fill-current text-amber-500" />
                          <span>{member.rating || 4.9}</span>
                          <span>•</span>
                          <span>{member.reviewsCount || 24} avis</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookStaff(member)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold theme-badge-accent border hover:theme-btn-primary hover:text-white transition"
                    >
                      Réserver
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INFOS & HORAIRES */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Tagline & Presentation */}
              <div className="p-4 rounded-2xl theme-bg-subtle border theme-border space-y-2">
                <h3 className="text-xs font-bold theme-text-primary uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> À propos de l'établissement
                </h3>
                <p className="text-xs theme-text-secondary leading-relaxed">
                  {salon.tagline || 'Salon de beauté haute gamme offrant des prestations de soins d\'exception, coiffure et bien-être.'}
                </p>
              </div>

              {/* Localisation & Contact */}
              <div className="p-4 rounded-2xl theme-bg-subtle border theme-border space-y-3">
                <h3 className="text-xs font-bold theme-text-primary uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Adresse & Contact
                </h3>

                <div className="space-y-2 text-xs theme-text-secondary">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold theme-text-primary">{salon.address}</div>
                      <div>{salon.postalCode} {salon.city}</div>
                    </div>
                  </div>

                  {salon.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <a href={`tel:${salon.phone}`} className="hover:underline font-medium theme-text-primary">
                        {salon.phone}
                      </a>
                    </div>
                  )}

                  {salon.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <a href={`mailto:${salon.email}`} className="hover:underline theme-text-muted">
                        {salon.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Horaires d'ouverture */}
              <div className="p-4 rounded-2xl theme-bg-subtle border theme-border space-y-2">
                <h3 className="text-xs font-bold theme-text-primary uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Horaires d'ouverture
                </h3>
                <div className="flex items-center justify-between text-xs py-1 border-b theme-border">
                  <span className="theme-text-secondary">{salon.openingHours?.days || 'Mardi au Samedi'}</span>
                  <span className="font-bold theme-text-primary">{salon.openingHours?.hours || '09:00 - 19:30'}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 text-emerald-500 font-semibold">
                  <span>Dimanche & Lundi</span>
                  <span>Sur Rendez-vous / Privatisations</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AVIS CLIENTS */}
          {activeTab === 'reviews' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl theme-bg-subtle border theme-border flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-serif theme-text-primary">{salon.rating} / 5</div>
                  <div className="flex items-center gap-1 text-amber-500 my-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <div className="text-[10px] theme-text-muted">Basé sur {salon.reviewsCount || 48} réservations vérifiées</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              {/* Sample verified reviews */}
              {[
                { name: 'Sophie L.', date: 'Il y a 3 jours', rating: 5, comment: 'Accueil chaleureux, prestation remarquable. Je recommande vivement ce salon !' },
                { name: 'Alexandre M.', date: 'La semaine dernière', rating: 5, comment: 'Coupe impeccable, cadre magnifique et personnel très attentif.' }
              ].map((rev, idx) => (
                <div key={idx} className="p-3 rounded-2xl theme-bg-subtle border theme-border space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold theme-text-primary">{rev.name}</div>
                    <div className="text-[10px] theme-text-muted">{rev.date}</div>
                  </div>
                  <div className="flex items-center text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs theme-text-secondary mt-1">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Bottom Booking Sticky Bar */}
        <div className="p-3.5 border-t theme-border theme-bg-header flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            <div className="text-[10px] theme-text-muted">Réservation en ligne</div>
            <div className="text-xs font-bold theme-text-primary">Confirmation instantanée</div>
          </div>

          <button
            type="button"
            onClick={handleBookDirect}
            className="px-6 py-3 rounded-2xl text-xs font-bold theme-btn-primary text-white flex items-center gap-2 shadow-lg hover:opacity-95 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Prendre Rendez-vous</span>
          </button>
        </div>

      </div>
    </div>
  );
};
