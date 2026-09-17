import React, { useState, useEffect } from 'react';
import { SalonInfo, ServiceItem } from '../../types';
import { useSalon } from '../../context/SalonContext';
import { api } from '../../services/api';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Coins, 
  Store, 
  Layers, 
  Check, 
  X, 
  Edit3, 
  Star, 
  Scissors, 
  Sparkles,
  ExternalLink,
  MessageCircle,
  Users,
  Trash2,
  Plus
} from 'lucide-react';

interface SalonDetailModalProps {
  salon: SalonInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (salon: SalonInfo) => void;
  onDelete?: (salon: SalonInfo) => void;
  onAddStaff?: (salon: SalonInfo) => void;
}

export const SalonDetailModal: React.FC<SalonDetailModalProps> = ({
  salon,
  isOpen,
  onClose,
  onOpenEdit,
  onDelete,
  onAddStaff
}) => {
  const { currentSalon, selectSalon, staff } = useSalon();
  const [salonServices, setSalonServices] = useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false);

  useEffect(() => {
    if (salon && isOpen) {
      setIsLoadingServices(true);
      api.getSalonServices(salon.id)
        .then(data => setSalonServices(data))
        .catch(() => setSalonServices([]))
        .finally(() => setIsLoadingServices(false));
    }
  }, [salon, isOpen]);

  if (!isOpen || !salon) return null;

  const isActive = currentSalon.id === salon.id;
  const salonStaff = staff.filter(st => st.salonId === salon.id || !st.salonId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="theme-bg-card border theme-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-auto relative flex flex-col max-h-[92vh]">
        
        {/* Cover Hero & Header */}
        <div className="relative h-44 sm:h-48 w-full flex-shrink-0">
          <img 
            src={salon.coverImage || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1000'} 
            alt={salon.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Active Badge */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            {isActive ? (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                Établissement Actif
              </span>
            ) : (
              <button
                type="button"
                onClick={() => selectSalon(salon.id)}
                className="px-2.5 py-1 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-1"
              >
                <span>Activer cet Établissement</span>
              </button>
            )}
          </div>

          {/* Salon identity in cover footer */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/80 shadow-lg bg-slate-900 flex-shrink-0">
                <img 
                  src={salon.logo || salon.coverImage} 
                  alt={salon.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-white text-base font-bold font-serif leading-tight">
                  {salon.name}
                </h3>
                <p className="text-white/80 text-[11px] mt-0.5 line-clamp-1">
                  {salon.tagline || 'Salon de Beauté, Soins & Coiffure'}
                </p>
                <div className="flex items-center gap-1.5 text-amber-300 text-[10px] mt-0.5 font-bold">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{salon.rating || 5.0} ({salon.reviewsCount || 0} avis)</span>
                </div>
              </div>
            </div>

            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(salon);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/30 transition cursor-pointer flex-shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Quick Details Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-2xl theme-bg-subtle border theme-border">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-muted block">Univers</span>
              <span className="text-xs font-black theme-text-accent truncate block mt-0.5 capitalize">
                {(salon.universe || salon.univers || 'mixte') === 'femme' ? 'Dame 👩' :
                 (salon.universe || salon.univers || 'mixte') === 'homme' ? 'Homme 👨' :
                 (salon.universe || salon.univers || 'mixte') === 'enfant' ? 'Enfant 🧒' : 'Mixte ✨'}
              </span>
            </div>
            <div className="p-2 rounded-2xl theme-bg-subtle border theme-border">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-muted block">Ville</span>
              <span className="text-xs font-black theme-text-primary truncate block mt-0.5">{salon.city}</span>
            </div>
            <div className="p-2 rounded-2xl theme-bg-subtle border theme-border">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-muted block">Prestations</span>
              <span className="text-xs font-black theme-text-primary block mt-0.5">{salonServices.length || 'Catalogue'}</span>
            </div>
            <div className="p-2 rounded-2xl theme-bg-subtle border theme-border">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-muted block">Collaborateurs</span>
              <span className="text-xs font-black theme-text-primary block mt-0.5">{salonStaff.length} praticiens</span>
            </div>
          </div>

          {/* Contact & Localisation */}
          <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider theme-text-accent flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Localisation & Contact
            </div>
            <div className="text-xs theme-text-primary font-medium flex items-start gap-2">
              <span className="theme-text-muted flex-shrink-0">Adresse :</span>
              <span>{salon.address} {salon.postalCode ? `(${salon.postalCode})` : ''} - {salon.city}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t theme-border">
              {salon.phone && (
                <a 
                  href={`tel:${salon.phone}`} 
                  className="theme-text-secondary hover:theme-text-accent flex items-center gap-1.5 transition font-medium"
                >
                  <Phone className="w-3 h-3 text-amber-500" />
                  <span>{salon.phone}</span>
                </a>
              )}
              {salon.email && (
                <a 
                  href={`mailto:${salon.email}`} 
                  className="theme-text-secondary hover:theme-text-accent flex items-center gap-1.5 transition font-medium"
                >
                  <Mail className="w-3 h-3 text-amber-500" />
                  <span>{salon.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Opening Days & Hours */}
          <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider theme-text-accent flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Horaires d'ouverture
            </div>
            <div className="flex items-center justify-between text-xs theme-text-primary font-medium">
              <span>{salon.openingHours?.days || 'Mardi au Samedi'}</span>
              <span className="font-bold theme-text-accent">{salon.openingHours?.hours || '09:00 - 19:30'}</span>
            </div>
          </div>

          {/* Prestations Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider theme-text-primary flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 theme-text-accent" />
                Prestations & Tarifs appliqués dans ce Salon
              </h4>
              <span className="text-[10px] font-bold theme-text-accent">
                {salonServices.length} prestation(s)
              </span>
            </div>

            {isLoadingServices ? (
              <div className="py-6 text-center text-xs theme-text-muted">
                Chargement des prestations...
              </div>
            ) : salonServices.length === 0 ? (
              <div className="p-4 rounded-2xl theme-bg-subtle border border-dashed theme-border text-center text-xs theme-text-muted">
                Aucune prestation spécifique personnalisée pour l'instant. Les tarifs standards du catalogue sont appliqués.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {salonServices.map((srv) => (
                  <div 
                    key={srv.id}
                    className="p-2.5 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={srv.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100'} 
                        alt={srv.name} 
                        className="w-9 h-9 rounded-lg object-cover border theme-border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold theme-text-primary truncate">{srv.nom || srv.name}</div>
                        <div className="text-[10px] theme-text-muted flex items-center gap-1">
                          <span>{srv.univers || srv.universe || 'Mixte'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {srv.duree || srv.duration || 30} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black theme-text-accent block">
                        {srv.cout ?? srv.price ?? 0} {salon.currency || 'FCFA'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 sm:p-4 border-t theme-border flex items-center justify-between flex-shrink-0 bg-black/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold theme-text-secondary hover:theme-text-primary transition cursor-pointer"
            >
              Fermer
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(salon);
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Supprimer ce salon"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isActive && (
              <button
                type="button"
                onClick={() => {
                  selectSalon(salon.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl theme-bg-subtle border theme-border hover:theme-badge-accent text-xs font-bold theme-text-primary transition cursor-pointer"
              >
                Activer ce salon
              </button>
            )}

            {onAddStaff && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddStaff(salon);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                title="Ajouter un collaborateur rattaché à ce salon"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Collaborateur</span>
              </button>
            )}

            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(salon);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier la Fiche</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
