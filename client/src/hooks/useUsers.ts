import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type { User, CreateUserInput, UpdateUserInput, PaginatedResponse, UserRole } from '@/types';

export interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const USERS_QUERY_KEY = ['users'] as const;

export function useUsers(params: UseUsersParams = {}) {
  const { page = 1, limit = 10, search, role, isActive } = params;

  return useQuery<PaginatedResponse<User>, ApiError>({
    queryKey: [...USERS_QUERY_KEY, { page, limit, search, role, isActive }],
    queryFn: () =>
      apiClient<PaginatedResponse<User>>('/users', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          role: role || undefined,
          isActive: isActive !== undefined ? String(isActive) : undefined,
        },
      }),
  });
}

export function useUser(id?: string) {
  return useQuery<User, ApiError>({
    queryKey: [...USERS_QUERY_KEY, id],
    queryFn: () => apiClient<User>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, CreateUserInput>({
    mutationFn: (data) =>
      apiClient<User>('/users', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, { id: string; data: UpdateUserInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<User>(`/users/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiClient<void>(`/users/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
