import { ServiceItem, StaffMember, Appointment, ClientProfile, SalonInfo, AuthUser } from '../types';

export const INITIAL_SALONS: SalonInfo[] = [];

export const DEMO_USERS: AuthUser[] = [];

export const INITIAL_SALON_INFO: SalonInfo = {
  id: '',
  name: "Mon Salon de Beauté",
  slug: 'mon-salon',
  tagline: "Espace Beauté, Soins & Coiffure",
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

export const INITIAL_SERVICES: ServiceItem[] = [];

export const INITIAL_STAFF: StaffMember[] = [];

export const INITIAL_CLIENTS: ClientProfile[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];


