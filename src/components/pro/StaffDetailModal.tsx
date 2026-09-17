import React from 'react';
import { StaffMember } from '../../types';
import { useSalon } from '../../context/SalonContext';
import { 
  Users, 
  X, 
  Edit3, 
  Star, 
  Scissors, 
  Clock, 
  Calendar, 
  Building2, 
  Sparkles, 
  Trash2,
  Phone,
  Mail,
  CheckCircle2
} from 'lucide-react';

interface StaffDetailModalProps {
  staffMember: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (staff: StaffMember) => void;
  onDelete?: (staff: StaffMember) => void;
}

const DAYS_MAP: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staffMember,
  isOpen,
  onClose,
  onOpenEdit,
  onDelete,
}) => {
  const { salons, appointments } = useSalon();

  if (!isOpen || !staffMember) return null;

  const assignedSalon = salons.find(s => s.id === staffMember.salonId);
  const staffAppointments = appointments.filter(a => a.staffId === staffMember.id);
  const completedCount = staffAppointments.filter(a => a.status === 'completed').length;

  const workingDaysList = (staffMember.workingDays || [1, 2, 3, 4, 5, 6])
    .map(d => DAYS_MAP[d])
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="theme-bg-card border theme-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-auto relative flex flex-col max-h-[92vh]">
        
        {/* Header Hero */}
        <div className="relative p-6 bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent border-b theme-border flex-shrink-0">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-blue-400/50 shadow-xl bg-slate-900 flex-shrink-0">
                <img 
                  src={staffMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} 
                  alt={staffMember.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 theme-border flex items-center justify-center" title="Actif">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Scissors className="w-2.5 h-2.5" />
                <span>{staffMember.role || 'Collaborateur & Praticien'}</span>
              </span>
              <h3 className="text-lg font-bold font-serif theme-text-primary truncate">
                {staffMember.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-bold mt-0.5">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{staffMember.rating || 5.0}</span>
                </div>
                <span className="theme-text-muted">•</span>
                <span className="theme-text-secondary">{staffMember.reviewsCount || 0} avis clients</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl theme-bg-subtle border theme-border text-center">
              <span className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary block">Établissement</span>
              <span className="text-xs font-black theme-text-primary block mt-0.5 truncate">
                {assignedSalon ? assignedSalon.name : 'Tous les salons'}
              </span>
            </div>

            <div className="p-3 rounded-2xl theme-bg-subtle border theme-border text-center">
              <span className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary block">Rendez-vous</span>
              <span className="text-xs font-black text-blue-400 block mt-0.5">
                {staffAppointments.length} enregistrés
              </span>
            </div>

            <div className="p-3 rounded-2xl theme-bg-subtle border theme-border text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary block">Soins Réalisés</span>
              <span className="text-xs font-black text-emerald-400 block mt-0.5">
                {completedCount} terminés
              </span>
            </div>
          </div>

          {/* Bio / Description */}
          {staffMember.bio && (
            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 theme-text-accent" />
                <span>Présentation & Profil Professionnel</span>
              </span>
              <p className="text-xs theme-text-primary leading-relaxed">
                {staffMember.bio}
              </p>
            </div>
          )}

          {/* Salon de rattachement */}
          <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block">Salon de rattachement</span>
                <span className="text-xs font-bold theme-text-primary">
                  {assignedSalon ? `${assignedSalon.name} (${assignedSalon.city})` : 'Affecté à tous les salons'}
                </span>
              </div>
            </div>
            {assignedSalon && (
              <p className="text-[11px] theme-text-secondary pl-9">
                📍 {assignedSalon.address}, {assignedSalon.city}
              </p>
            )}
          </div>

          {/* Horaires et jours de travail */}
          <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Disponibilité & Planning de travail</span>
            </span>

            <div className="flex items-center gap-2 text-xs font-semibold theme-text-primary">
              <Clock className="w-3.5 h-3.5 theme-text-accent flex-shrink-0" />
              <span>
                Horaires : {staffMember.workingHours?.start || '09:00'} - {staffMember.workingHours?.end || '19:00'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-medium theme-text-secondary block mb-1.5">Jours travaillés :</span>
              <div className="flex flex-wrap gap-1.5">
                {workingDaysList.map((dayName, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold"
                  >
                    {dayName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Univers de soins */}
          {staffMember.universe && staffMember.universe.length > 0 && (
            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block">
                Univers de soins pris en charge :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {staffMember.universe.map((univ, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold capitalize"
                  >
                    {univ === 'femme' ? '👩 Dame' : univ === 'homme' ? '👨 Homme' : univ === 'enfant' ? '🧒 Enfant' : '✨ Mixte'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t theme-border bg-black/20 flex items-center justify-between gap-2 flex-shrink-0">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(staffMember)}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl theme-bg-subtle border theme-border text-xs font-semibold theme-text-secondary hover:theme-text-primary transition cursor-pointer"
            >
              Fermer
            </button>

            {onOpenEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit(staffMember)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
