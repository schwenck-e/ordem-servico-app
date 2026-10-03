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
  productId?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    currentStock: number;
  } | null;
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

// ─── Configurações da Empresa (ENG-24 / ENG-26) ────────────────────────────

export interface Company {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  ie: string | null;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  logoUrl: string | null;
  warrantyTerms: string | null;
  workOrderNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInput {
  name?: string;
  tradeName?: string;
  cnpj?: string;
  ie?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logoUrl?: string | null;
  warrantyTerms?: string | null;
  workOrderNotes?: string | null;
}

// ─── Anexos da Ordem de Serviço (ENG-25 / ENG-26) ──────────────────────────

export type AttachmentType = 'BEFORE' | 'AFTER' | 'DOCUMENT';

export interface WorkOrderAttachment {
  id: string;
  workOrderId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: AttachmentType;
  uploadedBy: string;
  createdAt: string;
}

export interface WorkOrder extends Omit<WorkOrderSummary, 'customer' | 'technician' | 'items' | 'logs'> {
  customer: Customer;
  technician: Technician | null;
  items: WorkOrderItem[];
  logs: WorkOrderLog[];
  attachments?: WorkOrderAttachment[];
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
  productId?: string | null;
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

// ─── Controle de Estoque e Produtos (ENG-27 / ENG-28) ──────────────────────

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    movements: number;
    orderItems: number;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
  };
  workOrderId?: string | null;
  workOrder?: {
    id: string;
    orderNumber: string;
  } | null;
  type: StockMovementType;
  quantity: number;
  unitPrice?: number | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string | null;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  initialStock?: number;
  minStock?: number;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  minStock?: number;
}

export interface CreateStockMovementInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitPrice?: number;
  reason: string;
}

export interface ListStockMovementsParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: StockMovementType;
  workOrderId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
}

