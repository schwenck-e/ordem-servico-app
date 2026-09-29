import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type {
  MetricsSummary,
  MetricsByStatusResponse,
  MetricsByTechnicianResponse,
  MetricsPeriodFilter,
} from '@/types';

export const METRICS_QUERY_KEY = ['metrics'] as const;

export function useMetricsSummary(filters: MetricsPeriodFilter = {}) {
  const { startDate, endDate } = filters;

  return useQuery<MetricsSummary, ApiError>({
    queryKey: [...METRICS_QUERY_KEY, 'summary', { startDate, endDate }],
    queryFn: () =>
      apiClient<MetricsSummary>('/metrics/summary', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
    staleTime: 1000 * 60,
  });
}

export function useMetricsByStatus(filters: MetricsPeriodFilter = {}) {
  const { startDate, endDate } = filters;

  return useQuery<MetricsByStatusResponse, ApiError>({
    queryKey: [...METRICS_QUERY_KEY, 'by-status', { startDate, endDate }],
    queryFn: () =>
      apiClient<MetricsByStatusResponse>('/metrics/by-status', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
    staleTime: 1000 * 60,
  });
}

export function useMetricsByTechnician(filters: MetricsPeriodFilter = {}) {
  const { startDate, endDate } = filters;

  return useQuery<MetricsByTechnicianResponse, ApiError>({
    queryKey: [...METRICS_QUERY_KEY, 'by-technician', { startDate, endDate }],
    queryFn: () =>
      apiClient<MetricsByTechnicianResponse>('/metrics/by-technician', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
    staleTime: 1000 * 60,
  });
}
