import axios from 'axios';
import { API_BASE_URL, FALLBACK_API_URL } from '@/constants';
import { storage } from '@/utils/storage';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Cho phép gửi cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API configuration for debugging
if (typeof window !== 'undefined') {
  console.log('🌐 Axios Base URL:', axiosInstance.defaults.baseURL);
  console.log('🌐 Full API URL example:', `${axiosInstance.defaults.baseURL}/api/products`);
}

// Request interceptor - Thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý response và errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/') || originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/register');
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    
    // If 401 and token was cleared by backend
    if (error.response?.status === 401 && error.response?.data?.cleared === true) {
      // Backend đã xóa token (token không hợp lệ), xóa localStorage
      storage.clearAll();
      // Chỉ redirect nếu không phải auth endpoint và không đang ở trang login
      if (!isAuthEndpoint && !isLoginPage) {
        window.location.href = '/login';
      }
      return Promise.reject({
        message: error.response?.data?.message || 'Phiên đăng nhập hết hạn',
        status: 401,
        data: error.response?.data,
      });
    }
    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Không retry nếu đang gọi auth endpoints
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = storage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          storage.setToken(accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        storage.clearAll();
        // Chỉ redirect nếu không đang ở trang login
        if (!isLoginPage) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors (ERR_NAME_NOT_RESOLVED, ERR_CONNECTION_REFUSED, etc.)
    // Nếu có fallback URL và chưa retry với fallback, thử lại với fallback URL
    const isNetworkError = !error.response && (
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ERR_NAME_NOT_RESOLVED'
    );

    if (isNetworkError && FALLBACK_API_URL && !originalRequest._fallbackRetry) {
      console.warn('⚠️ Network error detected, retrying with fallback URL:', FALLBACK_API_URL);
      originalRequest._fallbackRetry = true;
      
      // Thay đổi baseURL tạm thời cho request này
      const fallbackConfig = {
        ...originalRequest,
        baseURL: FALLBACK_API_URL,
        url: originalRequest.url, // Giữ nguyên URL path
      };
      
      // Update axios instance baseURL tạm thời
      const originalBaseURL = axiosInstance.defaults.baseURL;
      axiosInstance.defaults.baseURL = FALLBACK_API_URL;
      
      try {
        const response = await axiosInstance(fallbackConfig);
        // Restore original baseURL
        axiosInstance.defaults.baseURL = originalBaseURL;
        return response.data;
      } catch (fallbackError) {
        // Restore original baseURL
        axiosInstance.defaults.baseURL = originalBaseURL;
        console.error('❌ Fallback URL also failed:', fallbackError);
        return Promise.reject({
          message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
          status: undefined,
          data: undefined,
        });
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra, vui lòng thử lại';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default axiosInstance;

