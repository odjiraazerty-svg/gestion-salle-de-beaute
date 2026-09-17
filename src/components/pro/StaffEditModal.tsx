import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember } from '../../types';
import { useSalon } from '../../context/SalonContext';
import { 
  Users, 
  X, 
  Check, 
  Trash2, 
  Building2, 
  Scissors, 
  Clock, 
  Calendar, 
  Sparkles, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  AlertCircle,
  MapPin,
  Store,
  Image as ImageIcon
} from 'lucide-react';

interface StaffEditModalProps {
  staffMember: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (staff: StaffMember) => void;
  onSaved?: (staff: StaffMember) => void;
  isAdding?: boolean;
  preselectedSalonId?: string;
}

const DAYS_CONFIG = [
  { id: 1, label: 'Lun', full: 'Lundi' },
  { id: 2, label: 'Mar', full: 'Mardi' },
  { id: 3, label: 'Mer', full: 'Mercredi' },
  { id: 4, label: 'Jeu', full: 'Jeudi' },
  { id: 5, label: 'Ven', full: 'Vendredi' },
  { id: 6, label: 'Sam', full: 'Samedi' },
  { id: 0, label: 'Dim', full: 'Dimanche' },
];

/**
 * Analyse la chaîne des jours d'ouverture du salon (ex: "Mardi au Samedi", "Lundi au Samedi", "7j/7")
 * et retourne la liste des identifiants des jours ouverts (1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam, 0=Dim).
 */
export const parseSalonOpenDays = (daysStr?: string): number[] => {
  if (!daysStr) return [1, 2, 3, 4, 5, 6];
  const s = daysStr.toLowerCase().trim();

  if (s.includes('tous') || s.includes('7j') || s.includes('7/7') || s.includes('dimanche au dimanche')) {
    return [1, 2, 3, 4, 5, 6, 0];
  }

  const dayNames: Record<string, number> = {
    'lun': 1, 'lundi': 1,
    'mar': 2, 'mardi': 2,
    'mer': 3, 'mercredi': 3,
    'jeu': 4, 'jeudi': 4,
    'ven': 5, 'vendredi': 5,
    'sam': 6, 'samedi': 6,
    'dim': 0, 'dimanche': 0,
  };

  const rangeMatch = s.match(/(lun|mar|mer|jeu|ven|sam|dim)[a-z]*\s*(?:au|à|-|to)\s*(lun|mar|mer|jeu|ven|sam|dim)[a-z]*/i);
  if (rangeMatch) {
    const startPrefix = rangeMatch[1].toLowerCase().slice(0, 3);
    const endPrefix = rangeMatch[2].toLowerCase().slice(0, 3);
    const startId = dayNames[startPrefix];
    const endId = dayNames[endPrefix];

    if (startId !== undefined && endId !== undefined) {
      const weekOrder = [1, 2, 3, 4, 5, 6, 0];
      const startIdx = weekOrder.indexOf(startId);
      const endIdx = weekOrder.indexOf(endId);
      
      if (startIdx !== -1 && endIdx !== -1) {
        if (startIdx <= endIdx) {
          return weekOrder.slice(startIdx, endIdx + 1);
        } else {
          return [...weekOrder.slice(startIdx), ...weekOrder.slice(0, endIdx + 1)];
        }
      }
    }
  }

  const result: number[] = [];
  const weekTokens = [
    { key: 'dim', id: 0 },
    { key: 'lun', id: 1 },
    { key: 'mar', id: 2 },
    { key: 'mer', id: 3 },
    { key: 'jeu', id: 4 },
    { key: 'ven', id: 5 },
    { key: 'sam', id: 6 },
  ];
  for (const token of weekTokens) {
    if (s.includes(token.key)) {
      result.push(token.id);
    }
  }

  return result.length > 0 ? result : [1, 2, 3, 4, 5, 6];
};

export const parseSalonHours = (hoursInput?: any): { start: string; end: string } => {
  if (!hoursInput) return { start: '09:00', end: '19:00' };
  if (typeof hoursInput === 'object') {
    if (hoursInput.start && hoursInput.end) return { start: hoursInput.start, end: hoursInput.end };
    if (hoursInput.hours) return parseSalonHours(hoursInput.hours);
  }
  const match = String(hoursInput).match(/(\d{1,2}[:h]\d{2})\s*(?:-|à|au|to)\s*(\d{1,2}[:h]\d{2})/i);
  if (match) {
    const formatTime = (t: string) => t.replace('h', ':').padStart(5, '0');
    return {
      start: formatTime(match[1]),
      end: formatTime(match[2]),
    };
  }
  return { start: '09:00', end: '19:00' };
};

/**
 * Retourne les univers de soins autorisés pour un collaborateur en fonction de l'univers du salon.
 */
export const getAvailableUniversesForSalon = (salonUniverseStr?: string): string[] => {
  const u = (salonUniverseStr || 'mixte').toLowerCase().trim();
  if (u === 'homme') return ['homme'];
  if (u === 'femme' || u === 'dame') return ['femme'];
  if (u === 'enfant') return ['enfant'];
  return ['femme', 'homme', 'enfant', 'mixte'];
};

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
];

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { id: 'amber', label: 'Ambre', class: 'bg-amber-500' },
  { id: 'emerald', label: 'Vert', class: 'bg-emerald-500' },
  { id: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
];

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  staffMember,
  isOpen,
  onClose,
  onDelete,
  onSaved,
  isAdding = false,
  preselectedSalonId,
}) => {
  const { salons, currentSalon, currentUser, addStaff, updateStaff } = useSalon();

  // Salons appartenant au prestataire connecté (avec prise en compte du salon pré-sélectionné)
  const mySalons = useMemo(() => {
    return salons.filter(s => {
      if (s.id === preselectedSalonId) return true;
      if (s.id === currentSalon?.id) return true;
      if (currentUser?.role === 'admin') return true;
      if (currentUser?.role === 'owner') {
        return (s.ownerId && currentUser?.id && s.ownerId === currentUser.id) ||
               (currentUser?.salonId && s.id === currentUser.salonId);
      }
      if (currentUser?.role === 'employee') {
        return s.id === currentUser.salonId;
      }
      return false;
    });
  }, [salons, currentUser?.id, currentUser?.salonId, currentUser?.role, currentSalon?.id, preselectedSalonId]);

  // Form State
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('Collaborateur & Coiffeur Expert');
  const [salonId, setSalonId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('1234');
  const [bio, setBio] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(AVATAR_PRESETS[0]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startHour, setStartHour] = useState<string>('09:00');
  const [endHour, setEndHour] = useState<string>('19:00');
  const [universes, setUniverses] = useState<string[]>(['femme', 'homme', 'enfant', 'mixte']);
  const [color, setColor] = useState<string>('blue');

  // Salon actuellement ciblé et sélectionné
  const activeSelectedSalon = useMemo(() => {
    const targetId = salonId || preselectedSalonId || mySalons[0]?.id || currentSalon?.id;
    return salons.find(s => s.id === targetId) || mySalons.find(s => s.id === targetId) || currentSalon || null;
  }, [salons, salonId, preselectedSalonId, mySalons, currentSalon]);

  // Jours et horaires d'ouverture réels du salon sélectionné
  const salonOpenDays = useMemo(() => {
    return parseSalonOpenDays(activeSelectedSalon?.openingHours?.days || (activeSelectedSalon as any)?.openingDays);
  }, [activeSelectedSalon]);

  const salonHours = useMemo(() => {
    return parseSalonHours(activeSelectedSalon?.openingHours?.hours || (activeSelectedSalon as any)?.openingHours);
  }, [activeSelectedSalon]);

  // Univers de soins autorisés pour le salon sélectionné
  const allowedUniverses = useMemo(() => {
    return getAvailableUniversesForSalon(activeSelectedSalon?.universe || activeSelectedSalon?.univers);
  }, [activeSelectedSalon]);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      const defaultDays = salonOpenDays.length > 0 ? salonOpenDays : [1, 2, 3, 4, 5, 6];
      const defaultUniverses = allowedUniverses.length > 0 ? allowedUniverses : ['mixte'];

      if (staffMember && !isAdding) {
        setName(staffMember.name || '');
        setRole(staffMember.role || 'Collaborateur & Praticien');
        setSalonId(staffMember.salonId || preselectedSalonId || (mySalons[0]?.id || currentSalon?.id || ''));
        setEmail('');
        setPhone('');
        setPassword('1234');
        setBio(staffMember.bio || '');
        setAvatar(staffMember.avatar || AVATAR_PRESETS[0]);
        // Restreindre fidèlement les jours de travail aux jours où le salon est ouvert
        const validDays = (staffMember.workingDays || defaultDays).filter(d => salonOpenDays.includes(d));
        setWorkingDays(validDays.length > 0 ? validDays : defaultDays);
        setStartHour(staffMember.workingHours?.start || salonHours.start || '09:00');
        setEndHour(staffMember.workingHours?.end || salonHours.end || '19:00');
        // Restreindre fidèlement les univers de soins à l'univers de l'établissement
        const validUniverses = (staffMember.universe || defaultUniverses).filter(u => allowedUniverses.includes(u));
        setUniverses(validUniverses.length > 0 ? validUniverses : defaultUniverses);
        setColor(staffMember.color || 'blue');
      } else {
        // Reset to default new staff values
        setName('');
        setRole('Collaborateur & Coiffeur Expert');
        setSalonId(preselectedSalonId || mySalons[0]?.id || currentSalon?.id || salons[0]?.id || '');
        setEmail('');
        setPhone('');
        setPassword('1234');
        setBio('Praticien passionné et expérimenté, attentif aux besoins des clients.');
        setAvatar(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
        setWorkingDays(defaultDays);
        setStartHour(salonHours.start || '09:00');
        setEndHour(salonHours.end || '19:00');
        setUniverses(defaultUniverses);
        setColor('blue');
      }
    }
  }, [isOpen, staffMember?.id, isAdding, preselectedSalonId, salonOpenDays, salonHours, allowedUniverses]);

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    // Si le salon est fermé ce jour-là, la sélection est bloquée
    if (!salonOpenDays.includes(dayId)) return;

    if (workingDays.includes(dayId)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter(d => d !== dayId));
      }
    } else {
      setWorkingDays([...workingDays, dayId].sort());
    }
  };

  const toggleUniverse = (u: string) => {
    // Si l'univers n'est pas proposé par le salon, la sélection est bloquée
    if (!allowedUniverses.includes(u)) return;

    if (universes.includes(u)) {
      if (universes.length > 1) {
        setUniverses(universes.filter(item => item !== u));
      }
    } else {
      setUniverses([...universes, u]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Veuillez renseigner le nom du collaborateur.');
      return;
    }

    const effectiveSalonId = salonId || preselectedSalonId || mySalons[0]?.id || currentSalon?.id;
    if (!effectiveSalonId) {
      setErrorMessage("Veuillez d'abord enregistrer un salon avant de créer un collaborateur.");
      return;
    }

    setLoading(true);
    try {
      if (isAdding || !staffMember) {
        const created = await addStaff({
          name: name.trim(),
          role: role.trim(),
          salonId: effectiveSalonId,
          ownerId: currentUser?.id,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password: password.trim() || undefined,
          bio: bio.trim(),
          avatar,
          universe: universes as any,
          workingDays,
          workingHours: { start: startHour, end: endHour },
          color,
        });
        if (onSaved) onSaved(created);
      } else {
        const updated = await updateStaff(staffMember.id, {
          name: name.trim(),
          role: role.trim(),
          salonId: effectiveSalonId,
          ownerId: staffMember.ownerId || currentUser?.id,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          bio: bio.trim(),
          avatar,
          universe: universes as any,
          workingDays,
          workingHours: { start: startHour, end: endHour },
          color,
        });
        if (onSaved) onSaved(updated);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'enregistrement du collaborateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="theme-bg-card border theme-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-auto relative flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b theme-border flex items-center justify-between bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-primary">
                {isAdding ? 'Ajouter un Collaborateur' : 'Modifier le Collaborateur'}
              </h3>
              <p className="text-[11px] theme-text-secondary flex items-center gap-1 flex-wrap">
                {isAdding ? (
                  activeSelectedSalon ? (
                    <>
                      <span>Rattachement au salon :</span>
                      <span className="font-bold text-blue-400">{activeSelectedSalon.name}</span>
                    </>
                  ) : (
                    <span>Rattachement direct à vos établissements</span>
                  )
                ) : (
                  <span>Mise à jour des informations de {staffMember?.name}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-scrollbar">
          
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Propriétaire de rattachement */}
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Propriétaire de rattachement
              </span>
              <span className="text-xs font-bold theme-text-primary truncate block">
                {currentUser?.name || currentUser?.email} {currentUser?.city ? `(${currentUser.city})` : ''}
              </span>
            </div>
          </div>

          {/* Avatar Preview & Selection */}
          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Photo / Avatar du collaborateur
            </label>
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md bg-slate-900 flex-shrink-0">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] theme-text-secondary block mb-1">Choisir un avatar prédéfini :</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        avatar === preset ? 'border-blue-400 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <ImageIcon className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Ou collez l'URL d'une photo personnalisée"
                className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Nom & Prénoms */}
          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
              Nom et prénoms du collaborateur *
            </label>
            <div className="relative">
              <User className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alexandre Meyer"
                required
                className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Rôle / Fonction & Salon de rattachement (Sélection parmi les salons du propriétaire) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                Titre / Fonction *
              </label>
              <div className="relative">
                <Scissors className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Coiffeur Expert / Coloriste"
                  required
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Salon de rattachement *</span>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Fixé
                </span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={salonId || preselectedSalonId || activeSelectedSalon?.id || ''}
                  disabled={true}
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-8 py-2 text-xs theme-text-primary font-semibold shadow-sm opacity-80 cursor-not-allowed bg-black/10"
                >
                  {mySalons.length === 0 ? (
                    <option value="">Aucun salon enregistré - Créez d'abord un salon</option>
                  ) : (
                    mySalons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))
                  )}
                </select>
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Aperçu dynamique et clair du salon sélectionné */}
              {activeSelectedSalon && (
                <div className="mt-2 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 animate-fadeIn">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border theme-border bg-slate-900 flex-shrink-0 shadow-sm">
                    <img 
                      src={activeSelectedSalon.logo || activeSelectedSalon.coverImage || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200'} 
                      alt={activeSelectedSalon.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold theme-text-primary truncate">
                        {activeSelectedSalon.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Fixé
                      </span>
                    </div>
                    <p className="text-[10px] theme-text-secondary truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                      <span>{activeSelectedSalon.city} • {activeSelectedSalon.address}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email & Téléphone (Identifiants Collaborateur) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                Adresse Email {isAdding ? '(Optionnel - Pour connexion)' : ''}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@salon.com"
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Mot de passe (Uniquement si ajout avec email) */}
          {isAdding && email && (
            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                Mot de passe d'accès espace collaborateur
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm font-mono"
                />
              </div>
              <p className="text-[10px] theme-text-muted mt-1">
                Le collaborateur pourra se connecter avec cet email et ce mot de passe.
              </p>
            </div>
          )}

          {/* Bio / Description */}
          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
              Biographie & Spécialités
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Présentation du praticien, techniques maîtrisées..."
              className="w-full theme-bg-subtle border theme-border rounded-xl p-3 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm resize-none"
            />
          </div>

          {/* Jours travaillés (restreints aux jours d'ouverture du salon) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider">
                Jours de travail hebdomadaire *
              </label>
              <span className="text-[10px] text-amber-400 font-bold">
                Ouvert : {activeSelectedSalon?.openingHours?.days || (activeSelectedSalon as any)?.openingDays || 'Lundi au Samedi'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_CONFIG.map((day) => {
                const isOpenAtSalon = salonOpenDays.includes(day.id);
                const isSelected = workingDays.includes(day.id) && isOpenAtSalon;

                if (!isOpenAtSalon) {
                  return (
                    <div
                      key={day.id}
                      className="py-2 rounded-xl text-center font-bold text-xs border border-dashed border-white/10 bg-black/20 text-slate-500 opacity-40 cursor-not-allowed select-none"
                      title={`${day.full} : Le salon est fermé ce jour-là`}
                    >
                      <span>{day.label}</span>
                      <span className="block text-[7px] uppercase font-black text-rose-400/80">Fermé</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`py-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                        : 'theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-primary hover:border-blue-400/50'
                    }`}
                    title={`${day.full} : ${isSelected ? 'Travaille ce jour' : 'Jour de repos'}`}
                  >
                    <span>{day.label}</span>
                    <span className={`block text-[7px] uppercase font-black ${isSelected ? 'text-white' : 'theme-text-muted'}`}>
                      {isSelected ? 'Actif' : 'Repos'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-blue-400/90 font-medium mt-1.5">
              ℹ️ Les jours disponibles sont synchronisés avec la plage d'ouverture de l'établissement ({salonOpenDays.length} jours d'ouverture).
            </p>
          </div>

          {/* Horaires de travail */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                Heure d'arrivée
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                Heure de départ
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Univers pris en charge (restreints à l'univers du salon) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider">
                Univers de soins pris en charge *
              </label>
              <span className="text-[10px] text-amber-400 font-bold capitalize">
                Salon : {activeSelectedSalon?.universe || activeSelectedSalon?.univers || 'Mixte'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[
                { id: 'femme', label: 'Dame 👩' },
                { id: 'homme', label: 'Homme 👨' },
                { id: 'enfant', label: 'Enfant 🧒' },
                { id: 'mixte', label: 'Mixte ✨' },
              ].map((u) => {
                const isAllowed = allowedUniverses.includes(u.id);
                const isSelected = universes.includes(u.id) && isAllowed;

                if (!isAllowed) {
                  return (
                    <div
                      key={u.id}
                      className="py-2 rounded-xl text-center font-bold text-xs border border-dashed border-white/10 bg-black/20 text-slate-500 opacity-40 cursor-not-allowed select-none"
                      title={`${u.label} : Non proposé dans cet établissement (${activeSelectedSalon?.universe || activeSelectedSalon?.univers || 'Mixte'})`}
                    >
                      <span>{u.label}</span>
                      <span className="block text-[7px] uppercase font-black text-rose-400/80">Exclu</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUniverse(u.id)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                        : 'theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-primary hover:border-amber-400/50'
                    }`}
                    title={`${u.label} : ${isSelected ? 'Pris en charge' : 'Désactivé'}`}
                  >
                    <span>{u.label}</span>
                    <span className={`block text-[7px] uppercase font-black ${isSelected ? 'text-slate-950' : 'theme-text-muted'}`}>
                      {isSelected ? 'Actif' : 'Inactif'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-amber-400/90 font-medium mt-1.5">
              ℹ️ Les univers attribuables sont automatiquement restreints à l'univers de l'établissement (<strong>{activeSelectedSalon?.universe || activeSelectedSalon?.univers || 'Mixte'}</strong>).
            </p>
          </div>

        </form>

        {/* Footer */}
        <div className="p-4 border-t theme-border bg-black/20 flex items-center justify-between gap-2 flex-shrink-0">
          {!isAdding && onDelete && staffMember ? (
            <button
              type="button"
              onClick={() => onDelete(staffMember)}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl theme-bg-subtle border theme-border text-xs font-semibold theme-text-secondary hover:theme-text-primary transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAdding ? 'Créer le Collaborateur' : 'Enregistrer'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
