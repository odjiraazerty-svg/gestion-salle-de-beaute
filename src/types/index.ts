export type SalonUniverse = 'all' | 'homme' | 'femme' | 'enfant' | 'mixte';

export type UserRole = 'admin' | 'owner' | 'employee' | 'client';

export type AppTheme = 'blanc' | 'bleu' | 'vert' | 'rose' | 'sombre';

export interface SalonInfo {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  email: string;
  currency: string;
  logo?: string;
  coverImage?: string;
  openingHours: {
    days: string;
    hours: string;
  };
  universe?: string;
  univers?: string;
  rating: number;
  reviewsCount: number;
  ownerId?: string;
  id_user?: string;
  userId?: string;
  prestations?: any[];
}

export interface AuthUser {
  id: string;
  id_user?: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  city?: string;
  address?: string;
  avatar?: string;
  staffId?: string;
  clientId?: string;
  salonId?: string; // Salon affiliation for owners & employees
  salonName?: string;
  token?: string;
  sessionId?: string;
  connectedAt?: string;
}

export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'apple_pay';

export type ServiceUnivers = 'Homme' | 'Dame' | 'Enfant' | 'Adolescent';

export interface SalonPrestationConfig {
  serviceId: string;
  cout: number;
  duree: number;
}

export interface PrestationSalon {
  id: string;
  id_salon: string;
  id_service: string;
  cout: number;
  duree: number;
  id_user?: string;
  userId?: string;
  createdAt?: string;
}

export interface ServiceItem {
  id_service?: string;
  id: string;
  nom?: string;
  name: string;
  description: string;
  univers?: ServiceUnivers;
  universe?: string;
  image_ulistration?: string;
  image: string;
  salonId?: string;
  salonName?: string;
  salonCity?: string;
  salonQuartier?: string;
  salonAddress?: string;
  salonCurrency?: string;
  salonLogo?: string;
  salonRating?: number;
  salonReviewsCount?: number;
  subCategory?: string;
  price?: number;
  cout?: number;
  duration?: number;
  duree?: number;
  popular?: boolean;
  featured?: boolean;
  recommendedFor?: string;
  includedSteps?: string[];
  id_user?: string;
  userId?: string;
  createdAt?: string;
}

export interface StaffMember {
  id: string;
  salonId: string;
  ownerId?: string;
  id_user?: string;
  userId?: string;
  name: string;
  role: string;
  avatar: string;
  universe: ('homme' | 'femme' | 'enfant' | 'mixte')[];
  rating: number;
  reviewsCount: number;
  bio: string;
  workingDays: number[]; // 0=Dimanche, 1=Lundi...
  workingHours: { start: string; end: string };
  color: string;
}

export interface Appointment {
  id: string;
  salonId: string;
  salonName?: string;
  salonCity?: string;
  salonAddress?: string;
  salonCurrency?: string;
  salonLogo?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  price: number;
  universe: 'homme' | 'femme' | 'enfant' | 'mixte';
  status: AppointmentStatus;
  notes?: string;
  id_user?: string;
  userId?: string;
  createdAt: string;
  qrCode: string;
  paid: boolean;
  paymentMethod?: PaymentMethod;
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  universePreference: 'homme' | 'femme' | 'enfant' | 'mixte';
  visitsCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisit?: string;
  favoriteService?: string;
  technicalNotes?: string;
  id_user?: string;
  userId?: string;
}
