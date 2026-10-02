import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import { WORK_ORDERS_QUERY_KEY } from './useWorkOrders';
import type { WorkOrderAttachment, AttachmentType } from '@/types';

export const ATTACHMENTS_QUERY_KEY = ['attachments'] as const;

export function useAttachments(workOrderId?: string, typeFilter?: AttachmentType) {
  return useQuery<WorkOrderAttachment[], ApiError>({
    queryKey: [...ATTACHMENTS_QUERY_KEY, workOrderId, { type: typeFilter }],
    queryFn: () =>
      apiClient<WorkOrderAttachment[]>(`/work-orders/${workOrderId}/attachments`, {
        params: typeFilter ? { type: typeFilter } : undefined,
      }),
    enabled: Boolean(workOrderId),
  });
}

export interface UploadAttachmentPayload {
  file: File;
  type: AttachmentType;
}

export function useUploadAttachment(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation<WorkOrderAttachment, ApiError, UploadAttachmentPayload>({
    mutationFn: async ({ file, type }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      return apiClient<WorkOrderAttachment>(`/work-orders/${workOrderId}/attachments`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ATTACHMENTS_QUERY_KEY, workOrderId] });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, workOrderId] });
    },
  });
}

export function useDeleteAttachment(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (attachmentId) =>
      apiClient<{ message: string }>(`/work-orders/${workOrderId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ATTACHMENTS_QUERY_KEY, workOrderId] });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, workOrderId] });
    },
  });
}
