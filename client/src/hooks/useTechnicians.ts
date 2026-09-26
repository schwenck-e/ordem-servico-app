import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type { Technician, CreateTechnicianInput, UpdateTechnicianInput, PaginatedResponse } from '@/types';

export interface UseTechniciansParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | 'all';
  specialty?: string;
}

export const TECHNICIANS_QUERY_KEY = ['technicians'] as const;

export function useTechnicians(params: UseTechniciansParams = {}) {
  const { page = 1, limit = 10, search, isActive, specialty } = params;

  let activeParam: string | undefined;
  if (isActive === true) activeParam = 'true';
  else if (isActive === false) activeParam = 'false';
  else if (isActive === 'all') activeParam = 'all';

  return useQuery<PaginatedResponse<Technician>, ApiError>({
    queryKey: [...TECHNICIANS_QUERY_KEY, { page, limit, search, isActive, specialty }],
    queryFn: () =>
      apiClient<PaginatedResponse<Technician>>('/technicians', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          isActive: activeParam,
          specialty: specialty?.trim() || undefined,
        },
      }),
  });
}

export function useTechnician(id?: string) {
  return useQuery<Technician, ApiError>({
    queryKey: [...TECHNICIANS_QUERY_KEY, id],
    queryFn: () => apiClient<Technician>(`/technicians/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();

  return useMutation<Technician, ApiError, CreateTechnicianInput>({
    mutationFn: (data) =>
      apiClient<Technician>('/technicians', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TECHNICIANS_QUERY_KEY });
    },
  });
}

export function useUpdateTechnician() {
  const queryClient = useQueryClient();

  return useMutation<Technician, ApiError, { id: string; data: UpdateTechnicianInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<Technician>(`/technicians/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TECHNICIANS_QUERY_KEY });
    },
  });
}

export function useDeleteTechnician() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiClient<void>(`/technicians/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TECHNICIANS_QUERY_KEY });
    },
  });
}
