import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import authService from '@/services/authService';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  birthday?: string;
  avatar?: string;
  role?: string;
  roleName?: string; // Tên role từ populate
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAdminRole: () => boolean;
}

interface RegisterData {
  hoten: string;
  username: string;
  email: string;
  sdt?: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info with role from API
  const fetchUserInfo = useCallback(async () => {
    try {
      // Call API để lấy user info (có populate role)
      const response: any = await userService.getCurrentUser();
      if (response) {
        const userData = {
          id: response._id || response.id,
          username: response.TenDangNhap || response.username,
          email: response.Email || response.email,
          fullName: response.HoTen || response.fullName || response.hoten || '',
          phone: response.SoDienThoai ,
          birthday: response.NgaySinh ,
          avatar: response.AvatarUrl || response.Avatar || response.avatar,
          role: response.MaVaiTro?._id || response.role,
          roleName: response.MaVaiTro?.TenVaiTro || response.roleName,
        };
        setUser(userData);
      }
    } catch (error: any) {
      // Nếu là lỗi 401 (token không hợp lệ/hết hạn), clear storage và user
      if (error?.status === 401 || error?.response?.status === 401) {
        // Token không hợp lệ, clear tất cả
        storage.clearAll();
        setUser(null);
        if (import.meta.env.DEV) {
          console.log('Token không hợp lệ hoặc hết hạn, đã clear storage');
        }
        return;
      }
      
      // Các lỗi khác - chỉ log trong dev mode
      if (import.meta.env.DEV) {
        console.error('Failed to fetch user info:', error);
      }
      
      // Nếu không phải 401, thử lấy từ storage
      const storedUser: any = storage.getUser();
      if (storedUser) {
        setUser({
          id: storedUser._id || storedUser.id,
          username: storedUser.TenDangNhap || storedUser.username,
          email: storedUser.Email || storedUser.email,
          fullName: storedUser.HoTen || storedUser.fullName || storedUser.hoten || '',
          phone: storedUser.SoDienThoai  ,
          birthday: storedUser.NgaySinh  ,
          avatar: storedUser.AvatarUrl || storedUser.Avatar || storedUser.avatar,
          role: storedUser.MaVaiTro?._id || storedUser.role,
          roleName: storedUser.MaVaiTro?.TenVaiTro || storedUser.roleName,
        });
      }
    }
  }, []);

  useEffect(() => {
    const token = storage.getToken();
    if (token) {
      fetchUserInfo();
    }
    setLoading(false);

    // Listen for storage changes (for OAuth callback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && e.newValue) {
        fetchUserInfo();
      }
    };

    // Listen for custom token update event (for OAuth callback)
    const handleTokenUpdate = () => {
      const token = storage.getToken();
      if (token) {
        fetchUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token:updated', handleTokenUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token:updated', handleTokenUpdate);
    };
  }, [fetchUserInfo]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      
      if (response && response.accessToken) {
        // Fetch user info with role after login
        await fetchUserInfo();
        
        // Load cart từ database và sync vào localStorage
        try {
          const cartRes = await cartService.getCart();
          const cartData = (cartRes as any)?.cart || (cartRes as any)?.data?.cart;
          
          if (cartData && cartData.Items && Array.isArray(cartData.Items) && cartData.Items.length > 0) {
            // Map từ database format sang localStorage format
            const mappedCart = cartData.Items.map((item: any) => {
              const product = item.IdSanPham || item.MaSanPham || {};
              return {
                id: product._id || product.id || item.IdSanPham?._id || item.MaSanPham?._id,
                tenSP: product.TenSanPham || item.TenSanPham || 'Sản phẩm',
                gia: product.Gia || item.Gia || 0,
                giamGia: product.KhuyenMai || 0,
                hinhAnh: product.HinhAnhChinh || '',
                loaiSP: product.MaLoaiSanPham?.TenLoaiSanPham || '',
                quantity: item.SoLuong || item.quantity || 1,
              };
            });
            
            // Xóa cart cũ trong localStorage và set cart mới từ database
            storage.removeCart();
            storage.setCart(mappedCart);
            
            // Dispatch event để update UI
            window.dispatchEvent(new CustomEvent('cart:updated'));
          } else {
            // Nếu không có cart trong database, xóa localStorage cart
            storage.removeCart();
          }
        } catch (cartError) {
          console.error('Error loading cart from database:', cartError);
          // Nếu lỗi, vẫn xóa localStorage cart để tránh conflict
          storage.removeCart();
        }
      }
      
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      
      if (response && response.accessToken) {
        // Fetch user info with role after register
        await fetchUserInfo();
      }
      
      toast.success('Đăng ký thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Đăng ký thất bại');
      throw error;
    }
  };

  // Check if current user is admin
  const checkAdminRole = (): boolean => {
    if (!user || !user.roleName) return false;
    
    const roleName = user.roleName.toLowerCase().trim();
    return roleName === 'admin' || 
           roleName === 'quản trị viên' || 
           roleName === 'administrator';
  };

  const logout = async () => {
    try {
      // Lưu cart từ localStorage vào database trước khi logout
      const localCart = storage.getCart();
      if (localCart && localCart.length > 0 && user?.id) {
        try {
          await cartService.updateCart({ items: localCart });
          console.log('Cart saved to database before logout');
        } catch (cartError) {
          console.error('Error saving cart to database:', cartError);
          // Không block logout nếu lưu cart thất bại
        }
      }
      
      await authService.logout();
      setUser(null);
      
      // Xóa cart trong localStorage sau khi logout
      storage.removeCart();
      
      // Dispatch event để update UI
      window.dispatchEvent(new CustomEvent('cart:updated'));
      
      toast.success('Đăng xuất thành công!');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      // Vẫn xóa cart trong localStorage nếu logout thất bại
      storage.removeCart();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!authService.isAuthenticated(),
    isAdmin: checkAdminRole(),
    login,
    register,
    logout,
    checkAdminRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

