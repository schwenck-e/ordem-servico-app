import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type {
  Quote,
  QuoteSummary,
  QuoteFilterParams,
  CreateQuoteInput,
  UpdateQuoteInput,
  UpdateQuoteStatusInput,
  PaginatedResponse,
  ConvertQuoteResponse,
} from '@/types';

export const QUOTES_QUERY_KEY = ['quotes'] as const;

export function useQuotes(params: QuoteFilterParams = {}) {
  const { page = 1, limit = 10, search, status, customerId, startDate, endDate } = params;

  return useQuery<PaginatedResponse<QuoteSummary>, ApiError>({
    queryKey: [...QUOTES_QUERY_KEY, { page, limit, search, status, customerId, startDate, endDate }],
    queryFn: () =>
      apiClient<PaginatedResponse<QuoteSummary>>('/quotes', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          status: status === 'all' ? undefined : status,
          customerId: customerId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
  });
}

export function useQuote(id?: string) {
  return useQuery<Quote, ApiError>({
    queryKey: [...QUOTES_QUERY_KEY, id],
    queryFn: () => apiClient<Quote>(`/quotes/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation<Quote, ApiError, CreateQuoteInput>({
    mutationFn: (data) =>
      apiClient<Quote>('/quotes', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation<Quote, ApiError, { id: string; data: UpdateQuoteInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<Quote>(`/quotes/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUOTES_QUERY_KEY, updated.id] });
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation<Quote, ApiError, { id: string; data: UpdateQuoteStatusInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<Quote>(`/quotes/${id}/status`, {
        method: 'PATCH',
        body: data,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUOTES_QUERY_KEY, updated.id] });
    },
  });
}

export function useConvertToWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<ConvertQuoteResponse, ApiError, string>({
    mutationFn: (id) =>
      apiClient<ConvertQuoteResponse>(`/quotes/${id}/convert-to-work-order`, {
        method: 'POST',
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUOTES_QUERY_KEY, result.quote.id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}
