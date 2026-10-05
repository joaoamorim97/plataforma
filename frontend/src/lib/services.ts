import { api, qs } from './api';
import type {
  BusinessCategory,
  BusinessDetail,
  BusinessSummary,
  HourItem,
  ImageItem,
  Profile,
  Review,
  ServiceItem,
  UserRole,
} from '@/types';

export interface BusinessPayload {
  name: string;
  category: BusinessCategory;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  active?: boolean;
}

export const businessApi = {
  list(params: {
    category?: BusinessCategory;
    q?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return api.get<BusinessSummary[]>(`/api/businesses${qs(params)}`);
  },
  nearby(params: { latitude: number; longitude: number; radius: number; category?: BusinessCategory }) {
    return api.get<BusinessSummary[]>(`/api/businesses/nearby${qs(params)}`);
  },
  get(id: number, coords?: { latitude?: number; longitude?: number }) {
    return api.get<BusinessDetail>(`/api/businesses/${id}${qs(coords ?? {})}`);
  },
  mine() {
    return api.get<BusinessDetail[]>('/api/businesses/mine');
  },
  create(payload: BusinessPayload) {
    return api.post<BusinessDetail>('/api/businesses', payload);
  },
  update(id: number, payload: BusinessPayload) {
    return api.put<BusinessDetail>(`/api/businesses/${id}`, payload);
  },
  remove(id: number) {
    return api.delete<void>(`/api/businesses/${id}`);
  },

  // services
  addService(businessId: number, payload: Omit<ServiceItem, 'id'>) {
    return api.post<ServiceItem>(`/api/businesses/${businessId}/services`, payload);
  },
  updateService(businessId: number, serviceId: number, payload: Omit<ServiceItem, 'id'>) {
    return api.put<ServiceItem>(`/api/businesses/${businessId}/services/${serviceId}`, payload);
  },
  removeService(businessId: number, serviceId: number) {
    return api.delete<void>(`/api/businesses/${businessId}/services/${serviceId}`);
  },

  // photos
  addPhoto(businessId: number, imageUrl: string, cover: boolean) {
    return api.post<ImageItem>(`/api/businesses/${businessId}/photos`, { imageUrl, cover });
  },
  removePhoto(businessId: number, photoId: number) {
    return api.delete<void>(`/api/businesses/${businessId}/photos/${photoId}`);
  },

  // hours
  replaceHours(businessId: number, hours: Omit<HourItem, 'id'>[]) {
    return api.put<HourItem[]>(`/api/businesses/${businessId}/hours`, hours);
  },
};

export const reviewApi = {
  list(businessId: number) {
    return api.get<Review[]>(`/api/businesses/${businessId}/reviews`);
  },
  submit(businessId: number, rating: number, comment: string) {
    return api.post<Review>(`/api/businesses/${businessId}/reviews`, { rating, comment });
  },
};

export const favoriteApi = {
  list() {
    return api.get<BusinessSummary[]>('/api/favorites');
  },
  ids() {
    return api.get<number[]>('/api/favorites/ids');
  },
  add(businessId: number) {
    return api.post<void>(`/api/favorites/${businessId}`);
  },
  remove(businessId: number) {
    return api.delete<void>(`/api/favorites/${businessId}`);
  },
};

export const profileApi = {
  me() {
    return api.get<Profile>('/api/profile/me');
  },
  update(payload: { name: string; email?: string; phone?: string | null; avatarUrl?: string | null; role?: UserRole }) {
    return api.put<Profile>('/api/profile/me', payload);
  },
};

// ---------------------------------------------------------------------
// Management layer API
// ---------------------------------------------------------------------

import type {
  Appointment,
  AppointmentStatus,
  DashboardStats,
  InventoryItem,
  InventoryKind,
  Provider,
  Resource,
} from '@/types';

export interface ProviderPayload {
  name: string;
  role?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
}

export interface ResourcePayload {
  name: string;
  kind?: string | null;
  active?: boolean;
}

export interface AppointmentPayload {
  date: string;
  time: string;
  clientName: string;
  clientPhone?: string | null;
  providerId?: number | null;
  resourceId?: number | null;
  serviceId?: number | null;
  status?: AppointmentStatus;
  notes?: string | null;
}

export interface InventoryPayload {
  name: string;
  kind?: InventoryKind;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number | null;
}

const base = (businessId: number) => `/api/businesses/${businessId}`;

export const providerApi = {
  list: (b: number) => api.get<Provider[]>(`${base(b)}/providers`),
  create: (b: number, p: ProviderPayload) => api.post<Provider>(`${base(b)}/providers`, p),
  update: (b: number, id: number, p: ProviderPayload) => api.put<Provider>(`${base(b)}/providers/${id}`, p),
  remove: (b: number, id: number) => api.delete<void>(`${base(b)}/providers/${id}`),
};

export const resourceApi = {
  list: (b: number) => api.get<Resource[]>(`${base(b)}/resources`),
  create: (b: number, p: ResourcePayload) => api.post<Resource>(`${base(b)}/resources`, p),
  update: (b: number, id: number, p: ResourcePayload) => api.put<Resource>(`${base(b)}/resources/${id}`, p),
  remove: (b: number, id: number) => api.delete<void>(`${base(b)}/resources/${id}`),
};

export const appointmentApi = {
  list: (b: number, params?: { date?: string; providerId?: number }) =>
    api.get<Appointment[]>(`${base(b)}/appointments${qs(params ?? {})}`),
  create: (b: number, p: AppointmentPayload) => api.post<Appointment>(`${base(b)}/appointments`, p),
  update: (b: number, id: number, p: AppointmentPayload) => api.put<Appointment>(`${base(b)}/appointments/${id}`, p),
  remove: (b: number, id: number) => api.delete<void>(`${base(b)}/appointments/${id}`),
};

export const inventoryApi = {
  list: (b: number) => api.get<InventoryItem[]>(`${base(b)}/inventory`),
  create: (b: number, p: InventoryPayload) => api.post<InventoryItem>(`${base(b)}/inventory`, p),
  update: (b: number, id: number, p: InventoryPayload) => api.put<InventoryItem>(`${base(b)}/inventory/${id}`, p),
  adjust: (b: number, id: number, delta: number) =>
    api.patch<InventoryItem>(`${base(b)}/inventory/${id}/quantity`, { delta }),
  remove: (b: number, id: number) => api.delete<void>(`${base(b)}/inventory/${id}`),
};

export const dashboardApi = {
  stats: (b: number) => api.get<DashboardStats>(`${base(b)}/dashboard/stats`),
};

// ---------------------------------------------------------------------
// Agendamento pelo cliente (self-booking)
// ---------------------------------------------------------------------

import type { MyBooking, Slot } from '@/types';

export interface BookingPayload {
  date: string;
  time: string;
  serviceId?: number | null;
  providerId?: number | null;
  clientName?: string | null;
  clientPhone?: string | null;
  notes?: string | null;
}

export const bookingApi = {
  availability: (businessId: number, date: string, providerId?: number) =>
    api.get<Slot[]>(`/api/businesses/${businessId}/availability${qs({ date, providerId })}`),
  publicProviders: (businessId: number) =>
    api.get<Provider[]>(`/api/businesses/${businessId}/public-providers`),
  book: (businessId: number, payload: BookingPayload) =>
    api.post<MyBooking>(`/api/businesses/${businessId}/bookings`, payload),
  myBookings: () => api.get<MyBooking[]>('/api/me/bookings'),
  cancel: (appointmentId: number) => api.delete<void>(`/api/me/bookings/${appointmentId}`),
};
