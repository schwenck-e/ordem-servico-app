export type WorkOrderStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderItemType = 'SERVICE' | 'PART';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Full Customer model returned by API
export interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    workOrders: number;
  };
}

export interface CreateCustomerInput {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

// Summary types used in dashboard and listings
export interface CustomerSummary {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string | null;
}

// Full Technician model returned by API
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  isActive: boolean;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    workOrders: number;
  };
}

export interface CreateTechnicianInput {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  isActive?: boolean;
}

export type UpdateTechnicianInput = Partial<CreateTechnicianInput>;

export interface TechnicianSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string | null;
  active: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
  };
}
