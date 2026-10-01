const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const TOKEN_STORAGE_KEY = '@ordem-servico:token';
export const USER_STORAGE_KEY = '@ordem-servico:user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredSession(token: string, user: unknown): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, body, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const isJsonBody =
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob);

  const token = getStoredToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const config: RequestInit = {
    method: customConfig.method || 'GET',
    headers: {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders,
      ...headers,
    },
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
    ...customConfig,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    let errorPayload: any;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = await response.text();
    }
    const message =
      typeof errorPayload === 'object' && errorPayload !== null && 'message' in errorPayload
        ? String(errorPayload.message)
        : `Erro na requisição: ${response.status} ${response.statusText}`;

    throw new ApiError(message, response.status, errorPayload);
  }

  // Resposta 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
