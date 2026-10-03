import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  StockMovement,
  CreateStockMovementInput,
  ListProductsParams,
  ListStockMovementsParams,
  PaginatedResponse,
} from '@/types';

export const PRODUCTS_QUERY_KEY = ['products'] as const;
export const STOCK_MOVEMENTS_QUERY_KEY = ['stock-movements'] as const;

export function useProducts(params: ListProductsParams = {}) {
  const { page = 1, limit = 10, search, lowStock } = params;

  return useQuery<PaginatedResponse<Product>, ApiError>({
    queryKey: [...PRODUCTS_QUERY_KEY, { page, limit, search, lowStock }],
    queryFn: () =>
      apiClient<PaginatedResponse<Product>>('/products', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
        },
      }),
  });
}

export function useProduct(id?: string) {
  return useQuery<Product, ApiError>({
    queryKey: [...PRODUCTS_QUERY_KEY, id],
    queryFn: () => apiClient<Product>(`/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useLowStockProducts() {
  return useQuery<Product[], ApiError>({
    queryKey: [...PRODUCTS_QUERY_KEY, 'low-stock'],
    queryFn: () => apiClient<Product[]>('/products/low-stock'),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, CreateProductInput>({
    mutationFn: (data) =>
      apiClient<Product>('/products', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { id: string; data: UpdateProductInput }>({
    mutationFn: ({ id, data }) =>
      apiClient<Product>(`/products/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiClient<void>(`/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useStockMovements(params: ListStockMovementsParams = {}) {
  const { page = 1, limit = 10, productId, type, workOrderId, startDate, endDate } = params;

  return useQuery<PaginatedResponse<StockMovement>, ApiError>({
    queryKey: [
      ...STOCK_MOVEMENTS_QUERY_KEY,
      { page, limit, productId, type, workOrderId, startDate, endDate },
    ],
    queryFn: () =>
      apiClient<PaginatedResponse<StockMovement>>('/stock/movements', {
        params: {
          page,
          limit,
          productId: productId || undefined,
          type: type || undefined,
          workOrderId: workOrderId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }),
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation<StockMovement, ApiError, CreateStockMovementInput>({
    mutationFn: (data) =>
      apiClient<StockMovement>('/stock/movements', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENTS_QUERY_KEY });
    },
  });
}
