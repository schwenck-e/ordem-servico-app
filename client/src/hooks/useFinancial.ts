import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type {
  FinancialTransaction,
  FinancialFilterParams,
  CreateFinancialTransactionInput,
  PayFinancialTransactionInput,
  CashflowResponse,
  PaginatedResponse,
} from '@/types';
import { INVOICES_QUERY_KEY } from './useInvoices';

export const FINANCIAL_QUERY_KEY = ['financial'] as const;

export function useFinancialCashflow(params: { startDate?: string; endDate?: string } = {}) {
  const { startDate, endDate } = params;

  return useQuery<CashflowResponse, ApiError>({
    queryKey: [...FINANCIAL_QUERY_KEY, 'cashflow', { startDate, endDate }],
    queryFn: () =>
      apiClient<CashflowResponse>('/financial/cashflow', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
  });
}

export function useFinancialTransactions(params: FinancialFilterParams = {}) {
  const { page = 1, limit = 20, type, status, category, startDate, endDate, search } = params;

  return useQuery<PaginatedResponse<FinancialTransaction>, ApiError>({
    queryKey: [...FINANCIAL_QUERY_KEY, 'transactions', { page, limit, type, status, category, startDate, endDate, search }],
    queryFn: () =>
      apiClient<PaginatedResponse<FinancialTransaction>>('/financial/transactions', {
        params: {
          page,
          limit,
          type: type === 'all' ? undefined : type,
          status: status === 'all' ? undefined : status,
          category: category === 'all' ? undefined : category,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search?.trim() || undefined,
        },
      }),
  });
}

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation<FinancialTransaction, ApiError, CreateFinancialTransactionInput>({
    mutationFn: (data) =>
      apiClient<FinancialTransaction>('/financial/transactions', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    },
  });
}

export function usePayFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation<FinancialTransaction, ApiError, { id: string; data?: PayFinancialTransactionInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<FinancialTransaction>(`/financial/transactions/${id}/pay`, {
        method: 'PATCH',
        body: data || {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
  });
}
