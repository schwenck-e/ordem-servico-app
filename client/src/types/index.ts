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

export interface WorkOrderSummary {
  id: string;
  orderNumber: string;
  customerId: string;
  technicianId: string | null;
  equipment: string;
  serialNumber: string | null;
  reportedDefect: string;
  technicalDiagnosis: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  totalServices: number;
  totalParts: number;
  discount: number;
  totalAmount: number;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  technician: {
    id: string;
    name: string;
    email: string;
    specialty: string;
  } | null;
  _count?: {
    items: number;
  };
}

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  type: WorkOrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt?: string;
}

export interface WorkOrderLog {
  id: string;
  workOrderId: string;
  previousStatus: WorkOrderStatus | null;
  newStatus: WorkOrderStatus;
  comment: string;
  createdBy: string;
  createdAt: string;
}

export interface WorkOrder extends Omit<WorkOrderSummary, 'customer' | 'technician' | 'items' | 'logs'> {
  customer: Customer;
  technician: Technician | null;
  items: WorkOrderItem[];
  logs: WorkOrderLog[];
}

export interface WorkOrderFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: WorkOrderStatus | 'all';
  priority?: WorkOrderPriority | 'all';
  customerId?: string;
  technicianId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateWorkOrderStatusInput {
  status: WorkOrderStatus;
  comment?: string;
  technicalDiagnosis?: string;
  technicianId?: string;
  createdBy?: string;
}

export interface CreateWorkOrderItemInput {
  type: WorkOrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateWorkOrderInput {
  customerId: string;
  technicianId?: string | null;
  equipment: string;
  serialNumber?: string | null;
  reportedDefect: string;
  priority?: WorkOrderPriority;
  scheduledDate?: string | null;
  discount?: number;
  items: CreateWorkOrderItemInput[];
  initialComment?: string;
}

export interface UpdateWorkOrderInput {
  customerId?: string;
  technicianId?: string | null;
  equipment?: string;
  serialNumber?: string | null;
  reportedDefect?: string;
  technicalDiagnosis?: string | null;
  priority?: WorkOrderPriority;
  scheduledDate?: string | null;
  discount?: number;
  items?: CreateWorkOrderItemInput[];
}

// ─── Autenticação e Usuários (ENG-23) ───────────────────────────────────────

export type UserRole = 'ADMIN' | 'OPERATOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

// ─── Métricas e Dashboard (ENG-20) ──────────────────────────────────────────

export interface MetricsPeriodFilter {
  startDate?: string;
  endDate?: string;
}

export type PeriodPresetKey = 'today' | '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';

export interface MetricsSummaryFinancial {
  totalRevenue: number;
  pendingRevenue: number;
  averageTicket: number;
}

export interface MetricsSummary {
  totalOrders: number;
  statusCounts: Record<WorkOrderStatus, number>;
  financial: MetricsSummaryFinancial;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface StatusMetricItem {
  status: WorkOrderStatus;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface MetricsByStatusResponse {
  data: StatusMetricItem[];
  totalOrders: number;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface TechnicianMetricItem {
  technicianId: string | null;
  name: string;
  email: string | null;
  specialty: string | null;
  isActive: boolean | null;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export interface MetricsByTechnicianResponse {
  data: TechnicianMetricItem[];
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}
