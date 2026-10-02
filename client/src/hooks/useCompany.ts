import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type { Company, UpdateCompanyInput } from '@/types';

export const COMPANY_QUERY_KEY = ['company'] as const;

export function useCompany() {
  return useQuery<Company, ApiError>({
    queryKey: COMPANY_QUERY_KEY,
    queryFn: () => apiClient<Company>('/company'),
    staleTime: 1000 * 60 * 10, // 10 minutos de cache
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation<Company, ApiError, UpdateCompanyInput>({
    mutationFn: (data) =>
      apiClient<Company>('/company', {
        method: 'PUT',
        body: data,
      }),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(COMPANY_QUERY_KEY, updatedCompany);
      queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY });
    },
  });
}
