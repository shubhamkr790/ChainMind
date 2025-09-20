import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  GPUProvider, 
  TrainingJob, 
  ProviderFilters, 
  JobFilters, 
  PaginatedResponse, 
  ApiResponse,
  DashboardStats,
  JobSubmissionForm
} from '@/types/marketplace';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login or refresh token
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    }
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.request(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
        },
      };
    }
  }

  // Authentication Methods
  async login(walletAddress: string) {
    return this.request({
      method: 'POST',
      url: '/auth/login',
      data: { walletAddress },
    });
  }

  async verifySignature(walletAddress: string, signature: string, message: string) {
    return this.request({
      method: 'POST',
      url: '/auth/verify',
      data: { walletAddress, signature, message },
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request({
      method: 'POST',
      url: '/auth/refresh',
      data: { refreshToken },
    });
  }

  async logout() {
    return this.request({
      method: 'POST',
      url: '/auth/logout',
    });
  }

  async getCurrentUser() {
    return this.request({
      method: 'GET',
      url: '/auth/me',
    });
  }

  // GPU Provider Methods
  async getProviders(
    filters?: ProviderFilters,
    page: number = 1,
    limit: number = 12
  ): Promise<ApiResponse<PaginatedResponse<GPUProvider>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/providers?${params.toString()}`,
    });
  }

  async getProvider(id: string): Promise<ApiResponse<GPUProvider>> {
    return this.request({
      method: 'GET',
      url: `/providers/${id}`,
    });
  }

  async getProvidersByLocation(country?: string): Promise<ApiResponse<GPUProvider[]>> {
    const params = country ? `?country=${encodeURIComponent(country)}` : '';
    return this.request({
      method: 'GET',
      url: `/providers/by-location${params}`,
    });
  }

  // Training Job Methods
  async getJobs(
    filters?: JobFilters,
    page: number = 1,
    limit: number = 12
  ): Promise<ApiResponse<PaginatedResponse<TrainingJob>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value) || typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/jobs?${params.toString()}`,
    });
  }

  async getJob(id: string): Promise<ApiResponse<TrainingJob>> {
    return this.request({
      method: 'GET',
      url: `/jobs/${id}`,
    });
  }

  async createJob(jobData: JobSubmissionForm): Promise<ApiResponse<TrainingJob>> {
    return this.request({
      method: 'POST',
      url: '/jobs',
      data: jobData,
    });
  }

  async updateJob(id: string, jobData: Partial<JobSubmissionForm>): Promise<ApiResponse<TrainingJob>> {
    return this.request({
      method: 'PUT',
      url: `/jobs/${id}`,
      data: jobData,
    });
  }

  async cancelJob(id: string): Promise<ApiResponse<void>> {
    return this.request({
      method: 'POST',
      url: `/jobs/${id}/cancel`,
    });
  }

  async acceptJob(id: string): Promise<ApiResponse<TrainingJob>> {
    return this.request({
      method: 'POST',
      url: `/jobs/${id}/accept`,
    });
  }

  // User's Jobs
  async getMyJobs(
    status?: TrainingJob['status'][],
    page: number = 1,
    limit: number = 12
  ): Promise<ApiResponse<PaginatedResponse<TrainingJob>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (status && status.length > 0) {
      params.append('status', JSON.stringify(status));
    }

    return this.request({
      method: 'GET',
      url: `/jobs/my-jobs?${params.toString()}`,
    });
  }

  async getMyProviderJobs(
    status?: TrainingJob['status'][],
    page: number = 1,
    limit: number = 12
  ): Promise<ApiResponse<PaginatedResponse<TrainingJob>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (status && status.length > 0) {
      params.append('status', JSON.stringify(status));
    }

    return this.request({
      method: 'GET',
      url: `/jobs/provider-jobs?${params.toString()}`,
    });
  }

  // Dashboard Methods
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request({
      method: 'GET',
      url: '/dashboard/stats',
    });
  }

  // Search Methods
  async searchProviders(
    query: string,
    filters?: ProviderFilters
  ): Promise<ApiResponse<GPUProvider[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/search/providers?${params.toString()}`,
    });
  }

  async searchJobs(
    query: string,
    filters?: JobFilters
  ): Promise<ApiResponse<TrainingJob[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value) || typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/search/jobs?${params.toString()}`,
    });
  }

  // File Upload
  async uploadFile(file: File, type: 'dataset' | 'model' | 'script'): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request({
      method: 'POST',
      url: '/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Market Data
  async getMarketStats() {
    return this.request({
      method: 'GET',
      url: '/market/stats',
    });
  }

  async getGPUPriceHistory(gpuType: string, days: number = 30) {
    return this.request({
      method: 'GET',
      url: `/market/price-history/${gpuType}?days=${days}`,
    });
  }

  // Notifications
  async getNotifications(page: number = 1, limit: number = 20) {
    return this.request({
      method: 'GET',
      url: `/notifications?page=${page}&limit=${limit}`,
    });
  }

  async markNotificationRead(id: string) {
    return this.request({
      method: 'POST',
      url: `/notifications/${id}/read`,
    });
  }

  // Provider Registration (for future use)
  async registerProvider(providerData: any) {
    return this.request({
      method: 'POST',
      url: '/providers',
      data: providerData,
    });
  }

  async updateProvider(id: string, providerData: any) {
    return this.request({
      method: 'PUT',
      url: `/providers/${id}`,
      data: providerData,
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
