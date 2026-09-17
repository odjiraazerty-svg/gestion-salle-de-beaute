import { SalonInfo, ServiceItem, StaffMember, ClientProfile, Appointment, AuthUser } from '../types';

const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();



export const api = {
  // Salons
  async getSalons(ownerId?: string): Promise<SalonInfo[]> {
    const params = new URLSearchParams();
    if (ownerId) params.append('ownerId', ownerId);
    const url = params.toString() ? `${API_BASE}/salons?${params.toString()}` : `${API_BASE}/salons`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Impossible de charger les salons');
    return res.json();
  },

  async createSalon(data: {
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
  }): Promise<SalonInfo> {
    const res = await fetch(`${API_BASE}/salons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de la création du salon' }));
      throw new Error(err.error || 'Erreur lors de la création du salon');
    }
    return res.json();
  },

  async getSalonServices(salonId: string): Promise<ServiceItem[]> {
    const res = await fetch(`${API_BASE}/salons/${salonId}/services`);
    if (!res.ok) throw new Error('Impossible de charger les prestations du salon');
    return res.json();
  },

  async saveSalonServices(salonId: string, prestations: { serviceId: string; cout: number; duree: number }[], id_user?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/salons/${salonId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prestations, id_user, userId: id_user }),
    });
    if (!res.ok) throw new Error('Erreur lors de l\'enregistrement des prestations du salon');
  },

  async updateSalon(id: string, data: Partial<SalonInfo>): Promise<SalonInfo> {
    const res = await fetch(`${API_BASE}/salons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour du salon');
    return res.json();
  },

  async deleteSalon(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/salons/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de la suppression du salon' }));
      throw new Error(err.error || 'Erreur lors de la suppression du salon');
    }
  },


  // Services
  async getServices(salonId?: string, universe?: string): Promise<ServiceItem[]> {
    const params = new URLSearchParams();
    if (salonId) params.append('salonId', salonId);
    if (universe && universe !== 'all') params.append('universe', universe);
    const res = await fetch(`${API_BASE}/services?${params.toString()}`);
    if (!res.ok) throw new Error('Impossible de charger les services');
    return res.json();
  },

  async getPrestationSalons(filters?: { 
    city?: string; 
    quartier?: string; 
    universe?: string; 
    salonId?: string; 
    search?: string;
  }): Promise<ServiceItem[]> {
    const params = new URLSearchParams();
    if (filters?.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters?.quartier && filters.quartier !== 'all') params.append('quartier', filters.quartier);
    if (filters?.universe && filters.universe !== 'all') params.append('universe', filters.universe);
    if (filters?.salonId) params.append('salonId', filters.salonId);
    if (filters?.search) params.append('search', filters.search);
    const url = params.toString() ? `${API_BASE}/prestation-salons?${params.toString()}` : `${API_BASE}/prestation-salons`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Impossible de charger les prestations des salons');
    return res.json();
  },

  async createService(data: any): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création de la prestation');
    return res.json();
  },

  async updateService(id: string, data: Partial<ServiceItem>): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour de la prestation');
    return res.json();
  },

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression');
  },

  // Staff
  async getStaff(salonId?: string, ownerId?: string): Promise<StaffMember[]> {
    const params = new URLSearchParams();
    if (salonId) params.append('salonId', salonId);
    if (ownerId) params.append('ownerId', ownerId);
    const res = await fetch(`${API_BASE}/staff?${params.toString()}`);
    if (!res.ok) throw new Error('Impossible de charger le personnel');
    return res.json();
  },

  async createStaff(data: Partial<StaffMember> & { email?: string; phone?: string; password?: string; id_user?: string; userId?: string }): Promise<StaffMember> {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la création du collaborateur');
    }
    return res.json();
  },

  async updateStaff(id: string, data: Partial<StaffMember> & { email?: string; phone?: string; id_user?: string; userId?: string }): Promise<StaffMember> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la mise à jour du collaborateur');
    }
    return res.json();
  },

  async deleteStaff(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la suppression du collaborateur');
    }
  },

  // Clients
  async getClients(): Promise<ClientProfile[]> {
    const res = await fetch(`${API_BASE}/clients`);
    if (!res.ok) throw new Error('Impossible de charger les clients');
    return res.json();
  },

  async createClient(data: Partial<ClientProfile> & { id_user?: string; userId?: string }): Promise<ClientProfile> {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la création du client');
    }
    return res.json();
  },

  // Appointments
  async getAppointments(
    salonId?: string, 
    phone?: string, 
    ownerId?: string, 
    staffId?: string, 
    email?: string, 
    userId?: string, 
    role?: string,
    staffName?: string
  ): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (salonId) params.append('salonId', salonId);
    if (phone) params.append('phone', phone);
    if (ownerId) params.append('ownerId', ownerId);
    if (staffId) params.append('staffId', staffId);
    if (staffName) params.append('staffName', staffName);
    if (email) params.append('email', email);
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const res = await fetch(`${API_BASE}/appointments?${params.toString()}`);
    if (!res.ok) throw new Error('Impossible de charger les rendez-vous');
    return res.json();
  },

  async createAppointment(data: {
    salonId: string;
    salonName?: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceId?: string;
    serviceName?: string;
    staffId?: string;
    staffName?: string;
    date: string;
    time: string;
    duration?: number;
    price?: number;
    universe?: string;
    notes?: string;
    id_user?: string;
    userId?: string;
  }): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de la réservation' }));
      throw new Error(err.error || 'Erreur lors de la réservation');
    }
    return res.json();
  },


  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour');
    return res.json();
  },

  async processPayment(id: string, method: string): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method }),
    });
    if (!res.ok) throw new Error('Erreur lors du paiement');
    return res.json();
  },

  // Auth
  async login(email: string, password?: string, role?: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Identifiants invalides' }));
      throw new Error(err.error || 'Identifiants invalides');
    }
    return res.json();
  },

  async register(userData: any): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur lors de l'enregistrement" }));
      throw new Error(err.error || "Erreur lors de l'enregistrement");
    }
    return res.json();
  },

  async getUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Impossible de charger les utilisateurs');
    return res.json();
  },

  async getAdminStats(): Promise<{
    servicesCount: number;
    salonsCount: number;
    providersCount: number;
    staffCount: number;
    clientsCount: number;
    appointmentsCount: number;
    totalRevenue: number;
  }> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Impossible de charger les statistiques admin');
    return res.json();
  }
};
