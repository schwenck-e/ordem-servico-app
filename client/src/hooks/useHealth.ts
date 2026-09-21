import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { HealthResponse } from '@/types';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient<HealthResponse>('/health'),
    refetchInterval: 30000, // Checagem a cada 30 segundos
    retry: 2,
  });
}
