import React, { useState, useEffect, useCallback } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ServiceItem, SalonInfo, ClientProfile, Appointment, AuthUser } from '../../types';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Layers, 
  Store,
  Users,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Award,
  CreditCard,
  CheckCircle,
  Clock3,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { PrestationRegistrationModal } from './PrestationRegistrationModal';

type AdminTab = 'prestations' | 'salons' | 'prestataires' | 'clients' | 'rendezvous' | 'chiffreAffaires';

interface AdminStats {
  servicesCount: number;
  salonsCount: number;
  providersCount: number;
  staffCount: number;
  clientsCount: number;
  appointmentsCount: number;
  totalRevenue: number;
}

export const AdminServicesScreen: React.FC = () => {
  const { services, deleteService, salons, clients, appointments, refreshFromDb } = useSalon();

  const [activeTab, setActiveTab] = useState<AdminTab>('prestations');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    servicesCount: services.length,
    salonsCount: salons.length,
    providersCount: 0,
    staffCount: 0,
    clientsCount: 0,
    appointmentsCount: 0,
    totalRevenue: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [statsData, fetchedUsers] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getUsers().catch(() => [])
      ]);

      if (statsData) {
        setStats(statsData);
      } else {
        setStats({
          servicesCount: services.length,
          salonsCount: salons.length,
          providersCount: (fetchedUsers || []).filter((u: any) => u.role === 'owner').length,
          staffCount: 0,
          clientsCount: clients.length,
          appointmentsCount: appointments.length,
          totalRevenue: appointments
            .filter((a) => a.paid || a.status === 'completed')
            .reduce((sum, a) => sum + (Number(a.price) || 0), 0)
        });
      }

      if (fetchedUsers) {
        setUsersList(fetchedUsers);
      }
    } catch {
      // Fallback
    }
  }, [services.length, salons.length, clients.length, appointments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshFromDb(), loadData()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenCreate = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceItem) => {
    setServiceToEdit(service);
    setIsModalOpen(true);
  };

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (s.nom || s.name || '').toLowerCase();
    const desc = (s.description || '').toLowerCase();
    const univ = (s.univers || s.universe || '').toLowerCase();
    return name.includes(q) || desc.includes(q) || univ.includes(q);
  });

  // Filtered Salons
  const filteredSalons = salons.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (s.name || '').toLowerCase();
    const city = (s.city || '').toLowerCase();
    const address = (s.address || '').toLowerCase();
    const phone = (s.phone || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    return name.includes(q) || city.includes(q) || address.includes(q) || phone.includes(q) || email.includes(q);
  });

  // Filtered Providers (users where role = 'owner')
  const providersList = usersList.filter((u) => u.role === 'owner');
  const filteredProviders = providersList.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (p.name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const salon = (p.salonName || p.salonId || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || salon.includes(q);
  });

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const fav = (c.favoriteService || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q) || fav.includes(q);
  });

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const cName = (a.clientName || '').toLowerCase();
    const sName = (a.serviceName || '').toLowerCase();
    const salName = (a.salonName || '').toLowerCase();
    const stName = (a.staffName || '').toLowerCase();
    const phone = (a.clientPhone || '').toLowerCase();
    const date = (a.date || '').toLowerCase();
    return cName.includes(q) || sName.includes(q) || salName.includes(q) || stName.includes(q) || phone.includes(q) || date.includes(q);
  });

  // Filtered Revenue Transactions
  const revenueAppointments = appointments.filter((a) => a.paid || a.status === 'completed');
  const filteredTransactions = revenueAppointments.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const cName = (t.clientName || '').toLowerCase();
    const sName = (t.serviceName || '').toLowerCase();
    const salName = (t.salonName || '').toLowerCase();
    const qr = (t.qrCode || t.id || '').toLowerCase();
    const method = (t.paymentMethod || '').toLowerCase();
    return cName.includes(q) || sName.includes(q) || salName.includes(q) || qr.includes(q) || method.includes(q);
  });

  // Get current active count
  const getCurrentCount = () => {
    switch (activeTab) {
      case 'prestations': return filteredServices.length;
      case 'salons': return filteredSalons.length;
      case 'prestataires': return filteredProviders.length;
      case 'clients': return filteredClients.length;
      case 'rendezvous': return filteredAppointments.length;
      case 'chiffreAffaires': return filteredTransactions.length;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'prestations': return 'Prestations au Répertoire';
      case 'salons': return 'Salons de Beauté Partenaires';
      case 'prestataires': return 'Prestataires & Gérants';
      case 'clients': return 'Comptes Clients Inscrits';
      case 'rendezvous': return 'Rendez-vous Globaux';
      case 'chiffreAffaires': return 'Transactions & Chiffre d\'Affaires';
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'prestations': return 'Rechercher une prestation par nom, univers, description...';
      case 'salons': return 'Rechercher un salon par nom, ville, adresse, téléphone...';
      case 'prestataires': return 'Rechercher un prestataire par nom, email, téléphone, salon...';
      case 'clients': return 'Rechercher un client par nom, numéro, email...';
      case 'rendezvous': return 'Rechercher un rendez-vous par client, prestation, salon, date...';
      case 'chiffreAffaires': return 'Rechercher une transaction par pass, salon, client, mode...';
    }
  };

  return (
    <div className="space-y-4 animate-slide-up pb-10">
      {/* Compact Minimal Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold theme-text-primary font-serif flex items-center gap-2">
              <span>Console Administrateur</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Synchronisé avec PostgreSQL" />
            </h1>
            <p className="text-[11px] theme-text-secondary">Sélectionnez une carte pour afficher et gérer les enregistrements</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl theme-bg-card border theme-border hover:theme-border-accent theme-text-secondary hover:theme-text-primary transition active:scale-95 cursor-pointer shadow-sm"
            title="Actualiser les données en temps réel depuis PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          {activeTab === 'prestations' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider hover:brightness-105 flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Répertorier une Prestation</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern High-End KPI Cards Grid: 3 at top, 3 at bottom - ALL INTERACTIVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {/* Card 1: Prestations */}
        <div 
          onClick={() => { setActiveTab('prestations'); setSearchQuery(''); }}
          className={`p-4 rounded-3xl theme-bg-card border transition-all cursor-pointer group relative overflow-hidden text-left ${
            activeTab === 'prestations'
              ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/10'
              : 'theme-border hover:border-amber-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeTab === 'prestations' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'bg-amber-500/15 border border-amber-500/30 text-amber-500'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              activeTab === 'prestations' ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {activeTab === 'prestations' ? '● Actif' : 'Catalogue'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black theme-text-accent">
              {stats.servicesCount}
            </div>
            <div className="text-xs font-bold theme-text-primary mt-1">
              Prestations au Répertoire
            </div>
            <p className="text-[10px] theme-text-muted mt-0.5">
              Modèles officiels disponibles sur la plateforme
            </p>
          </div>
        </div>

        {/* Card 2: Salons */}
        <div 
          onClick={() => { setActiveTab('salons'); setSearchQuery(''); }}
          className={`p-4 rounded-3xl theme-bg-card border transition-all cursor-pointer group relative overflow-hidden text-left ${
            activeTab === 'salons'
              ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/5 shadow-md shadow-blue-500/10'
              : 'theme-border hover:border-blue-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeTab === 'salons' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-blue-500/15 border border-blue-500/30 text-blue-500'
            }`}>
              <Store className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              activeTab === 'salons' ? 'bg-blue-500 text-white border-blue-500 font-black' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}>
              {activeTab === 'salons' ? '● Actif' : 'Réseau'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black theme-text-primary">
              {stats.salonsCount}
            </div>
            <div className="text-xs font-bold theme-text-primary mt-1">
              Salons de Beauté Partenaires
            </div>
            <p className="text-[10px] theme-text-muted mt-0.5">
              Établissements opérationnels créés
            </p>
          </div>
        </div>

        {/* Card 3: Prestataires */}
        <div 
          onClick={() => { setActiveTab('prestataires'); setSearchQuery(''); }}
          className={`p-4 rounded-3xl theme-bg-card border transition-all cursor-pointer group relative overflow-hidden text-left ${
            activeTab === 'prestataires'
              ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-500/5 shadow-md shadow-purple-500/10'
              : 'theme-border hover:border-purple-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeTab === 'prestataires' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-purple-500/15 border border-purple-500/30 text-purple-500'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              activeTab === 'prestataires' ? 'bg-purple-500 text-white border-purple-500 font-black' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            }`}>
              {activeTab === 'prestataires' ? '● Actif' : 'Gérants'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black theme-text-primary">
              {stats.providersCount}
            </div>
            <div className="text-xs font-bold theme-text-primary mt-1">
              Prestataires & Propriétaires
            </div>
            <p className="text-[10px] theme-text-muted mt-0.5">
              Comptes gérants de salons enregistrés
            </p>
          </div>
        </div>

        {/* Card 4: Clients */}
        <div 
          onClick={() => { setActiveTab('clients'); setSearchQuery(''); }}
          className={`p-4 rounded-3xl theme-bg-card border transition-all cursor-pointer group relative overflow-hidden text-left ${
            activeTab === 'clients'
              ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
              : 'theme-border hover:border-emerald-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeTab === 'clients' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500'
            }`}>
              <UserCheck className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              activeTab === 'clients' ? 'bg-emerald-500 text-white border-emerald-500 font-black' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}>
              {activeTab === 'clients' ? '● Actif' : 'Base Clients'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black theme-text-primary">
              {stats.clientsCount}
            </div>
            <div className="text-xs font-bold theme-text-primary mt-1">
              Comptes Clients Inscrits
            </div>
            <p className="text-[10px] theme-text-muted mt-0.5">
              Utilisateurs actifs sur l'application
            </p>
          </div>
        </div>

        {/* Card 5: Réservations */}
        <div 
          onClick={() => { setActiveTab('rendezvous'); setSearchQuery(''); }}
          className={`p-4 rounded-3xl theme-bg-card border transition-all cursor-pointer group relative overflow-hidden text-left ${
            activeTab === 'rendezvous'
              ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-500/5 shadow-md shadow-rose-500/10'
              : 'theme-border hover:border-rose-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeTab === 'rendezvous' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-rose-500/15 border border-rose-500/30 text-rose-500'
            }`}>
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              activeTab === 'rendezvous' ? 'bg-rose-500 text-white border-rose-500 font-black' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              {activeTab === 'rendezvous' ? '● Actif' : 'Activité'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black theme-text-primary">
              {stats.appointmentsCount}
            </div>
            <div className="text-xs font-bold theme-text-primary mt-1">
              Rendez-vous Globaux
            </div>
            <p className="text-[10px] theme-text-muted mt-0.5">
              Réservations cumulées sur la plateforme
            </p>
          </div>
        </div>

        {/* Card 6: Chiffre d'Affaires Global */}
        <div 
          onClick={() => { setActiveTab('chiffreAffaires'); setSearchQuery(''); }}
          className={`p-4 rounded-3xl theme-bg-card border transition-all cursor-pointer group relative overflow-hidden text-left ${
            activeTab === 'chiffreAffaires'
              ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/10'
              : 'theme-border hover:border-amber-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeTab === 'chiffreAffaires' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'bg-amber-500/15 border border-amber-500/30 text-amber-500'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              activeTab === 'chiffreAffaires' ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {activeTab === 'chiffreAffaires' ? '● Actif' : 'Volume SaaS'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-500 truncate">
              {stats.totalRevenue.toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
            </div>
            <div className="text-xs font-bold theme-text-primary mt-1">
              Chiffre d'Affaires Global
            </div>
            <p className="text-[10px] theme-text-muted mt-0.5">
              Volume total des prestations encaissées
            </p>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-2">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl theme-bg-card border theme-border theme-text-primary placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="text-xs font-semibold theme-text-secondary flex items-center gap-1.5">
            <span className="font-bold theme-text-primary">{getTabTitle()} :</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[11px] font-bold">
              {getCurrentCount()} enregistrement(s)
            </span>
          </div>

          {activeTab === 'prestations' && (
            <div className="flex items-center theme-bg-card p-1 rounded-xl border theme-border">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table' ? 'theme-btn-primary' : 'theme-text-muted hover:theme-text-primary'
                }`}
                title="Vue Tableau Administrateur"
              >
                Tableau
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid' ? 'theme-btn-primary' : 'theme-text-muted hover:theme-text-primary'
                }`}
                title="Vue Cartes"
              >
                Cartes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PRESTATIONS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'prestations' && (
        filteredServices.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-card border border-dashed theme-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Aucune prestation trouvée</h3>
              <p className="text-xs theme-text-secondary mt-1">
                {searchQuery 
                  ? 'Aucun résultat ne correspond à votre recherche.' 
                  : 'Commencez par enregistrer les premières prestations avec le formulaire.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Répertorier une prestation</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                  <tr>
                    <th className="py-3 px-4 w-16">Aperçu</th>
                    <th className="py-3 px-4">Nom de la prestation</th>
                    <th className="py-3 px-4">Univers</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {filteredServices.map((service) => {
                    const sNom = service.nom || service.name;
                    const sUnivers = service.univers || (service.universe === 'homme' ? 'Homme' : service.universe === 'enfant' ? 'Enfant' : 'Dame');
                    const sImage = service.image_ulistration || service.image;

                    return (
                      <tr key={service.id_service || service.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border theme-border flex-shrink-0 shadow-sm">
                            <img 
                              src={sImage} 
                              alt={sNom} 
                              className="w-full h-full object-cover hover:scale-125 transition duration-300"
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold theme-text-primary whitespace-nowrap">
                          {sNom}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            sUnivers === 'Homme'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              : sUnivers === 'Enfant'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : sUnivers === 'Adolescent'
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          }`}>
                            <span>{sUnivers === 'Homme' ? '👨' : sUnivers === 'Enfant' ? '🧒' : sUnivers === 'Adolescent' ? '🧑' : '👩'}</span>
                            <span>{sUnivers}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 theme-text-secondary max-w-xs sm:max-w-md">
                          <p className="line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(service)}
                              className="p-2 rounded-xl theme-bg-subtle theme-text-secondary hover:theme-text-accent hover:border-amber-500/50 border theme-border transition cursor-pointer"
                              title="Modifier cette prestation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer définitivement la prestation "${sNom}" du répertoire ?`)) {
                                  deleteService(service.id_service || service.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition cursor-pointer"
                              title="Supprimer du répertoire"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredServices.map((service) => {
              const sNom = service.nom || service.name;
              const sUnivers = service.univers || (service.universe === 'homme' ? 'Homme' : service.universe === 'enfant' ? 'Enfant' : 'Dame');
              const sImage = service.image_ulistration || service.image;

              return (
                <div 
                  key={service.id_service || service.id}
                  className="p-4 rounded-3xl theme-bg-card border theme-border hover:border-amber-500/40 transition shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video border theme-border">
                      <img 
                        src={sImage} 
                        alt={sNom} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold shadow-md backdrop-blur-md ${
                          sUnivers === 'Homme'
                            ? 'bg-slate-950/80 text-blue-400 border border-blue-500/30'
                            : sUnivers === 'Enfant'
                            ? 'bg-slate-950/80 text-emerald-400 border border-emerald-500/30'
                            : sUnivers === 'Adolescent'
                            ? 'bg-slate-950/80 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-950/80 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span>{sUnivers === 'Homme' ? '👨' : sUnivers === 'Enfant' ? '🧒' : sUnivers === 'Adolescent' ? '🧑' : '👩'}</span>
                          <span>{sUnivers}</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold theme-text-primary">
                        {sNom}
                      </h3>
                      <p className="text-xs theme-text-secondary line-clamp-3 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t theme-border flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(service)}
                      className="px-2.5 py-1.5 rounded-xl theme-bg-subtle theme-text-secondary hover:theme-text-accent border theme-border transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Supprimer la prestation "${sNom}" ?`)) {
                          deleteService(service.id_service || service.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 2. SALONS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'salons' && (
        filteredSalons.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-card border border-dashed theme-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Aucun salon partenaire trouvé</h3>
              <p className="text-xs theme-text-secondary mt-1">
                {searchQuery ? 'Aucun salon ne correspond à votre recherche.' : 'Aucun salon enregistré dans la base de données.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                  <tr>
                    <th className="py-3 px-4 w-16">Logo</th>
                    <th className="py-3 px-4">Salon de Beauté</th>
                    <th className="py-3 px-4">Localisation & Adresse</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Horaires</th>
                    <th className="py-3 px-4 text-right">Note & Avis</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {filteredSalons.map((salon) => (
                    <tr key={salon.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border theme-border flex-shrink-0 bg-blue-500/10 flex items-center justify-center">
                          {salon.logo ? (
                            <img src={salon.logo} alt={salon.name} className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold theme-text-primary text-sm">{salon.name}</div>
                        {salon.tagline && <div className="text-[11px] theme-text-secondary line-clamp-1">{salon.tagline}</div>}
                      </td>
                      <td className="py-3.5 px-4 theme-text-secondary">
                        <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{salon.city}</span>
                        </div>
                        <div className="text-[11px] theme-text-muted mt-0.5">{salon.address}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 theme-text-secondary">
                          <Phone className="w-3.5 h-3.5 text-blue-500" />
                          <span>{salon.phone || 'Non renseigné'}</span>
                        </div>
                        {salon.email && (
                          <div className="flex items-center gap-1.5 theme-text-muted text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{salon.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 theme-text-secondary">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{salon.openingHours?.days || 'Lun - Sam'}</span>
                        </div>
                        <div className="text-[11px] theme-text-muted mt-0.5">{salon.openingHours?.hours || '09:00 - 19:00'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{salon.rating || 4.9}</span>
                          <span className="text-[10px] theme-text-muted">({salon.reviewsCount || 0})</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 3. PRESTATAIRES VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'prestataires' && (
        filteredProviders.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-card border border-dashed theme-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Aucun prestataire gérant trouvé</h3>
              <p className="text-xs theme-text-secondary mt-1">
                {searchQuery ? 'Aucun compte propriétaire ne correspond à votre recherche.' : 'Aucun compte prestataire inscrit pour le moment.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                  <tr>
                    <th className="py-3 px-4">Gérant / Prestataire</th>
                    <th className="py-3 px-4">Email de connexion</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Salon affilié</th>
                    <th className="py-3 px-4 text-right">Date d'inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {filteredProviders.map((provider: any) => (
                    <tr key={provider.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {(provider.name || 'G').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold theme-text-primary">{provider.name}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                              Propriétaire Salon
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs theme-text-secondary">
                        {provider.email}
                      </td>
                      <td className="py-3.5 px-4 theme-text-primary font-medium">
                        {provider.phone || 'Non renseigné'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
                          <Store className="w-3.5 h-3.5" />
                          <span>{provider.salonName || provider.salonId || 'Salon Partenaire'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right theme-text-muted text-[11px]">
                        {provider.createdAt ? new Date(provider.createdAt).toLocaleDateString('fr-FR') : 'Récemment'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 4. CLIENTS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'clients' && (
        filteredClients.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-card border border-dashed theme-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Aucun client trouvé</h3>
              <p className="text-xs theme-text-secondary mt-1">
                {searchQuery ? 'Aucun profil client ne correspond à votre recherche.' : 'La base client est actuellement vide.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Contact (Tél / Email)</th>
                    <th className="py-3 px-4">Univers Préféré</th>
                    <th className="py-3 px-4">Fréquentation & Dépenses</th>
                    <th className="py-3 px-4 text-right">Points Fidélité</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden border theme-border bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            {client.avatar ? (
                              <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold theme-text-primary">{client.name}</div>
                            {client.lastVisit && (
                              <div className="text-[10px] theme-text-muted">Dernière visite : {client.lastVisit}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{client.phone}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-[11px] theme-text-muted">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize">
                          {client.universePreference || 'Femme'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold theme-text-primary">
                          {(client.totalSpent || 0).toLocaleString('fr-FR')} FCFA
                        </div>
                        <div className="text-[11px] theme-text-muted">
                          {client.visitsCount || 0} rendez-vous effectué(s)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-extrabold text-xs">
                          <Award className="w-3.5 h-3.5" />
                          <span>{client.loyaltyPoints || 0} pts</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 5. RENDEZ-VOUS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'rendezvous' && (
        filteredAppointments.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-card border border-dashed theme-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Aucun rendez-vous trouvé</h3>
              <p className="text-xs theme-text-secondary mt-1">
                {searchQuery ? 'Aucune réservation ne correspond à votre recherche.' : 'Aucun rendez-vous enregistré.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                  <tr>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Salon & Prestation</th>
                    <th className="py-3 px-4">Praticien / Styliste</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold theme-text-primary">{apt.date}</div>
                        <div className="text-[11px] text-amber-500 font-mono font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{apt.time} ({apt.duration || 45} min)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold theme-text-primary">{apt.clientName}</div>
                        <div className="text-[11px] theme-text-muted">{apt.clientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold theme-text-primary">{apt.serviceName}</div>
                        <div className="text-[11px] text-blue-400 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3" />
                          <span>{apt.salonName || 'Salon Partenaire'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 theme-text-secondary">
                        <div className="font-medium theme-text-primary">{apt.staffName || 'Praticien Expert'}</div>
                        <span className="text-[10px] text-slate-500 uppercase">{apt.universe || 'Mixte'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-black theme-text-accent whitespace-nowrap">
                        {(Number(apt.price) || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          apt.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : apt.status === 'in_progress'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}>
                          {apt.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                           apt.status === 'in_progress' ? <Clock3 className="w-3 h-3 animate-spin" /> :
                           apt.status === 'cancelled' ? <XCircle className="w-3 h-3" /> :
                           <Clock3 className="w-3 h-3" />}
                          <span className="capitalize">
                            {apt.status === 'completed' ? 'Terminé' :
                             apt.status === 'in_progress' ? 'En cours' :
                             apt.status === 'cancelled' ? 'Annulé' : 'Confirmé'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 6. CHIFFRE D'AFFAIRES VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'chiffreAffaires' && (
        filteredTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-3xl theme-bg-card border border-dashed theme-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Aucune transaction encaissée</h3>
              <p className="text-xs theme-text-secondary mt-1">
                {searchQuery ? 'Aucune transaction ne correspond à votre recherche.' : 'Les encaissements apparaîtront au fur et à mesure des prestations finalisées.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl theme-bg-card border theme-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                  <tr>
                    <th className="py-3 px-4">Pass / Reçu</th>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">Salon & Prestation</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Mode de Règlement</th>
                    <th className="py-3 px-4 text-right">Montant Encaissé</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-amber-500 whitespace-nowrap">
                        {tx.qrCode || tx.id}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold theme-text-primary">{tx.date}</div>
                        <div className="text-[11px] theme-text-muted">{tx.time}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold theme-text-primary">{tx.serviceName}</div>
                        <div className="text-[11px] text-blue-400 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3" />
                          <span>{tx.salonName || 'Salon Partenaire'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 theme-text-secondary">
                        <div className="font-medium theme-text-primary">{tx.clientName}</div>
                        <div className="text-[11px] theme-text-muted">{tx.clientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] uppercase">
                          <CreditCard className="w-3 h-3" />
                          <span>{tx.paymentMethod === 'mobile_money' ? 'Mobile Money' : tx.paymentMethod === 'card' ? 'Carte Bancaire' : tx.paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Espèces'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-amber-500 text-sm">
                          +{(Number(tx.price) || 0).toLocaleString('fr-FR')} FCFA
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold">● Encaissé</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Dedicated Prestation Registration & Edition Modal */}
      <PrestationRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServiceToEdit(null);
        }}
        prestationToEdit={serviceToEdit}
      />
    </div>
  );
};

