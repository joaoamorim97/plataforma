export type BusinessCategory = 'HAIRDRESSER' | 'BARBER';
export type UserRole = 'CUSTOMER' | 'BUSINESS_OWNER';

export interface BusinessSummary {
  id: number;
  name: string;
  category: BusinessCategory;
  neighborhood: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  rating: number;
  totalReviews: number;
  distanceKm: number | null;
  startingPrice: number | null;
  openNow: boolean;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  durationMinutes: number | null;
}

export interface ImageItem {
  id: number;
  imageUrl: string;
  cover: boolean;
}

export interface HourItem {
  id: number | null;
  dayOfWeek: number;
  openingTime: string | null;
  closingTime: string | null;
  open: boolean;
}

export interface BusinessDetail {
  id: number;
  ownerId: string;
  name: string;
  category: BusinessCategory;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  rating: number;
  totalReviews: number;
  active: boolean;
  distanceKm: number | null;
  openNow: boolean;
  services: ServiceItem[];
  images: ImageItem[];
  hours: HourItem[];
}

export interface Review {
  id: number;
  businessId: number;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Profile {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  HAIRDRESSER: 'Cabeleireiro',
  BARBER: 'Barbearia',
};

export const CATEGORY_ICONS: Record<BusinessCategory, string> = {
  HAIRDRESSER: '💇',
  BARBER: '💈',
};

export const DAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

// ---------------------------------------------------------------------
// Management layer (multi-tenant: cada negócio é um tenant)
// ---------------------------------------------------------------------

export interface Provider {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  avatarUrl: string | null;
  active: boolean;
}

export interface Resource {
  id: number;
  name: string;
  kind: string | null;
  active: boolean;
}

export type AppointmentStatus = 'BOOKED' | 'DONE' | 'CANCELLED';

export interface Appointment {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  clientName: string;
  clientPhone: string | null;
  providerId: number | null;
  providerName: string | null;
  resourceId: number | null;
  resourceName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  servicePrice: number | null;
  status: AppointmentStatus;
  notes: string | null;
}

export type InventoryKind = 'SUPPLY' | 'RESALE';

export interface InventoryItem {
  id: number;
  name: string;
  kind: InventoryKind;
  quantity: number;
  minQuantity: number;
  unitPrice: number | null;
  lowStock: boolean;
}

export interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  catalogServices: number;
  providers: number;
  resources: number;
  inventoryItems: number;
  lowStockItems: number;
  estimatedRevenue: number;
  rating: number;
  totalReviews: number;
}

export const INVENTORY_KIND_LABELS: Record<InventoryKind, string> = {
  SUPPLY: 'Insumo',
  RESALE: 'Revenda',
};

export const TIMESLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

// ---------------------------------------------------------------------
// Agendamento pelo cliente (self-booking)
// ---------------------------------------------------------------------

export interface Slot {
  time: string;
  available: boolean;
}

export interface MyBooking {
  id: number;
  businessId: number;
  businessName: string | null;
  businessCategory: string | null;
  businessPhone: string | null;
  businessWhatsapp: string | null;
  date: string;
  time: string;
  serviceId: number | null;
  serviceName: string | null;
  servicePrice: number | null;
  providerId: number | null;
  providerName: string | null;
  status: AppointmentStatus;
}
