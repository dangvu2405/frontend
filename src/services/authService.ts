import axiosInstance from './axios';
import { API_ENDPOINTS } from '@/constants';
import { storage } from '@/utils/storage';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  hoten: string;
  username: string;
  email: string;
  sdt?: string;
  password: string;
}

interface AuthResponse {
  message: string;
  accessToken: string;
  user?: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    
  };
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<any, AuthResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    if (response && response.accessToken) {
      storage.setToken(response.accessToken);
      
      if (response.user) {
        storage.setUser(response.user);
      }
    }

    return response;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<any, AuthResponse>(
      API_ENDPOINTS.REGISTER,
      userData
    );

    if (response && response.accessToken) {
      storage.setToken(response.accessToken);
      
      if (response.user) {
        storage.setUser(response.user);
      }
    }

    return response;
  },

  logout: async (): Promise<void> => {
    try {
      // Gọi API logout (không cần refreshToken nữa, backend sẽ xử lý)
      await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    } catch (error: any) {
      // Nếu API fail, vẫn clear storage để đảm bảo logout ở frontend
      console.warn('Logout API error (continuing with local logout):', error?.message);
    } finally {
      // Luôn clear storage dù API thành công hay thất bại
      storage.clearAll();
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return axiosInstance.post<any, { message: string }>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      { email }
    );
  },

  resetPassword: async (payload: {
    token: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ message: string }> => {
    return axiosInstance.post<any, { message: string }>(
      API_ENDPOINTS.RESET_PASSWORD,
      payload
    );
  },

  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  },

  getCurrentUser: () => {
    return storage.getUser();
  },
};

export default authService;

