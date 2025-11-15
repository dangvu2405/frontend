import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '@/utils/storage';
import { Card, CardContent } from '@/components/ui/card';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import { toast } from 'sonner';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        // Xử lý lỗi OAuth
        if (import.meta.env.DEV) {
          console.error('OAuth error:', error);
        }
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        navigate('/login?error=oauth_failed');
        return;
      }

      if (token) {
        try {
          // Lưu token vào storage
          storage.setToken(token);
          if (refreshToken) {
            storage.setRefreshToken(refreshToken);
          }

          // Dispatch event để AuthContext refresh
          window.dispatchEvent(new CustomEvent('token:updated'));

          // Fetch user info
          try {
            const response: any = await userService.getCurrentUser();
            if (response) {
              const userData = {
                id: response._id || response.id,
                username: response.TenDangNhap || response.username,
                email: response.Email || response.email,
                fullName: response.HoTen || response.fullName || response.hoten || '',
                phone: response.SoDienThoai,
                birthday: response.NgaySinh,
                avatar: response.AvatarUrl || response.Avatar || response.avatar,
                role: response.MaVaiTro?._id || response.role,
                roleName: response.MaVaiTro?.TenVaiTro || response.roleName,
              };
              storage.setUser(userData);
            }
          } catch (userError) {
            if (import.meta.env.DEV) {
              console.error('Error fetching user info:', userError);
            }
          }

          // Load cart từ database
          try {
            const cartRes = await cartService.getCart();
            const cartData = (cartRes as any)?.cart || (cartRes as any)?.data?.cart;
            
            if (cartData && cartData.Items && Array.isArray(cartData.Items) && cartData.Items.length > 0) {
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
              
              storage.removeCart();
              storage.setCart(mappedCart);
              window.dispatchEvent(new CustomEvent('cart:updated'));
            } else {
              storage.removeCart();
            }
          } catch (cartError) {
            if (import.meta.env.DEV) {
              console.error('Error loading cart from database:', cartError);
            }
            storage.removeCart();
          }

          toast.success('Đăng nhập thành công!');
          // Redirect về trang chủ
          navigate('/');
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error handling OAuth callback:', error);
          }
          toast.error('Có lỗi xảy ra khi xử lý đăng nhập.');
          navigate('/login?error=oauth_error');
        }
      } else {
        // Không có token, redirect về login
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        navigate('/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-center">
              Đang xử lý đăng nhập...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

