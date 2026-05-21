/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, Company, Vehicle, ServiceOrder, PartItem, VehicleService } from '../types';

const STORAGE_KEY = 'apex_service_db_state';

// Pre-populated data for immediate, high-quality demonstration
const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'c-1',
    name: 'LogisTech Express Ltda',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    notes: 'Frota de utilitários rápidos. Faturamento quinzenal.',
    createdAt: '2026-04-10T10:00:00Z',
  },
  {
    id: 'c-2',
    name: 'Vip Táxi Aliança',
    cnpj: '98.765.432/0001-21',
    phone: '(11) 91234-5678',
    notes: 'Veículos de passageiros. Revisões rigorosas a cada 10.000km.',
    createdAt: '2026-04-15T14:30:00Z',
  },
  {
    id: 'c-3',
    name: 'Distribuidora Gole Novo',
    cnpj: '45.678.901/0001-44',
    phone: '(11) 93333-2222',
    notes: 'Caminhões e vans de entrega urbana. Atenção especial com suspensão.',
    createdAt: '2026-05-01T08:15:00Z',
  }
];

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'v-1',
    companyId: 'c-1',
    plate: 'HRE-3G12',
    model: 'HR 2.5 Turbo',
    brand: 'Hyundai',
    year: 2021,
    mileage: 125300,
    notes: 'Baú curto. Ruído na embreagem quando frio.',
    createdAt: '2026-04-10T10:15:00Z',
  },
  {
    id: 'v-2',
    companyId: 'c-1',
    plate: 'FLO-9A88',
    model: 'Sprinter 416 CDI',
    brand: 'Mercedes-Benz',
    year: 2022,
    mileage: 84150,
    notes: 'Teto alto. Sensor de ABS traseiro esquerdo intermitente.',
    createdAt: '2026-04-11T11:00:00Z',
  },
  {
    id: 'v-3',
    companyId: 'c-2',
    plate: 'SPN-4412',
    model: 'Spin Premier 1.8',
    brand: 'Chevrolet',
    year: 2020,
    mileage: 185400,
    notes: 'Gás natural (GNV). Troca de velas a cada revisão.',
    createdAt: '2026-04-15T14:45:00Z',
  },
  {
    id: 'v-4',
    companyId: 'c-2',
    plate: 'CRO-7X98',
    model: 'Cronos Drive 1.3',
    brand: 'Fiat',
    year: 2021,
    mileage: 142200,
    notes: 'Câmbio manual. Revisar pastilhas constantemente.',
    createdAt: '2026-04-16T09:30:00Z',
  },
  {
    id: 'v-5',
    companyId: 'c-3',
    plate: 'DEL-5B23',
    model: 'Delivery 9.170',
    brand: 'Volkswagen Caminhões',
    year: 2019,
    mileage: 210800,
    notes: 'Caminhão de carga pesada. Troca de filtros reforçada.',
    createdAt: '2026-05-01T08:30:00Z',
  }
];

const DEFAULT_SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'so-1',
    companyId: 'c-1',
    status: 'closed',
    title: 'Manutenção Preventiva e Freios',
    createdAt: '2026-05-10T09:00:00Z',
    updatedAt: '2026-05-11T16:45:00Z',
    closedAt: '2026-05-11T16:45:00Z',
    observations: 'Faturamento faturado direto para o financeiro da LogisTech via boleto 15 dias.',
    services: [
      {
        id: 'vs-1',
        vehicleId: 'v-1',
        parts: [
          { id: 'p-1', name: 'Pastilha de Freio Dianteira Cobreq', quantity: 1, unitPrice: 189.90 },
          { id: 'p-2', name: 'Disco de Freio Ventilado Fremax (Par)', quantity: 1, unitPrice: 340.00 },
          { id: 'p-3', name: 'Óleo Motor 5W30 Sintético Castrol', quantity: 6, unitPrice: 55.00 },
          { id: 'p-4', name: 'Filtro de Óleo Fram', quantity: 1, unitPrice: 42.50 },
        ],
        laborDescription: 'Mão de obra para revisão de freios dianteiros, troca de óleo e filtros gerais correspondente à quilometragem de 125k.',
        laborPrice: 280.00,
        discountType: 'percentage',
        discountValue: 10, // 10% discount on parts
      },
      {
        id: 'vs-2',
        vehicleId: 'v-2',
        parts: [
          { id: 'p-5', name: 'Amortecedor Dianteiro Cofap (Par)', quantity: 1, unitPrice: 850.00 },
          { id: 'p-6', name: 'Kit Batente e Coifa Axios', quantity: 1, unitPrice: 160.00 },
        ],
        laborDescription: 'Substituição dos amortecedores dianteiros com alinhamento e balanceamento.',
        laborPrice: 320.00,
        discountType: 'fixed',
        discountValue: 50, // R$ 50 discount on parts
      }
    ]
  },
  {
    id: 'so-2',
    companyId: 'c-2',
    status: 'budget',
    title: 'Orçamento - Revisão Suspensão & Velas',
    createdAt: '2026-05-18T14:00:00Z',
    updatedAt: '2026-05-20T11:20:00Z',
    closedAt: null,
    observations: 'Aguardando aprovação do gestor de frotas Sr. Carlos para faturamento.',
    services: [
      {
        id: 'vs-3',
        vehicleId: 'v-3',
        parts: [
          { id: 'p-7', name: 'Jogo de Velas de Ignição NGK GNV', quantity: 1, unitPrice: 145.00 },
          { id: 'p-8', name: 'Jogo de Cabos de Vela NGK', quantity: 1, unitPrice: 120.00 },
          { id: 'p-9', name: 'Filtro de Combustível Tecfil', quantity: 1, unitPrice: 28.00 },
        ],
        laborDescription: 'Substituição das velas, limpeza de bicos injetores e teste eletrônico via scanner diagnósticos.',
        laborPrice: 150.00,
        discountType: 'percentage',
        discountValue: 5
      }
    ]
  }
];

export const DEFAULT_WORKSHOP_DETAILS = {
  name: 'PEÇAUTO',
  subtitle: 'Apex Autopeças & Serviços Automotivos',
  address: 'Rua da Embreagem Mecânica, 3000 • São Paulo, SP',
  phone: '(11) 5555-4444',
  cnpj: '12.345.678/0001-00'
};

export function getInitialState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.workshopDetails) {
        parsed.workshopDetails = { ...DEFAULT_WORKSHOP_DETAILS };
      }
      return parsed;
    } catch (e) {
      console.error('Erro ao ler localStorage do Apex, redefinindo...', e);
    }
  }

  // Fallback to defaults
  const state: AppState = {
    companies: DEFAULT_COMPANIES,
    vehicles: DEFAULT_VEHICLES,
    serviceOrders: DEFAULT_SERVICE_ORDERS,
    workshopDetails: { ...DEFAULT_WORKSHOP_DETAILS },
    currentUser: {
      name: 'Mecânico Geral / Gestor',
      role: 'Administrador',
      isLoggedIn: true
    }
  };
  saveState(state);
  return state;
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// FORMATTERS
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseBRValue(valuestring: string): number {
  if (!valuestring) return 0;
  // Convert standard strings like "120,50" -> 120.5
  const clean = valuestring
    .replace(/[^\d,.-]/g, '') // remove currency logo style tags
    .replace(/\./g, '') // remove group separators
    .replace(',', '.'); // replace decimal separators
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

// MATH AND OPERATIONS
export function calculatePartsSubtotal(parts: PartItem[]): number {
  return parts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

export function calculatePartsDiscount(parts: PartItem[], discountType: 'percentage' | 'fixed', discountValue: number): number {
  const partsSubtotal = calculatePartsSubtotal(parts);
  if (partsSubtotal <= 0) return 0;

  if (discountType === 'percentage') {
    return Math.min(partsSubtotal, (partsSubtotal * discountValue) / 100);
  } else {
    return Math.min(partsSubtotal, discountValue);
  }
}

export function calculateVehicleTotal(service: VehicleService): number {
  const partsSubtotal = calculatePartsSubtotal(service.parts);
  const partsDiscount = calculatePartsDiscount(service.parts, service.discountType, service.discountValue);
  const finalParts = Math.max(0, partsSubtotal - partsDiscount);
  return finalParts + service.laborPrice;
}

export function calculateServiceOrderGrandTotals(order: ServiceOrder) {
  let totalPartsSubtotal = 0;
  let totalPartsDiscount = 0;
  let totalLabor = 0;
  let totalFinal = 0;

  order.services.forEach(service => {
    const pSub = calculatePartsSubtotal(service.parts);
    const pDisc = calculatePartsDiscount(service.parts, service.discountType, service.discountValue);
    totalPartsSubtotal += pSub;
    totalPartsDiscount += pDisc;
    totalLabor += service.laborPrice;
    totalFinal += (pSub - pDisc + service.laborPrice);
  });

  return {
    partsSubtotal: totalPartsSubtotal,
    discountTotal: totalPartsDiscount,
    laborTotal: totalLabor,
    grandTotal: totalFinal
  };
}

// GENERIC UTILITIES
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
