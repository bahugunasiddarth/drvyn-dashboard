import { Booking, InsuranceRequest, GeneralRequest } from './types';

// Get API base URL from environment or use production default
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://drvyn-backend.vercel.app';
  }
  return 'https://drvyn-backend.vercel.app';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      ...options,
      cache: 'no-cache',
    });

    if (response.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    return { success: true, data: json } as ApiResponse<T>;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export const authApi = {
  login: (username: string, password: string) => 
    apiRequest<{ access_token: string; token_type: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const bookingsApi = {
  getAll: (statusFilter?: string, skip: number = 0, limit: number = 50) => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    return apiRequest<{ bookings: Booking[]; total: number }>(`/admin/bookings?${params}`);
  },
  updateStatus: (bookingId: string, status: string) =>
    apiRequest(`/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const insuranceRequestsApi = {
  getAll: (statusFilter?: string, skip: number = 0, limit: number = 50) => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    return apiRequest<{ requests: InsuranceRequest[]; total: number }>(`/admin/insurance-requests?${params}`);
  },
  updateStatus: (requestId: string, status: string) =>
    apiRequest(`/admin/insurance-requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const generalRequestsApi = {
  getAll: (skip: number = 0, limit: number = 50) => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    return apiRequest<{ requests: GeneralRequest[]; total: number }>(`/admin/car-requests?${params}`);
  },
  updateStatus: (requestId: string, status: string) =>
    apiRequest(`/admin/car-requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const customersApi = {
  getAll: () => apiRequest<{ customers: any[] }>('/admin/customers'),
};
// --------------------------

export const dashboardApi = {
  getStats: () => 
    apiRequest<{
      totalBookings: number;
      pendingBookings: number;
      completedBookings: number;
      totalRevenue: number;
      totalInsuranceRequests: number;
      pendingInsuranceRequests: number;
      totalCarRequests: number;
    }>('/admin/dashboard/stats'),
};