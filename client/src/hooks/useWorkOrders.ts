import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type {
  WorkOrder,
  WorkOrderSummary,
  WorkOrderFilterParams,
  UpdateWorkOrderStatusInput,
  PaginatedResponse,
  WorkOrderLog,
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
} from '@/types';

export const WORK_ORDERS_QUERY_KEY = ['work-orders'] as const;

export function useWorkOrders(params: WorkOrderFilterParams = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    customerId,
    technicianId,
    startDate,
    endDate,
  } = params;

  return useQuery<PaginatedResponse<WorkOrderSummary>, ApiError>({
    queryKey: [
      ...WORK_ORDERS_QUERY_KEY,
      { page, limit, search, status, priority, customerId, technicianId, startDate, endDate },
    ],
    queryFn: () =>
      apiClient<PaginatedResponse<WorkOrderSummary>>('/work-orders', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          status: status === 'all' ? undefined : status,
          priority: priority === 'all' ? undefined : priority,
          customerId: customerId || undefined,
          technicianId: technicianId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
  });
}

export function useWorkOrder(id?: string) {
  return useQuery<WorkOrder, ApiError>({
    queryKey: [...WORK_ORDERS_QUERY_KEY, id],
    queryFn: () => apiClient<WorkOrder>(`/work-orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useWorkOrderTimeline(id?: string) {
  return useQuery<WorkOrderLog[], ApiError>({
    queryKey: [...WORK_ORDERS_QUERY_KEY, id, 'timeline'],
    queryFn: () => apiClient<WorkOrderLog[]>(`/work-orders/${id}/timeline`),
    enabled: Boolean(id),
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, ApiError, { id: string; data: UpdateWorkOrderStatusInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<WorkOrder>(`/work-orders/${id}/status`, {
        method: 'PATCH',
        body: data,
      }),
    onSuccess: (_updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, id, 'timeline'] });
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, ApiError, CreateWorkOrderInput>({
    mutationFn: (data) =>
      apiClient<WorkOrder>('/work-orders', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, ApiError, { id: string; data: UpdateWorkOrderInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<WorkOrder>(`/work-orders/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: (_updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, id, 'timeline'] });
    },
  });
}

