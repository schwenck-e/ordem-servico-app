export type WorkOrderStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderItemType = 'SERVICE' | 'PART';

export interface CustomerSummary {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string | null;
}

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
