import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type { Customer, CreateCustomerInput, UpdateCustomerInput, PaginatedResponse } from '@/types';

export interface UseCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const CUSTOMERS_QUERY_KEY = ['customers'] as const;

export function useCustomers(params: UseCustomersParams = {}) {
  const { page = 1, limit = 10, search } = params;

  return useQuery<PaginatedResponse<Customer>, ApiError>({
    queryKey: [...CUSTOMERS_QUERY_KEY, { page, limit, search }],
    queryFn: () =>
      apiClient<PaginatedResponse<Customer>>('/customers', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
        },
      }),
  });
}

export function useCustomer(id?: string) {
  return useQuery<Customer, ApiError>({
    queryKey: [...CUSTOMERS_QUERY_KEY, id],
    queryFn: () => apiClient<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, CreateCustomerInput>({
    mutationFn: (data) =>
      apiClient<Customer>('/customers', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, { id: string; data: UpdateCustomerInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiClient<void>(`/customers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}
