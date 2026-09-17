import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SalonUniverse, 
  ServiceItem, 
  StaffMember, 
  Appointment, 
  ClientProfile, 
  SalonInfo, 
  AppointmentStatus, 
  PaymentMethod, 
  AuthUser, 
  UserRole, 
  AppTheme 
} from '../types';
import { 
  INITIAL_SALONS, 
  INITIAL_SERVICES, 
  INITIAL_STAFF, 
  INITIAL_CLIENTS, 
  INITIAL_APPOINTMENTS, 
  DEMO_USERS 
} from '../data/mockData';
import { api } from '../services/api';

interface SalonContextType {
  // Auth state
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  currentStaff: StaffMember | null;
  login: (email: string, password?: string, targetRole?: UserRole) => Promise<boolean>;
  loginAsDemo: (userIdOrRole: string) => void;
  register: (userData: { 
    name: string; 
    email: string; 
    phone: string; 
    password?: string;
    role: UserRole; 
    salonName?: string; 
    salonId?: string;
    ownerId?: string;
    jobTitle?: string;
    city?: string;
    address?: string;
    universePreference?: SalonUniverse; 
  }) => Promise<boolean>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;

  // Multi-Salon Tenant state
  salons: SalonInfo[];
  currentSalon: SalonInfo;
  selectSalon: (salonId: string) => void;
  addSalon: (salonData: {
    name: string;
    tagline?: string;
    address: string;
    city: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    currency?: string;
    logo?: string;
    coverImage?: string;
    openingDays?: string;
    openingHours?: string;
    ownerId?: string;
    id_user?: string;
    userId?: string;
    universe?: string;
    univers?: string;
    universeType?: string;
    prestations?: { serviceId: string; cout: number; duree: number }[];
  }) => Promise<SalonInfo>;
  updateSalon: (id: string, data: Partial<SalonInfo>) => Promise<SalonInfo>;
  deleteSalon: (id: string) => Promise<void>;

  // General state
  selectedUniverse: SalonUniverse;
  setSelectedUniverse: (u: SalonUniverse) => void;
  salonInfo: SalonInfo;
  services: ServiceItem[];
  staff: StaffMember[];
  clients: ClientProfile[];
  appointments: Appointment[];
  activeClient: ClientProfile;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isDbConnected: boolean;

  // Actions
  bookAppointment: (data: {
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
  }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  processPayment: (id: string, method: PaymentMethod) => Promise<void>;
  addClient: (client: Omit<ClientProfile, 'id' | 'visitsCount' | 'totalSpent' | 'loyaltyPoints'>) => void;
  updateClientNotes: (clientId: string, technicalNotes: string) => void;
  addService: (service: Omit<ServiceItem, 'id' | 'salonId'>) => void;
  updateService: (id: string, serviceData: Partial<ServiceItem>) => Promise<void>;
  deleteService: (id: string) => void;
  addStaff: (staffData: Partial<StaffMember> & { email?: string; phone?: string; password?: string }) => Promise<StaffMember>;
  updateStaff: (id: string, staffData: Partial<StaffMember> & { email?: string; phone?: string }) => Promise<StaffMember>;
  deleteStaff: (id: string) => Promise<void>;
  resetToDefaults: () => void;
  refreshFromDb: () => Promise<void>;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('elysee_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const activeRole: UserRole = currentUser?.role || 'client';
  const isAuthenticated = currentUser !== null;

  const [salons, setSalons] = useState<SalonInfo[]>(() => {
    const saved = localStorage.getItem('elysee_all_salons');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSalonId, setCurrentSalonId] = useState<string>(() => {
    return currentUser?.salonId || '';
  });

  const DEFAULT_EMPTY_SALON: SalonInfo = {
    id: '',
    name: "Mon Salon de Beauté",
    slug: 'mon-salon',
    tagline: "Plateforme SaaS Beauté & Soins",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    currency: "FCFA",
    logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1000&auto=format&fit=crop&q=80",
    openingHours: {
      days: "Mardi au Samedi",
      hours: "09:00 - 20:00"
    },
    rating: 5.0,
    reviewsCount: 0
  };

  // Salons belonging to current user if owner/employee
  const userSalons = currentUser?.role === 'admin'
    ? salons
    : currentUser?.role === 'owner'
    ? salons.filter(s => s.ownerId === currentUser.id || s.id === currentUser.salonId)
    : currentUser?.role === 'employee'
    ? salons.filter(s => s.id === currentUser.salonId)
    : salons;

  const currentSalon = salons.find(s => s.id === currentSalonId) || 
    (currentUser?.role === 'owner' ? userSalons[0] : salons[0]) || 
    DEFAULT_EMPTY_SALON;
  const salonInfo = currentSalon;

  const [selectedUniverse, setSelectedUniverse] = useState<SalonUniverse>('all');
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('elysee_services');
    return saved ? JSON.parse(saved) : [];
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('elysee_staff');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<ClientProfile[]>(() => {
    const saved = localStorage.getItem('elysee_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('elysee_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch initial state from PostgreSQL Database
  const refreshFromDb = useCallback(async () => {
    try {
      // Sync currentUser ID with PostgreSQL DB user if email matches
      if (currentUser?.email) {
        try {
          const dbUsers = await api.getUsers().catch(() => null);
          if (dbUsers && Array.isArray(dbUsers)) {
            const matchedDbUser = dbUsers.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
            if (matchedDbUser && matchedDbUser.id !== currentUser.id) {
              const upgradedUser: AuthUser = {
                ...currentUser,
                id: matchedDbUser.id,
                name: matchedDbUser.name || currentUser.name,
                role: (matchedDbUser.role as UserRole) || currentUser.role,
                phone: matchedDbUser.phone || currentUser.phone,
                city: matchedDbUser.city || currentUser.city,
                address: matchedDbUser.address || currentUser.address
              };
              setCurrentUser(upgradedUser);
              localStorage.setItem('elysee_auth_user', JSON.stringify(upgradedUser));
            }
          }
        } catch {}
      }

      const dbSalons = await api.getSalons().catch(() => null);
      let activeSalonId = currentSalonId;

      if (dbSalons !== null) {
        setSalons(dbSalons);
        setIsDbConnected(true);

        const availableSalons = currentUser?.role === 'admin'
          ? dbSalons
          : currentUser?.role === 'owner'
          ? dbSalons.filter(s => s.ownerId === currentUser.id || s.id === currentUser.salonId)
          : currentUser?.role === 'employee'
          ? dbSalons.filter(s => s.id === currentUser.salonId)
          : dbSalons;

        if (availableSalons.length > 0) {
          const existsInAvailable = availableSalons.some(s => s.id === activeSalonId);
          if (!existsInAvailable || !activeSalonId || activeSalonId === 'salon-1') {
            activeSalonId = availableSalons[0].id;
            setCurrentSalonId(activeSalonId);
          }
        } else if (currentUser?.role === 'owner') {
          activeSalonId = '';
          setCurrentSalonId('');
        }
      }

      const isOwner = currentUser?.role === 'owner';
      const isEmployee = currentUser?.role === 'employee';
      const isAdmin = currentUser?.role === 'admin';
      const isClient = currentUser?.role === 'client' || (!isOwner && !isEmployee && !isAdmin);

      const staffFilterSalon = (isOwner && activeSalonId) ? activeSalonId : undefined;
      const staffFilterOwner = isOwner ? currentUser?.id : undefined;

      // APPOINTMENT FILTERS:
      // - Si employee : PAS de filtre par salonId ! Récupérer les RDV du collaborateur connecté.
      // - Si client : PAS de filtre par salonId ! Récupérer les RDV du client connecté.
      // - Si owner : Filtrer par salonId ou ownerId
      const aptFilterSalon = (isOwner && activeSalonId) ? activeSalonId : undefined;
      const aptFilterOwner = isOwner ? currentUser?.id : undefined;
      const aptFilterStaff = isEmployee ? (currentUser?.staffId || currentUser?.id) : undefined;
      const aptFilterStaffName = isEmployee ? currentUser?.name : undefined;
      const aptFilterPhone = isClient ? currentUser?.phone : undefined;
      const aptFilterEmail = isClient ? currentUser?.email : undefined;
      const aptFilterUser = (isClient || isEmployee) ? currentUser?.id : undefined;
      const aptFilterRole = currentUser?.role;

      const serviceSalonFilter = (!isAdmin && activeSalonId) ? activeSalonId : undefined;

      const [dbServices, dbStaff, dbClients, dbAppointments] = await Promise.all([
        api.getServices(serviceSalonFilter).catch(() => null),
        api.getStaff(staffFilterSalon, staffFilterOwner).catch(() => null),
        api.getClients().catch(() => null),
        api.getAppointments(
          aptFilterSalon,
          aptFilterPhone,
          aptFilterOwner,
          aptFilterStaff,
          aptFilterEmail,
          aptFilterUser,
          aptFilterRole,
          aptFilterStaffName
        ).catch(() => null)
      ]);

      if (dbServices !== null) setServices(dbServices);
      if (dbStaff !== null) setStaff(dbStaff);
      if (dbClients !== null) setClients(dbClients);
      if (dbAppointments !== null) setAppointments(dbAppointments);
    } catch {
      setIsDbConnected(false);
    }
  }, [currentSalonId, currentUser]);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  useEffect(() => {
    if (currentUser?.salonId) {
      setCurrentSalonId(currentUser.salonId);
    }
  }, [currentUser]);

  // Dynamic Staff matching connected user
  const currentStaff: StaffMember | null = useMemo(() => {
    if (!currentUser) return staff[0] || null;
    const found = staff.find(s => 
      (currentUser.staffId && s.id === currentUser.staffId) ||
      (currentUser.id && s.id === currentUser.id) ||
      (currentUser.name && s.name && s.name.toLowerCase() === currentUser.name.toLowerCase())
    );
    if (found) return found;
    return {
      id: currentUser.id || 'staff-1',
      salonId: currentUser.salonId || '',
      name: currentUser.name || 'Collaborateur',
      role: 'Collaborateur & Soins',
      avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      universe: ['femme', 'homme', 'enfant', 'mixte'],
      rating: 5.0,
      reviewsCount: 1,
      bio: 'Collaborateur professionnel de beauté',
      workingDays: [1, 2, 3, 4, 5, 6],
      workingHours: { start: '09:00', end: '19:00' },
      color: '#3b82f6',
    };
  }, [currentUser, staff]);

  // Dynamic Client matching connected user and their real appointments
  const activeClient: ClientProfile = useMemo(() => {
    // Find matching client record if exists
    const matched = currentUser ? clients.find(c => 
      (currentUser.clientId && c.id === currentUser.clientId) ||
      (currentUser.id && c.id === currentUser.id) ||
      (currentUser.email && c.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.phone && c.phone && c.phone.replace(/\s+/g, '') === currentUser.phone.replace(/\s+/g, ''))
    ) : null;

    // Filter appointments belonging to this client across all salons
    const myApts = currentUser ? appointments.filter(a => {
      const matchId = a.id_user && a.id_user === currentUser.id;
      const matchPhone = currentUser.phone && a.clientPhone && a.clientPhone.replace(/\s+/g, '') === currentUser.phone.replace(/\s+/g, '');
      const matchEmail = currentUser.email && a.clientEmail && a.clientEmail.toLowerCase() === currentUser.email.toLowerCase();
      const matchName = currentUser.name && a.clientName && a.clientName.toLowerCase() === currentUser.name.toLowerCase();
      return matchId || matchPhone || matchEmail || matchName;
    }) : [];

    const completed = myApts.filter(a => a.status === 'completed');
    const computedSpent = completed.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const computedVisits = completed.length;
    const computedPoints = Math.round(computedSpent / 10) + 100; // 100 welcome bonus pts + 1 pt per 10 currency

    return {
      id: currentUser?.id || matched?.id || 'client-1',
      name: currentUser?.name || matched?.name || 'Client',
      phone: currentUser?.phone || matched?.phone || '',
      email: currentUser?.email || matched?.email || '',
      avatar: currentUser?.avatar || matched?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      universePreference: (matched?.universePreference || 'femme') as any,
      visitsCount: matched?.visitsCount !== undefined && matched.visitsCount > 0 ? matched.visitsCount : computedVisits,
      totalSpent: matched?.totalSpent !== undefined && matched.totalSpent > 0 ? matched.totalSpent : computedSpent,
      loyaltyPoints: matched?.loyaltyPoints !== undefined && matched.loyaltyPoints > 0 ? matched.loyaltyPoints : computedPoints,
    };
  }, [currentUser, clients, appointments]);

  // Persist state locally as fallback
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('elysee_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('elysee_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('elysee_all_salons', JSON.stringify(salons));
  }, [salons]);

  useEffect(() => {
    localStorage.setItem('elysee_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('elysee_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('elysee_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('elysee_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem('elysee_all_users');
    return saved ? JSON.parse(saved) : DEMO_USERS;
  });

  useEffect(() => {
    localStorage.setItem('elysee_all_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('elysee_app_theme') as AppTheme;
    return saved || 'blanc';
  });

  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('elysee_app_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'sombre') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, [theme]);

  const selectSalon = (salonId: string) => {
    const found = salons.find(s => s.id === salonId);
    if (found) {
      setCurrentSalonId(found.id);
    }
  };

  const addSalon = async (salonData: {
    name: string;
    tagline?: string;
    address: string;
    city: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    currency?: string;
    universe?: string;
    univers?: string;
    universeType?: string;
    logo?: string;
    coverImage?: string;
    openingDays?: string;
    openingHours?: string;
    ownerId?: string;
    id_user?: string;
    userId?: string;
    prestations?: { serviceId: string; cout: number; duree: number }[];
  }): Promise<SalonInfo> => {
    // Le owner_id DOIT correspondre strictement à l'id_user de l'utilisateur (propriétaire) connecté
    const effectiveOwnerUserId = currentUser?.id || currentUser?.id_user || salonData.id_user || salonData.userId || salonData.ownerId || 'usr-owner-1';
    const finalUniverse = salonData.universe || salonData.univers || salonData.universeType || 'mixte';

    try {
      const created = await api.createSalon({
        ...salonData,
        universe: finalUniverse,
        univers: finalUniverse,
        ownerId: effectiveOwnerUserId,
        id_user: effectiveOwnerUserId
      });
      const fullCreated = { 
        ...created, 
        universe: finalUniverse, 
        univers: finalUniverse, 
        ownerId: effectiveOwnerUserId, 
        id_user: effectiveOwnerUserId 
      };
      setSalons(prev => [fullCreated, ...prev]);
      setCurrentSalonId(fullCreated.id);
      localStorage.setItem('elysee_all_salons', JSON.stringify([fullCreated, ...salons]));

      // Update provider affiliation if owner
      if (currentUser && currentUser.role === 'owner') {
        const updatedUser: AuthUser = {
          ...currentUser,
          salonId: fullCreated.id,
          salonName: fullCreated.name
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('elysee_auth_user', JSON.stringify(updatedUser));
      }

      await refreshFromDb();
      return fullCreated;
    } catch (err) {
      console.warn('Backend unavailable, creating locally:', err);
      const id = `salon-${Date.now().toString().slice(-6)}`;
      const baseSlug = salonData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newSalon: SalonInfo = {
        id,
        name: salonData.name,
        slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
        tagline: salonData.tagline || 'Salon de Beauté & Soins',
        address: salonData.address,
        city: salonData.city,
        postalCode: salonData.postalCode || '',
        phone: salonData.phone || '',
        email: salonData.email || '',
        currency: salonData.currency || '€',
        universe: finalUniverse,
        univers: finalUniverse,
        logo: salonData.logo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80',
        coverImage: salonData.coverImage || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1000&auto=format&fit=crop&q=80',
        openingHours: {
          days: salonData.openingDays || 'Mardi au Samedi',
          hours: salonData.openingHours || '09:00 - 19:30'
        },
        rating: 5.0,
        reviewsCount: 0,
        ownerId: effectiveOwnerUserId,
        id_user: effectiveOwnerUserId
      };
      setSalons(prev => [newSalon, ...prev]);
      setCurrentSalonId(newSalon.id);
      localStorage.setItem('elysee_all_salons', JSON.stringify([newSalon, ...salons]));

      // Update provider affiliation if owner
      if (currentUser && currentUser.role === 'owner') {
        const updatedUser: AuthUser = {
          ...currentUser,
          salonId: newSalon.id,
          salonName: newSalon.name
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('elysee_auth_user', JSON.stringify(updatedUser));
      }

      return newSalon;
    }
  };

  const updateSalon = async (id: string, data: Partial<SalonInfo>): Promise<SalonInfo> => {
    try {
      const updated = await api.updateSalon(id, data);
      setSalons(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      await refreshFromDb();
      return updated;
    } catch (err) {
      console.warn('Backend unavailable, updating locally:', err);
      setSalons(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      const found = salons.find(s => s.id === id);
      return { ...(found || salons[0]), ...data } as SalonInfo;
    }
  };

  const deleteSalon = async (id: string): Promise<void> => {
    try {
      await api.deleteSalon(id);
    } catch (err: any) {
      console.error('Erreur API suppression salon:', err);
      // If DB error, throw to alert user unless completely offline
      if (isDbConnected) {
        throw err;
      }
    }

    setSalons(prev => {
      const remaining = prev.filter(s => s.id !== id);
      localStorage.setItem('elysee_all_salons', JSON.stringify(remaining));
      if (currentSalonId === id) {
        const nextSalon = remaining[0];
        if (nextSalon) {
          setCurrentSalonId(nextSalon.id);
        }
      }
      return remaining;
    });

    if (currentUser && currentUser.salonId === id) {
      const remaining = salons.filter(s => s.id !== id);
      const nextSalon = remaining[0];
      const updatedUser: AuthUser = {
        ...currentUser,
        salonId: nextSalon ? nextSalon.id : '',
        salonName: nextSalon ? nextSalon.name : ''
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('elysee_auth_user', JSON.stringify(updatedUser));
    }

    await refreshFromDb();
  };

  // Session Helper: Crée une session active avec identifiant unique et horodatage
  const createSessionUser = (user: Partial<AuthUser>): AuthUser => {
    const userId = user.id || `usr-${Date.now().toString().slice(-4)}`;
    const sessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const connectedAt = new Date().toISOString();
    const sessionUser: AuthUser = {
      ...user,
      id: userId,
      id_user: user.id_user || userId,
      sessionId: user.sessionId || sessionId,
      connectedAt: user.connectedAt || connectedAt,
      token: user.token || `jwt-${sessionId}`
    } as AuthUser;

    try {
      sessionStorage.setItem('elysee_session_active', JSON.stringify({
        sessionId: sessionUser.sessionId,
        userId: sessionUser.id,
        userEmail: sessionUser.email,
        role: sessionUser.role,
        connectedAt: sessionUser.connectedAt
      }));
    } catch {}

    return sessionUser;
  };

  // Auth Methods
  const login = async (email: string, password?: string, targetRole?: UserRole): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const authData = await api.login(cleanEmail, password, targetRole);
      if (authData && authData.id) {
        // Conserver le rôle réel et officiel attribué par la base de données
        const finalUser = createSessionUser(authData);
        setCurrentUser(finalUser);
        localStorage.setItem('elysee_auth_user', JSON.stringify(finalUser));
        if (authData.salonId) setCurrentSalonId(authData.salonId);
        await refreshFromDb();
        return true;
      }
      return false;
    } catch (err: any) {
      // Rejeter avec le message explicite du backend (Mot de passe incorrect, Compte introuvable, Espace non autorisé)
      throw err;
    }
  };

  const loginAsDemo = (userIdOrRole: string) => {
    const found = DEMO_USERS.find(u => u.id === userIdOrRole || u.role === userIdOrRole);
    if (found) {
      const activeUser = createSessionUser(found);
      setCurrentUser(activeUser);
      localStorage.setItem('elysee_auth_user', JSON.stringify(activeUser));
      if (found.salonId) setCurrentSalonId(found.salonId);
    } else if (DEMO_USERS[0]) {
      const activeUser = createSessionUser(DEMO_USERS[0]);
      setCurrentUser(activeUser);
      localStorage.setItem('elysee_auth_user', JSON.stringify(activeUser));
    }
  };

  const register = async (userData: { 
    name: string; 
    email: string; 
    phone: string; 
    password?: string;
    role: UserRole; 
    city?: string;
    address?: string;
    ownerId?: string;
    salonId?: string;
    jobTitle?: string;
    universePreference?: SalonUniverse; 
  }): Promise<boolean> => {
    try {
      const serverUser = await api.register(userData);
      if (serverUser && serverUser.id) {
        const finalAuthUser = createSessionUser({
          ...serverUser,
          role: userData.role
        });

        // CLIENT : Création locale synchro
        if (userData.role === 'client') {
          const newClientId = `cli-${Date.now().toString().slice(-4)}`;
          finalAuthUser.clientId = newClientId;
          const newClientProfile: ClientProfile = {
            id: newClientId,
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            avatar: serverUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            universePreference: (userData.universePreference && userData.universePreference !== 'all' ? userData.universePreference : 'femme'),
            visitsCount: 0,
            totalSpent: 0,
            loyaltyPoints: 100,
            id_user: serverUser.id
          };
          setClients(prev => [newClientProfile, ...prev]);
        }

        setRegisteredUsers(prev => [finalAuthUser, ...prev.filter(u => u.email.toLowerCase() !== finalAuthUser.email.toLowerCase())]);
        setCurrentUser(finalAuthUser);
        localStorage.setItem('elysee_auth_user', JSON.stringify(finalAuthUser));
        await refreshFromDb();
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('elysee_auth_user');
    try {
      sessionStorage.removeItem('elysee_session_active');
      sessionStorage.clear();
    } catch {}
    setCurrentSalonId('');
  };

  const switchRoleQuick = (role: UserRole) => {
    const match = DEMO_USERS.find(u => u.role === role);
    if (match) {
      const activeUser = createSessionUser(match);
      setCurrentUser(activeUser);
      localStorage.setItem('elysee_auth_user', JSON.stringify(activeUser));
      if (match.salonId) setCurrentSalonId(match.salonId);
    } else {
      if (currentUser) {
        const activeUser = createSessionUser({ ...currentUser, role });
        setCurrentUser(activeUser);
        localStorage.setItem('elysee_auth_user', JSON.stringify(activeUser));
      }
    }
  };

  // Appointment & Business Methods
  const bookAppointment = async (data: {
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
  }): Promise<Appointment> => {
    const service = services.find(s => s.id === data.serviceId) || services[0];
    const staffMember = staff.find(st => st.id === data.staffId) || staff[0];

    try {
      const created = await api.createAppointment({
        ...data,
        salonId: currentSalon.id,
        salonName: currentSalon.name,
        serviceId: service?.id || data.serviceId,
        serviceName: service?.name || 'Prestation Beauté & Soin',
        duration: service?.duration || 45,
        price: service?.price || 45,
        universe: service?.universe || 'mixte',
        staffId: staffMember?.id || data.staffId,
        staffName: staffMember?.name || 'Praticien',
        id_user: currentUser?.id
      });
      setAppointments(prev => [created, ...prev]);

      refreshFromDb();
      return created;
    } catch (err) {
      console.warn('Backend booking error, saving locally:', err);
      const newApt: Appointment = {
        id: `apt-${Date.now().toString().slice(-5)}`,
        salonId: currentSalon.id,
        salonName: currentSalon.name,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        serviceId: service?.id || data.serviceId,
        serviceName: service?.name || 'Prestation Beauté & Soin',
        staffId: staffMember?.id || data.staffId,
        staffName: staffMember?.name || 'Praticien',
        date: data.date,
        time: data.time,
        duration: service?.duration || 45,
        price: service?.price || 45,
        universe: (service?.universe === 'homme' || service?.universe === 'femme' || service?.universe === 'enfant' ? service.universe : 'mixte'),
        status: 'confirmed',
        notes: data.notes,
        createdAt: new Date().toISOString(),
        qrCode: `RES-${currentSalon.slug.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        paid: false,
        id_user: currentUser?.id
      };


      setAppointments(prev => [newApt, ...prev]);
      return newApt;
    }
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(id, status);
    } catch {}
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const cancelAppointment = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, 'cancelled');
    } catch {}
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  };

  const processPayment = async (id: string, method: PaymentMethod) => {
    try {
      await api.processPayment(id, method);
    } catch {}
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, paid: true, paymentMethod: method, status: 'completed' };
      }
      return a;
    }));
  };

  const addClient = async (clientData: Omit<ClientProfile, 'id' | 'visitsCount' | 'totalSpent' | 'loyaltyPoints'>) => {
    const tempId = `cli-${Date.now().toString().slice(-4)}`;
    const newCli: ClientProfile = {
      ...clientData,
      id: tempId,
      visitsCount: 0,
      totalSpent: 0,
      loyaltyPoints: 50,
      id_user: currentUser?.id
    };
    setClients(prev => [newCli, ...prev]);

    try {
      const created = await api.createClient({
        ...clientData,
        id_user: currentUser?.id
      });
      if (created) {
        setClients(prev => [created, ...prev.filter(c => c.id !== tempId && c.id !== created.id)]);
        await refreshFromDb();
      }
    } catch (err) {
      console.warn('Backend unavailable, client saved locally:', err);
    }
  };

  const updateClientNotes = (clientId: string, technicalNotes: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, technicalNotes } : c));
  };

  const addService = async (serviceData: Omit<ServiceItem, 'id' | 'salonId'>) => {
    const effectiveSalonId = currentUser?.salonId || (salons.length > 0 ? (currentSalon?.id || salons[0]?.id) : undefined);
    const tempId = `srv-${Date.now().toString().slice(-4)}`;
    const newService: ServiceItem = {
      ...serviceData,
      salonId: effectiveSalonId || 'global',
      id: tempId,
      id_user: currentUser?.id
    };
    setServices(prev => [newService, ...prev.filter(s => s.id !== tempId)]);

    try {
      const created = await api.createService({
        ...serviceData,
        salonId: effectiveSalonId,
        id_user: currentUser?.id
      });
      if (created) {
        setServices(prev => [created, ...prev.filter(s => s.id !== tempId && s.id !== created.id)]);
        await refreshFromDb();
      }
    } catch (err) {
      console.warn('Backend unavailable, service saved locally:', err);
    }
  };

  const updateService = async (id: string, serviceData: Partial<ServiceItem>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...serviceData } : s));
    try {
      await api.updateService(id, serviceData);
    } catch (err) {
      console.warn('Backend update service error:', err);
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      await api.deleteService(id);
    } catch (err) {
      console.warn('Backend delete service error:', err);
    }
  };

  const addStaff = async (staffData: Partial<StaffMember> & { email?: string; phone?: string; password?: string; ownerId?: string }): Promise<StaffMember> => {
    const effectiveSalonId = staffData.salonId || (salons.length > 0 ? (currentSalon?.id || salons[0]?.id) : 'salon-1');
    const effectiveOwnerId = staffData.ownerId || currentUser?.id;
    const effectiveUserId = currentUser?.id || effectiveOwnerId;
    const tempId = `staff-${Date.now().toString().slice(-4)}`;
    const newStaff: StaffMember = {
      id: tempId,
      salonId: effectiveSalonId,
      ownerId: effectiveOwnerId,
      name: staffData.name || 'Nouveau Collaborateur',
      role: staffData.role || 'Collaborateur & Praticien',
      avatar: staffData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      universe: staffData.universe || ['femme', 'homme', 'enfant', 'mixte'],
      rating: 5.0,
      reviewsCount: 0,
      bio: staffData.bio || 'Praticien passionné et dévoué au bien-être de la clientèle.',
      workingDays: staffData.workingDays || [1, 2, 3, 4, 5, 6],
      workingHours: staffData.workingHours || { start: '09:00', end: '19:00' },
      color: staffData.color || 'blue',
      id_user: effectiveUserId
    };

    setStaff(prev => [newStaff, ...prev.filter(s => s.id !== tempId)]);

    try {
      const created = await api.createStaff({
        ...staffData,
        salonId: effectiveSalonId,
        ownerId: effectiveOwnerId,
        id_user: effectiveUserId
      });
      if (created) {
        setStaff(prev => [created, ...prev.filter(s => s.id !== tempId && s.id !== created.id)]);
        await refreshFromDb();
        return created;
      }
    } catch (err) {
      console.warn('Backend unavailable, staff saved locally:', err);
    }
    return newStaff;
  };

  const updateStaff = async (id: string, staffData: Partial<StaffMember> & { email?: string; phone?: string }): Promise<StaffMember> => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...staffData } : s));
    try {
      const updated = await api.updateStaff(id, staffData);
      if (updated) {
        setStaff(prev => prev.map(s => s.id === id ? updated : s));
        return updated;
      }
    } catch (err) {
      console.warn('Backend update staff error:', err);
    }
    const current = staff.find(s => s.id === id);
    return { ...current, ...staffData } as StaffMember;
  };

  const deleteStaff = async (id: string): Promise<void> => {
    setStaff(prev => prev.filter(s => s.id !== id));
    try {
      await api.deleteStaff(id);
    } catch (err) {
      console.warn('Backend delete staff error:', err);
    }
  };

  const resetToDefaults = async () => {
    localStorage.removeItem('elysee_auth_user');
    localStorage.removeItem('elysee_all_users');
    localStorage.removeItem('elysee_all_salons');
    localStorage.removeItem('elysee_services');
    localStorage.removeItem('elysee_staff');
    localStorage.removeItem('elysee_clients');
    localStorage.removeItem('elysee_appointments');
    setSalons([]);
    setServices([]);
    setStaff([]);
    setClients([]);
    setAppointments([]);
    setRegisteredUsers([]);
    setCurrentUser(null);
    try {
      await fetch('/api/admin/reset-database', { method: 'POST' });
    } catch {}
    await refreshFromDb();
  };

  return (
    <SalonContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        activeRole,
        currentStaff,
        login,
        loginAsDemo,
        register,
        logout,
        switchRoleQuick,
        salons,
        currentSalon,
        selectSalon,
        addSalon,
        updateSalon,
        deleteSalon,
        selectedUniverse,
        setSelectedUniverse,
        salonInfo,
        services,
        staff,
        clients,
        appointments,
        activeClient,
        theme,
        setTheme,
        darkMode,
        setDarkMode,
        isDbConnected,
        bookAppointment,
        updateAppointmentStatus,
        cancelAppointment,
        processPayment,
        addClient,
        updateClientNotes,
        addService,
        updateService,
        deleteService,
        addStaff,
        updateStaff,
        deleteStaff,
        resetToDefaults,
        refreshFromDb,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = (): SalonContextType => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};
