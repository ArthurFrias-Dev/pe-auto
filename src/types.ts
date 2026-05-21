/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  companyId: string; // Refers to Company
  plate: string;
  model: string;
  brand: string;
  year: number;
  mileage: number;
  notes: string;
  createdAt: string;
}

export interface PartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface VehicleService {
  id: string;
  vehicleId: string; // Refers to Vehicle
  parts: PartItem[];
  laborDescription: string;
  laborPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Discount applied only to parts
}

export interface ServiceOrder {
  id: string;
  companyId: string; // Refers to Company
  status: 'budget' | 'closed'; // 'budget' = Orçamento, 'closed' = Fechado/Faturado
  title: string; // Identification of the service order
  services: VehicleService[];
  observations: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface WorkshopDetails {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  cnpj: string;
}

export interface AppState {
  companies: Company[];
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
  workshopDetails?: WorkshopDetails;
  currentUser: {
    name: string;
    role: string;
    isLoggedIn: boolean;
  } | null;
}
