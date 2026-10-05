import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type {
  Invoice,
  InvoiceSummary,
  InvoiceFilterParams,
  CreateInvoiceInput,
  CreatePaymentInput,
  CancelInvoiceInput,
  InvoicePayment,
  PaginatedResponse,
} from '@/types';

export const INVOICES_QUERY_KEY = ['invoices'] as const;
export const FINANCIAL_QUERY_KEY = ['financial'] as const;

export function useInvoices(params: InvoiceFilterParams = {}) {
  const { page = 1, limit = 10, search, status, customerId, workOrderId, startDate, endDate } = params;

  return useQuery<PaginatedResponse<InvoiceSummary>, ApiError>({
    queryKey: [...INVOICES_QUERY_KEY, { page, limit, search, status, customerId, workOrderId, startDate, endDate }],
    queryFn: () =>
      apiClient<PaginatedResponse<InvoiceSummary>>('/invoices', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          status: status === 'all' ? undefined : status,
          customerId: customerId || undefined,
          workOrderId: workOrderId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
  });
}

export function useInvoice(id?: string) {
  return useQuery<Invoice, ApiError>({
    queryKey: [...INVOICES_QUERY_KEY, id],
    queryFn: () => apiClient<Invoice>(`/invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, ApiError, CreateInvoiceInput>({
    mutationFn: (data) =>
      apiClient<Invoice>('/invoices', {
        method: 'POST',
        body: data,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
      if (created.workOrderId) {
        queryClient.invalidateQueries({ queryKey: ['work-orders', created.workOrderId] });
      }
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, ApiError, { id: string; data?: CancelInvoiceInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<Invoice>(`/invoices/${id}/cancel`, {
        method: 'PATCH',
        body: data || {},
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...INVOICES_QUERY_KEY, updated.id] });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation<InvoicePayment, ApiError, { invoiceId: string; data: CreatePaymentInput }>({
    mutationFn: ({ invoiceId, data }) =>
      apiClient<InvoicePayment>(`/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: data,
      }),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...INVOICES_QUERY_KEY, invoiceId] });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    },
  });
}
