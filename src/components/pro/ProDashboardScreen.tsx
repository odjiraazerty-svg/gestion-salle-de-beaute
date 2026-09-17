import React, { useState, useRef, useMemo } from 'react';
import { useSalon } from '../../context/SalonContext';
import { SalonInfo, StaffMember, AppointmentStatus, ServiceItem, Appointment } from '../../types';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle, 
  ArrowUpRight,
  Sparkles,
  Scissors,
  Store,
  MapPin,
  Building2,
  Check,
  Plus,
  BadgeDollarSign,
  Layers,
  UserCheck,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  UserPlus,
  AlertTriangle,
  ExternalLink,
  Phone,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Search,
  Filter
} from 'lucide-react';
import { SalonRegistrationModal } from '../common/SalonRegistrationModal';
import { SalonDetailModal } from './SalonDetailModal';
import { SalonEditModal } from './SalonEditModal';
import { StaffDetailModal } from './StaffDetailModal';
import { StaffEditModal } from './StaffEditModal';
import { ServiceRegistrationModal } from './ServiceRegistrationModal';

interface Props {
  onNavigateToSchedule: () => void;
  onNavigateToPOS: () => void;
}

type UnifiedTableTab = 'salons' | 'appointments' | 'services' | 'staff';

export const ProDashboardScreen: React.FC<Props> = ({
  onNavigateToSchedule,
  onNavigateToPOS
}) => {
  const { 
    salonInfo, 
    currentSalon, 
    salons, 
    selectSalon, 
    deleteSalon,
    deleteStaff,
    deleteService,
    currentUser, 
    services, 
    staff, 
    appointments, 
    clients, 
    updateAppointmentStatus 
  } = useSalon();

  // Unified Table Active Tab
  const [activeTab, setActiveTab] = useState<UnifiedTableTab>('salons');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'today' | 'confirmed' | 'in_progress' | 'completed'>('all');

  const [isRegisterSalonOpen, setIsRegisterSalonOpen] = useState<boolean>(false);
  const [isSalonSwitcherOpen, setIsSalonSwitcherOpen] = useState<boolean>(false);
  const [isSalonMenuOpen, setIsSalonMenuOpen] = useState<boolean>(false);

  // Modals for viewing, editing, and deleting salon sheets
  const [selectedSalonForView, setSelectedSalonForView] = useState<SalonInfo | null>(null);
  const [selectedSalonForEdit, setSelectedSalonForEdit] = useState<SalonInfo | null>(null);
  const [salonToDelete, setSalonToDelete] = useState<SalonInfo | null>(null);
  const [isDeletingSalon, setIsDeletingSalon] = useState<boolean>(false);

  // Modals for viewing, editing, adding, and deleting staff members
  const [selectedStaffForView, setSelectedStaffForView] = useState<StaffMember | null>(null);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffMember | null>(null);
  const [selectedSalonForStaffAdd, setSelectedSalonForStaffAdd] = useState<SalonInfo | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState<boolean>(false);
  const [isDeletingStaff, setIsDeletingStaff] = useState<boolean>(false);

  // Modals for adding, editing, and deleting services
  const [isRegisterServiceOpen, setIsRegisterServiceOpen] = useState<boolean>(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<ServiceItem | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  const unifiedTableRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // 4 INDICATEURS COCKPIT EXIGÉS (Filtrés fidèlement par prestataire connecté)
  // =========================================================================

  // 1. Salons du prestataire connecté
  const mySalons = useMemo(() => {
    return salons.filter(s => {
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
  }, [salons, currentUser?.id, currentUser?.salonId, currentUser?.role]);

  const mySalonsCount = mySalons.length;
  const mySalonIds = useMemo(() => new Set(mySalons.map(s => s.id)), [mySalons]);

  // Salon actif sécurisé pour ce prestataire
  const activeSalon = mySalons.find(s => s.id === currentSalon?.id) || mySalons[0] || null;

  // 2. Chiffre d'affaires global et rendez-vous des salons du prestataire
  const myAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (currentUser?.role === 'admin') return true;
      return mySalonIds.has(a.salonId);
    });
  }, [appointments, mySalonIds, currentUser?.role]);

  const globalRevenue = useMemo(() => {
    return myAppointments
      .filter(a => a.paid || a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0), 0);
  }, [myAppointments]);

  // 3. Prestations distinctes configurées pour le prestataire
  const myServices = useMemo(() => {
    return services.filter(s => {
      if (currentUser?.role === 'admin') return true;
      if (mySalonsCount === 0) return false;
      return s.salonId ? mySalonIds.has(s.salonId) : true;
    });
  }, [services, mySalonIds, mySalonsCount, currentUser?.role]);

  const distinctServicesCount = useMemo(() => {
    if (mySalonsCount === 0 && currentUser?.role !== 'admin') return 0;
    return new Set(myServices.map(s => (s.nom || s.name || '').trim().toLowerCase())).size;
  }, [myServices, mySalonsCount, currentUser?.role]);

  // 4. Collaborateurs rattachés au propriétaire et à ses salons
  const myStaff = useMemo(() => {
    return staff.filter(st => {
      if (currentUser?.role === 'admin') return true;
      if (currentUser?.role === 'owner') {
        return (st.ownerId && currentUser?.id && st.ownerId === currentUser.id) ||
               (st.salonId && mySalonIds.has(st.salonId));
      }
      if (currentUser?.role === 'employee') {
        return (st.salonId && st.salonId === currentUser.salonId) || st.id === currentUser.staffId;
      }
      return false;
    });
  }, [staff, mySalonIds, currentUser?.id, currentUser?.salonId, currentUser?.staffId, currentUser?.role]);

  // Rendez-vous du jour
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAptsCount = useMemo(() => {
    return myAppointments.filter(a => a.date === todayStr).length;
  }, [myAppointments, todayStr]);

  const handleSelectTab = (tab: UnifiedTableTab) => {
    setActiveTab(tab);
    setTableSearch('');
    setTimeout(() => {
      unifiedTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Filtered lists for the unified table
  const filteredSalons = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return mySalons;
    return mySalons.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.city.toLowerCase().includes(q) || 
      s.address.toLowerCase().includes(q)
    );
  }, [mySalons, tableSearch]);

  const filteredAppointments = useMemo(() => {
    let list = myAppointments;
    if (appointmentFilter === 'today') {
      list = list.filter(a => a.date === todayStr);
    } else if (appointmentFilter !== 'all') {
      list = list.filter(a => a.status === appointmentFilter);
    }

    const q = tableSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter(a => 
      a.clientName.toLowerCase().includes(q) ||
      a.clientPhone.includes(q) ||
      a.serviceName.toLowerCase().includes(q) ||
      a.staffName.toLowerCase().includes(q)
    );
  }, [myAppointments, appointmentFilter, todayStr, tableSearch]);

  const filteredServices = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return myServices;
    return myServices.filter(s => 
      (s.nom || s.name || '').toLowerCase().includes(q) ||
      (s.subCategory || '').toLowerCase().includes(q) ||
      (s.univers || s.universe || '').toLowerCase().includes(q)
    );
  }, [myServices, tableSearch]);

  const filteredStaff = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return myStaff;
    return myStaff.filter(st => 
      st.name.toLowerCase().includes(q) ||
      (st.role || '').toLowerCase().includes(q)
    );
  }, [myStaff, tableSearch]);

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Header Cockpit Title & Actions */}
      <div className="px-4 pt-1 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cockpit Prestataire
            {currentUser && (
              <span className="text-[10px] font-medium text-slate-400 normal-case">
                • {currentUser.name} ({currentUser.role === 'owner' ? 'Gérant' : currentUser.role === 'admin' ? 'Super Admin' : 'Collaborateur'})
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white font-serif">
            Tableau de Bord Général
          </h2>
        </div>

        {/* Salon Actions Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSalonMenuOpen(!isSalonMenuOpen)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Options de gestion des salons"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Ajouter Salon</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSalonMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSalonMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsSalonMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-60 rounded-2xl theme-bg-card border theme-border shadow-2xl p-1.5 z-40 animate-scaleIn">
                <button
                  type="button"
                  onClick={() => {
                    setIsSalonMenuOpen(false);
                    setIsRegisterSalonOpen(true);
                  }}
                  className="w-full text-left p-2.5 rounded-xl theme-bg-subtle hover:theme-badge-accent transition flex items-center gap-2.5 text-xs font-bold theme-text-primary cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="leading-tight">Ajouter un Salon</div>
                    <div className="text-[10px] font-normal theme-text-muted mt-0.5">Enregistrer un nouvel établissement</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSalonMenuOpen(false);
                    handleSelectTab('salons');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:theme-bg-subtle transition flex items-center gap-2.5 text-xs font-semibold theme-text-secondary hover:theme-text-primary cursor-pointer mt-1"
                >
                  <div className="w-7 h-7 rounded-lg theme-bg-subtle flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="leading-tight">Voir Mes Salons ({mySalons.length})</div>
                    <div className="text-[10px] font-normal theme-text-muted mt-0.5">Consulter & éditer les fiches</div>
                  </div>
                </button>

                {mySalons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSalonMenuOpen(false);
                      setIsSalonSwitcherOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:theme-bg-subtle transition flex items-center gap-2.5 text-xs font-semibold theme-text-secondary hover:theme-text-primary cursor-pointer mt-1"
                  >
                    <div className="w-7 h-7 rounded-lg theme-bg-subtle flex items-center justify-center flex-shrink-0">
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="leading-tight">Changer d'établissement actif</div>
                      <div className="text-[10px] font-normal theme-text-muted mt-0.5">Basculer entre vos salons</div>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SALON MANAGEMENT BANNER (ÉTABLISSEMENT ACTIF & ACTIONS) */}
      <div className="px-4">
        {activeSalon ? (
          <div className="p-3.5 rounded-3xl theme-bg-card border theme-border relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border theme-border flex-shrink-0 relative shadow-sm">
                  <img 
                    src={activeSalon.logo || activeSalon.coverImage} 
                    alt={activeSalon.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider theme-text-accent block">
                    Établissement Actif
                  </span>
                  <h3 className="text-sm font-bold theme-text-primary truncate">
                    {activeSalon.name}
                  </h3>
                  <p className="text-[11px] theme-text-secondary flex items-center gap-1 truncate mt-0.5">
                    <MapPin className="w-3 h-3 theme-text-accent flex-shrink-0" />
                    <span>{activeSalon.city} • {activeSalon.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSalonForEdit(activeSalon)}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm hover:opacity-90 transition cursor-pointer"
                  title="Modifier la fiche du salon actif"
                >
                  <Edit3 className="w-3 h-3 stroke-[2.5]" />
                  <span>Modifier Fiche</span>
                </button>
                {mySalons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsSalonSwitcherOpen(true)}
                    className="px-2.5 py-1 rounded-xl theme-bg-subtle border theme-border text-[10px] font-bold theme-text-secondary hover:theme-text-primary transition cursor-pointer"
                  >
                    Changer ({mySalons.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-3xl theme-bg-card border border-amber-500/30 bg-amber-500/5 relative overflow-hidden shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold theme-text-primary">Aucun établissement rattaché</h4>
                <p className="text-[11px] theme-text-secondary mt-0.5">
                  Enregistrez votre premier salon pour commencer vos activités.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisterSalonOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Créer Salon</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LES 4 GRANDS INDICATEURS DU COCKPIT PRESTATAIRE (CARTES RESTAURÉES & ACTIVES) */}
      {/* ========================================================================= */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        
        {/* 1. NOMBRE DE SALONS DU PRESTATAIRE */}
        <div 
          onClick={() => handleSelectTab('salons')}
          className={`p-3.5 rounded-3xl theme-bg-card border space-y-1 relative overflow-hidden shadow-sm transition cursor-pointer group active:scale-[0.98] ${
            activeTab === 'salons' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'theme-border hover:border-amber-500/50'
          }`}
          title="Cliquer pour afficher la liste et gérer vos salons"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary group-hover:theme-text-accent transition">
              Mes Salons
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black theme-text-primary flex items-center justify-between">
            <span>{mySalonsCount}</span>
            <span className="text-[9px] font-bold theme-text-accent px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              Gérer ↓
            </span>
          </p>
          <span className="text-[10px] theme-text-accent font-semibold block">
            {mySalonsCount > 1 ? 'Multi-établissements' : 'Établissement actif'}
          </span>
        </div>

        {/* 2. CHIFFRE D'AFFAIRES GLOBAL DES SALONS */}
        <div 
          onClick={() => handleSelectTab('appointments')}
          className={`p-3.5 rounded-3xl theme-bg-card border space-y-1 relative overflow-hidden shadow-sm transition cursor-pointer group active:scale-[0.98] ${
            activeTab === 'appointments' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'theme-border hover:border-emerald-500/50'
          }`}
          title="Cliquer pour afficher vos rendez-vous"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary group-hover:text-emerald-400 transition">
              CA Global
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black theme-text-primary flex items-center justify-between">
            <span>{globalRevenue.toLocaleString()} <span className="text-xs font-bold theme-text-accent">{salonInfo.currency}</span></span>
            <span className="text-[9px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
              Voir RDV ↓
            </span>
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold block">
            Total encaissé / validé
          </span>
        </div>

        {/* 3. NOMBRE DE PRESTATIONS DISTINCTES (ACTIVE ET CLIQUABLE) */}
        <div 
          onClick={() => handleSelectTab('services')}
          className={`p-3.5 rounded-3xl theme-bg-card border space-y-1 relative overflow-hidden shadow-sm transition cursor-pointer group active:scale-[0.98] ${
            activeTab === 'services' ? 'border-purple-500 ring-2 ring-purple-500/30' : 'theme-border hover:border-purple-500/50'
          }`}
          title="Cliquer pour afficher la liste et gérer vos prestations"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary group-hover:text-purple-400 transition">
              Prestations
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scissors className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black theme-text-primary flex items-center justify-between">
            <span>{distinctServicesCount}</span>
            <span className="text-[9px] font-bold text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition">
              Gérer ↓
            </span>
          </p>
          <span className="text-[10px] text-purple-400 font-semibold block">
            {distinctServicesCount > 1 ? `${distinctServicesCount} formules actives` : distinctServicesCount === 1 ? '1 formule active' : 'Aucune formule'}
          </span>
        </div>

        {/* 4. NOMBRE TOTAL DE COLLABORATEURS DU PRESTATAIRE */}
        <div 
          onClick={() => handleSelectTab('staff')}
          className={`p-3.5 rounded-3xl theme-bg-card border space-y-1 relative overflow-hidden shadow-sm transition cursor-pointer group active:scale-[0.98] ${
            activeTab === 'staff' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'theme-border hover:border-blue-500/50'
          }`}
          title="Cliquer pour afficher la liste et gérer vos collaborateurs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary group-hover:text-blue-400 transition">
              Collaborateurs
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black theme-text-primary flex items-center justify-between">
            <span>{myStaff.length}</span>
            <span className="text-[9px] font-bold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition">
              Gérer ↓
            </span>
          </p>
          <span className="text-[10px] text-blue-400 font-semibold block">
            {myStaff.length > 1 ? `${myStaff.length} praticiens actifs` : myStaff.length === 1 ? '1 praticien actif' : 'Aucun praticien'}
          </span>
        </div>

      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 grid grid-cols-2 gap-2">
        <button
          onClick={onNavigateToSchedule}
          className="p-3 rounded-2xl theme-bg-card border theme-border flex items-center justify-between hover:border-amber-500/40 transition-colors text-left cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold theme-text-primary block">Planning & Agenda</span>
            <span className="text-[10px] theme-text-secondary">Vue interactive par praticien</span>
          </div>
          <ArrowUpRight className="w-4 h-4 theme-text-accent" />
        </button>

        <button
          onClick={onNavigateToPOS}
          className="p-3 rounded-2xl theme-bg-card border theme-border flex items-center justify-between hover:border-amber-500/40 transition-colors text-left cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold theme-text-primary block">Caisse Express</span>
            <span className="text-[10px] theme-text-secondary">Encaissement & Ticket</span>
          </div>
          <CreditCard className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TABLEAU UNIQUE FUSIONNÉ (MES SALONS / MES RENDEZ-VOUS / MES PRESTATIONS / MES COLLABORATEURS) */}
      {/* ========================================================================= */}
      <div ref={unifiedTableRef} className="px-4 space-y-3 pt-2">
        <div className="p-4 rounded-3xl theme-bg-card border theme-border shadow-md space-y-3.5">
          
          {/* Header of Unified Table with Tab Pills & Contextual Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            
            {/* Tabs Selector: MES SALONS / MES RENDEZ-VOUS / MES PRESTATIONS / MES COLLABORATEURS */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-2xl theme-bg-subtle border theme-border">
              
              {/* Tab 1: Mes Salons */}
              <button
                type="button"
                onClick={() => handleSelectTab('salons')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'salons'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Mes Salons</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'salons' ? 'bg-slate-950/20 text-slate-950' : 'theme-bg-card theme-text-accent'
                }`}>
                  {mySalons.length}
                </span>
              </button>

              {/* Tab 2: Mes Rendez-vous */}
              <button
                type="button"
                onClick={() => handleSelectTab('appointments')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'appointments'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mes Rendez-vous</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'appointments' ? 'bg-slate-950/20 text-slate-950' : 'theme-bg-card text-emerald-400'
                }`}>
                  {myAppointments.length}
                </span>
              </button>

              {/* Tab 3: Mes Prestations */}
              <button
                type="button"
                onClick={() => handleSelectTab('services')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Mes Prestations</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'services' ? 'bg-black/20 text-white' : 'theme-bg-card text-purple-400'
                }`}>
                  {myServices.length}
                </span>
              </button>

              {/* Tab 4: Mes Collaborateurs */}
              <button
                type="button"
                onClick={() => handleSelectTab('staff')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mes Collaborateurs</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'staff' ? 'bg-black/20 text-white' : 'theme-bg-card text-blue-400'
                }`}>
                  {myStaff.length}
                </span>
              </button>

            </div>

            {/* Quick Context Action Button */}
            <div className="flex-shrink-0">
              {activeTab === 'salons' && (
                <button
                  type="button"
                  onClick={() => setIsRegisterSalonOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ajouter Salon</span>
                </button>
              )}

              {activeTab === 'appointments' && (
                <button
                  type="button"
                  onClick={onNavigateToSchedule}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Nouveau Rendez-vous</span>
                </button>
              )}

              {activeTab === 'services' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceForEdit(null);
                    setIsRegisterServiceOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ajouter Prestation</span>
                </button>
              )}

              {activeTab === 'staff' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaffForEdit(null);
                    setSelectedSalonForStaffAdd(currentSalon || mySalons[0] || null);
                    setIsAddingStaff(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ajouter Collaborateur</span>
                </button>
              )}
            </div>

          </div>

          {/* Search Bar & Appointment Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
              <input 
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={
                  activeTab === 'salons' ? "Rechercher un salon (nom, ville, adresse)..." :
                  activeTab === 'appointments' ? "Rechercher un RDV (client, téléphone, prestation, praticien)..." :
                  activeTab === 'services' ? "Rechercher une prestation (nom, univers, catégorie)..." :
                  "Rechercher un collaborateur (nom, rôle)..."
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl theme-bg-subtle border theme-border text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs theme-text-muted hover:theme-text-primary"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Appointment Status Filters */}
            {activeTab === 'appointments' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'today', label: `Aujourd'hui (${todayAptsCount})` },
                  { id: 'confirmed', label: 'Confirmés' },
                  { id: 'in_progress', label: 'En cours' },
                  { id: 'completed', label: 'Terminés' }
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setAppointmentFilter(flt.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                      appointmentFilter === flt.id
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'theme-bg-subtle theme-text-secondary hover:theme-text-primary border theme-border'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* TAB 1 : MES SALONS */}
          {/* ================================================================= */}
          {activeTab === 'salons' && (
            <div className="space-y-3">
              {filteredSalons.length === 0 ? (
                <div className="p-8 rounded-2xl theme-bg-subtle border border-dashed theme-border text-center space-y-3">
                  <Store className="w-10 h-10 theme-text-muted mx-auto" />
                  <div>
                    <p className="text-xs font-bold theme-text-primary">
                      {tableSearch ? 'Aucun salon ne correspond à votre recherche' : 'Aucun salon enregistré pour l\'instant'}
                    </p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">
                      {tableSearch ? 'Essayez avec un autre mot-clé.' : 'Répertoriez votre premier salon pour commencer à gérer vos prestations et rendez-vous.'}
                    </p>
                  </div>
                  {!tableSearch && (
                    <button
                      type="button"
                      onClick={() => setIsRegisterSalonOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Enregistrer un Salon</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border theme-border shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b theme-border theme-bg-subtle text-[11px] font-bold theme-text-muted uppercase tracking-wider">
                          <th className="py-3 px-4">Salon</th>
                          <th className="py-3 px-4">Jours & Horaires d'ouverture</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y theme-border">
                        {filteredSalons.map((s) => {
                          const isActive = currentSalon?.id === s.id;
                          return (
                            <tr
                              key={s.id}
                              className={`transition-colors hover:bg-amber-500/5 ${
                                isActive ? 'bg-amber-500/[0.03]' : ''
                              }`}
                            >
                              {/* 1. Logo + Nom + Localisation */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border theme-border flex-shrink-0 bg-slate-900 shadow-sm">
                                    <img
                                      src={s.logo || s.coverImage}
                                      alt={s.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {isActive && (
                                      <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-slate-950 text-[6px] font-black text-center py-0.2 tracking-wider uppercase">
                                        Actif
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold theme-text-primary truncate">
                                        {s.name}
                                      </span>
                                      {isActive ? (
                                        <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                          En cours
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => selectSalon(s.id)}
                                          className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20 transition cursor-pointer"
                                          title="Activer ce salon"
                                        >
                                          Basculer
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-[10px] theme-text-secondary flex items-center gap-1 truncate mt-0.5">
                                      <MapPin className="w-2.5 h-2.5 theme-text-accent flex-shrink-0" />
                                      <span>{s.city} • {s.address}</span>
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Jours & Horaires d'ouverture */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-primary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    <span>{s.openingHours?.days || 'Lun - Sam'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] theme-text-secondary">
                                    <Clock className="w-3 h-3 theme-text-accent flex-shrink-0" />
                                    <span>{s.openingHours?.hours || '08:30 - 20:00'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Actions */}
                              <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedStaffForEdit(null);
                                        setSelectedSalonForStaffAdd(s);
                                        setIsAddingStaff(true);
                                      }}
                                      className="w-8 h-8 rounded-xl bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                      title={`Ajouter un collaborateur pour le salon ${s.name}`}
                                    >
                                      <UserPlus className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedSalonForView(s)}
                                      className="w-8 h-8 rounded-xl theme-bg-subtle hover:bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                      title="Afficher la fiche détaillée du salon"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedSalonForEdit(s)}
                                      className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 inline-flex items-center justify-center shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-90"
                                      title="Mettre à jour les informations du salon"
                                    >
                                      <Edit3 className="w-4 h-4 stroke-[2.5]" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSalonToDelete(s)}
                                      className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                      title="Supprimer définitivement ce salon"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2 : MES RENDEZ-VOUS */}
          {/* ================================================================= */}
          {activeTab === 'appointments' && (
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 rounded-2xl theme-bg-subtle border border-dashed theme-border text-center space-y-3">
                  <Calendar className="w-10 h-10 theme-text-muted mx-auto" />
                  <div>
                    <p className="text-xs font-bold theme-text-primary">
                      {tableSearch ? 'Aucun rendez-vous trouvé' : 'Aucun rendez-vous enregistré'}
                    </p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">
                      {tableSearch ? 'Modifiez vos filtres de recherche.' : 'Les réservations prises par vos clients apparaîtront ici.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToSchedule}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md hover:bg-emerald-400 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 stroke-[2.5]" />
                    <span>Ouvrir le Planning</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border theme-border shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b theme-border theme-bg-subtle text-[11px] font-bold theme-text-muted uppercase tracking-wider">
                          <th className="py-3 px-4">Date & Heure</th>
                          <th className="py-3 px-4">Client</th>
                          <th className="py-3 px-4">Prestation & Praticien</th>
                          <th className="py-3 px-4">Montant & Paiement</th>
                          <th className="py-3 px-4 text-right">Statut / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y theme-border">
                        {filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="transition-colors hover:bg-emerald-500/5">
                            {/* Date & Time */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="text-center theme-bg-subtle p-2 rounded-xl border theme-border min-w-[50px]">
                                  <span className="text-xs font-black text-emerald-400 block leading-tight">{apt.time}</span>
                                  <span className="text-[9px] theme-text-muted block">{apt.duration}m</span>
                                </div>
                                <div>
                                  <span className="text-xs font-bold theme-text-primary block">{apt.date}</span>
                                  <span className="text-[10px] theme-text-muted">{apt.salonName || 'Salon'}</span>
                                </div>
                              </div>
                            </td>

                            {/* Client Info */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold theme-text-primary">{apt.clientName}</h4>
                                <p className="text-[10px] theme-text-secondary flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 theme-text-accent" />
                                  <span>{apt.clientPhone}</span>
                                </p>
                              </div>
                            </td>

                            {/* Service & Staff */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="text-xs font-semibold theme-text-primary flex items-center gap-1">
                                  <Scissors className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                  <span>{apt.serviceName}</span>
                                </span>
                                <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span>{apt.staffName}</span>
                                </span>
                              </div>
                            </td>

                            {/* Price & Payment */}
                            <td className="py-3.5 px-4">
                              <div>
                                <span className="text-xs font-black theme-text-primary block">
                                  {apt.price} {salonInfo.currency}
                                </span>
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                                  apt.paid 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {apt.paid ? `Payé (${apt.paymentMethod || 'Encaissé'})` : 'Non payé'}
                                </span>
                              </div>
                            </td>

                            {/* Status and Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Status Toggle Dropdown / Buttons */}
                                <div className="inline-flex rounded-xl p-0.5 theme-bg-subtle border theme-border">
                                  <button
                                    type="button"
                                    onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                                      apt.status === 'confirmed'
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'theme-text-muted hover:theme-text-primary'
                                    }`}
                                    title="Marquer Confirmé"
                                  >
                                    Confirmé
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                                      apt.status === 'in_progress'
                                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                        : 'theme-text-muted hover:theme-text-primary'
                                    }`}
                                    title="Marquer En cours"
                                  >
                                    En cours
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                                      apt.status === 'completed'
                                        ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                        : 'theme-text-muted hover:theme-text-primary'
                                    }`}
                                    title="Marquer Terminé"
                                  >
                                    Terminé
                                  </button>
                                </div>

                                {!apt.paid && (
                                  <button
                                    type="button"
                                    onClick={onNavigateToPOS}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition"
                                    title="Encaisser en caisse express"
                                  >
                                    <CreditCard className="w-3 h-3 stroke-[2.5]" />
                                    <span>Encaisser</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3 : MES PRESTATIONS */}
          {/* ================================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <div className="p-8 rounded-2xl theme-bg-subtle border border-dashed theme-border text-center space-y-3">
                  <Scissors className="w-10 h-10 theme-text-muted mx-auto" />
                  <div>
                    <p className="text-xs font-bold theme-text-primary">
                      {tableSearch ? 'Aucune prestation trouvée' : 'Aucune prestation enregistrée'}
                    </p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">
                      Ajoutez des formules de coiffure, esthétique ou soins à votre catalogue.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServiceForEdit(null);
                      setIsRegisterServiceOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold shadow-md hover:bg-purple-400 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Créer une Prestation</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border theme-border shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b theme-border theme-bg-subtle text-[11px] font-bold theme-text-muted uppercase tracking-wider">
                          <th className="py-3 px-4">Prestation & Soin</th>
                          <th className="py-3 px-4">Univers & Catégorie</th>
                          <th className="py-3 px-4">Tarif & Durée</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y theme-border">
                        {filteredServices.map((srv) => (
                          <tr key={srv.id} className="transition-colors hover:bg-purple-500/5">
                            {/* Image + Nom + Description */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border theme-border flex-shrink-0 bg-slate-900 shadow-sm">
                                  <img 
                                    src={srv.image_ulistration || srv.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200'} 
                                    alt={srv.nom || srv.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold theme-text-primary truncate">{srv.nom || srv.name}</h4>
                                  <p className="text-[10px] theme-text-secondary truncate max-w-xs mt-0.5">
                                    {srv.description || 'Soin et prestation professionnelle'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Univers & Category */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  {srv.univers || srv.universe || 'Mixte'}
                                </span>
                                <div className="text-[10px] theme-text-secondary">
                                  {srv.subCategory || 'Prestation'}
                                </div>
                              </div>
                            </td>

                            {/* Price & Duration */}
                            <td className="py-3.5 px-4">
                              <div>
                                <span className="text-xs font-black theme-text-primary block">
                                  {srv.cout || srv.price || 0} {salonInfo.currency}
                                </span>
                                <span className="text-[10px] theme-text-muted flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5 theme-text-accent" />
                                  <span>{srv.duree || srv.duration || 30} min</span>
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedServiceForEdit(srv);
                                    setIsRegisterServiceOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                  title="Modifier la prestation"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setServiceToDelete(srv)}
                                  className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                  title="Supprimer la prestation"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4 : MES COLLABORATEURS */}
          {/* ================================================================= */}
          {activeTab === 'staff' && (
            <div className="space-y-3">
              {filteredStaff.length === 0 ? (
                <div className="p-8 rounded-2xl theme-bg-subtle border border-dashed theme-border text-center space-y-3">
                  <Users className="w-10 h-10 theme-text-muted mx-auto" />
                  <div>
                    <p className="text-xs font-bold theme-text-primary">
                      {tableSearch ? 'Aucun collaborateur trouvé' : 'Aucun collaborateur enregistré'}
                    </p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">
                      Ajoutez vos coiffeurs, esthéticiennes et praticiens pour leur attribuer des prestations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaffForEdit(null);
                      setSelectedSalonForStaffAdd(currentSalon || mySalons[0] || null);
                      setIsAddingStaff(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold shadow-md hover:bg-blue-400 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Enregistrer un Collaborateur</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border theme-border shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b theme-border theme-bg-subtle text-[11px] font-bold theme-text-muted uppercase tracking-wider">
                          <th className="py-3 px-4">Collaborateur</th>
                          <th className="py-3 px-4">Salon de rattachement</th>
                          <th className="py-3 px-4">Jours & Horaires</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y theme-border">
                        {filteredStaff.map((st) => {
                          const assignedSalon = salons.find(s => s.id === st.salonId);
                          return (
                            <tr key={st.id} className="transition-colors hover:bg-blue-500/5">
                              {/* Avatar + Nom + Rôle */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border theme-border flex-shrink-0 bg-slate-900 shadow-sm">
                                    <img
                                      src={st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                                      alt={st.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold theme-text-primary truncate">{st.name}</span>
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        {st.role || 'Praticien'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold mt-0.5">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      <span>{st.rating || 5.0}</span>
                                      <span className="theme-text-muted font-normal">({st.reviewsCount || 0} avis)</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Assigned Salon */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-primary">
                                  <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                  <span className="truncate">
                                    {assignedSalon ? `${assignedSalon.name} (${assignedSalon.city})` : 'Tous les salons'}
                                  </span>
                                </div>
                              </td>

                              {/* Schedule */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-[11px] font-semibold theme-text-primary">
                                    <Clock className="w-3 h-3 theme-text-accent flex-shrink-0" />
                                    <span>{st.workingHours?.start || '09:00'} - {st.workingHours?.end || '19:00'}</span>
                                  </div>
                                  <div className="text-[10px] theme-text-secondary">
                                    {(st.workingDays || [1,2,3,4,5,6]).length} j/semaine
                                  </div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStaffForView(st)}
                                    className="w-8 h-8 rounded-xl theme-bg-subtle hover:bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                    title="Afficher la fiche détaillée du collaborateur"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingStaff(false);
                                      setSelectedStaffForEdit(st);
                                    }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white inline-flex items-center justify-center shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-90"
                                    title="Mettre à jour les informations du collaborateur"
                                  >
                                    <Edit3 className="w-4 h-4 stroke-[2.5]" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setStaffToDelete(st)}
                                    className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 inline-flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                                    title="Supprimer ce collaborateur"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS : GESTION DES FICHES, CRÉATIONS ET CONFIRMATIONS */}
      {/* ========================================================================= */}

      {/* Staff View Detail Modal */}
      <StaffDetailModal
        staffMember={selectedStaffForView}
        isOpen={selectedStaffForView !== null}
        onClose={() => setSelectedStaffForView(null)}
        onOpenEdit={(st) => {
          setSelectedStaffForView(null);
          setIsAddingStaff(false);
          setSelectedStaffForEdit(st);
        }}
        onDelete={(st) => {
          setSelectedStaffForView(null);
          setStaffToDelete(st);
        }}
      />

      {/* Staff Add & Edit Modal */}
      <StaffEditModal
        staffMember={selectedStaffForEdit}
        isAdding={isAddingStaff}
        preselectedSalonId={selectedSalonForStaffAdd?.id}
        isOpen={isAddingStaff || selectedStaffForEdit !== null}
        onClose={() => {
          setIsAddingStaff(false);
          setSelectedStaffForEdit(null);
          setSelectedSalonForStaffAdd(null);
        }}
        onDelete={(st) => {
          setIsAddingStaff(false);
          setSelectedStaffForEdit(null);
          setSelectedSalonForStaffAdd(null);
          setStaffToDelete(st);
        }}
        onSaved={(updated) => {
          if (selectedStaffForView && selectedStaffForView.id === updated.id) {
            setSelectedStaffForView(updated);
          }
        }}
      />

      {/* Staff Delete Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="theme-bg-card border border-rose-500/30 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black theme-text-primary">
                  Supprimer le collaborateur
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  Cette action retirera le collaborateur de l'équipe et de vos plannings.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl theme-bg-subtle border theme-border flex items-center gap-3">
              <img 
                src={staffToDelete.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} 
                alt={staffToDelete.name}
                className="w-12 h-12 rounded-xl object-cover border theme-border flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold theme-text-primary truncate">{staffToDelete.name}</h4>
                <p className="text-[11px] text-blue-400 font-semibold truncate mt-0.5">
                  {staffToDelete.role || 'Collaborateur & Praticien'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t theme-border">
              <button
                type="button"
                disabled={isDeletingStaff}
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold theme-text-secondary hover:theme-text-primary transition cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isDeletingStaff}
                onClick={async () => {
                  if (!staffToDelete) return;
                  try {
                    setIsDeletingStaff(true);
                    await deleteStaff(staffToDelete.id);
                    setStaffToDelete(null);
                  } catch (err: any) {
                    alert(err.message || 'Erreur lors de la suppression du collaborateur');
                  } finally {
                    setIsDeletingStaff(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingStaff ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Registration/Edit Modal */}
      <ServiceRegistrationModal
        isOpen={isRegisterServiceOpen}
        onClose={() => {
          setIsRegisterServiceOpen(false);
          setSelectedServiceForEdit(null);
        }}
        serviceToEdit={selectedServiceForEdit}
      />

      {/* Service Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="theme-bg-card border border-rose-500/30 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black theme-text-primary">
                  Supprimer la prestation
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  Cette prestation sera retirée du catalogue.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl theme-bg-subtle border theme-border flex items-center gap-3">
              <img 
                src={serviceToDelete.image_ulistration || serviceToDelete.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200'} 
                alt={serviceToDelete.nom || serviceToDelete.name}
                className="w-12 h-12 rounded-xl object-cover border theme-border flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold theme-text-primary truncate">{serviceToDelete.nom || serviceToDelete.name}</h4>
                <p className="text-[11px] text-purple-400 font-semibold truncate mt-0.5">
                  {serviceToDelete.cout || serviceToDelete.price} {salonInfo.currency} • {serviceToDelete.duree || serviceToDelete.duration} min
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t theme-border">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold theme-text-secondary hover:theme-text-primary transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteService(serviceToDelete.id);
                  setServiceToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salon View Detail Modal */}
      <SalonDetailModal
        salon={selectedSalonForView}
        isOpen={selectedSalonForView !== null}
        onClose={() => setSelectedSalonForView(null)}
        onOpenEdit={(s) => setSelectedSalonForEdit(s)}
        onAddStaff={(s) => {
          setSelectedStaffForEdit(null);
          setSelectedSalonForStaffAdd(s);
          setIsAddingStaff(true);
        }}
        onDelete={(s) => {
          setSelectedSalonForView(null);
          setSalonToDelete(s);
        }}
      />

      {/* Salon Edit Modal */}
      <SalonEditModal
        salon={selectedSalonForEdit}
        isOpen={selectedSalonForEdit !== null}
        onClose={() => setSelectedSalonForEdit(null)}
        onDelete={(s) => {
          setSelectedSalonForEdit(null);
          setSalonToDelete(s);
        }}
        onUpdated={(updated) => {
          if (selectedSalonForView && selectedSalonForView.id === updated.id) {
            setSelectedSalonForView(updated);
          }
        }}
      />

      {/* Salon Delete Confirmation Modal */}
      {salonToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="theme-bg-card border border-rose-500/30 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black theme-text-primary">
                  Supprimer l'établissement
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  Cette action supprimera le salon et toutes ses données associées.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl theme-bg-subtle border theme-border flex items-center gap-3">
              <img 
                src={salonToDelete.logo || salonToDelete.coverImage} 
                alt={salonToDelete.name}
                className="w-12 h-12 rounded-xl object-cover border theme-border flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold theme-text-primary truncate">{salonToDelete.name}</h4>
                <p className="text-[11px] theme-text-secondary truncate mt-0.5">
                  {salonToDelete.city} • {salonToDelete.address}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t theme-border">
              <button
                type="button"
                disabled={isDeletingSalon}
                onClick={() => setSalonToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold theme-text-secondary hover:theme-text-primary transition cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isDeletingSalon}
                onClick={async () => {
                  if (!salonToDelete) return;
                  try {
                    setIsDeletingSalon(true);
                    await deleteSalon(salonToDelete.id);
                    setSalonToDelete(null);
                  } catch (err: any) {
                    alert(err.message || 'Erreur lors de la suppression du salon');
                  } finally {
                    setIsDeletingSalon(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingSalon ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salon Registration Modal */}
      <SalonRegistrationModal
        isOpen={isRegisterSalonOpen}
        onClose={() => setIsRegisterSalonOpen(false)}
      />

      {/* Multi-Salons Switcher Modal */}
      {isSalonSwitcherOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="theme-bg-card border theme-border rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 theme-text-accent" />
                <h3 className="text-sm font-bold theme-text-primary">Mes Établissements</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSalonSwitcherOpen(false)}
                className="theme-text-muted hover:theme-text-primary text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs theme-text-secondary mb-4">
              Sélectionnez le salon de beauté sur lequel vous souhaitez travailler :
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {mySalons.length === 0 ? (
                <div className="text-center py-6 text-xs theme-text-muted">
                  Aucun établissement enregistré pour votre compte.
                </div>
              ) : (
                mySalons.map((s) => {
                  const isSelected = s.id === currentSalon.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        selectSalon(s.id);
                        setIsSalonSwitcherOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'theme-badge-accent border-2 font-bold shadow-sm'
                          : 'theme-bg-subtle border theme-border hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={s.logo || s.coverImage}
                          alt={s.name}
                          className="w-10 h-10 rounded-xl object-cover border theme-border"
                        />
                        <div>
                          <div className="text-xs font-bold theme-text-primary flex items-center gap-1.5">
                            <span>{s.name}</span>
                            {(s.ownerId === currentUser?.id || s.id === currentUser?.salonId) && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Mon Établissement
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] theme-text-secondary flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 theme-text-accent" />
                            <span>{s.city}</span>
                            <span>•</span>
                            <span>{s.openingHours?.days || 'Ouvert'}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full theme-btn-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSalonSwitcherOpen(false);
                setIsRegisterSalonOpen(true);
              }}
              className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Répertorier un nouveau Salon</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
