import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * AdminRoute - Protected route cho admin
 * Chỉ cho phép user có role Admin truy cập
 */
export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Đợi một chút để đảm bảo user info đã được load
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  // Đang loading hoặc đang check
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã login nhưng không phải admin -> show 403
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-destructive/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Truy cập bị từ chối
          </h2>
          <p className="text-muted-foreground mb-6">
            Bạn không có quyền truy cập vào trang quản trị. 
            Tính năng này chỉ dành cho quản trị viên.
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Tài khoản hiện tại:</strong>
            </p>
            <p className="text-sm">
              • Username: <span className="font-mono">{user?.username}</span>
            </p>
            <p className="text-sm">
              • Email: <span className="font-mono">{user?.email}</span>
            </p>
            <p className="text-sm">
              • Vai trò: <span className="font-semibold text-destructive">
                {user?.roleName || 'Chưa xác định'}
              </span>
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
            >
              Quay lại
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              Về trang chủ
            </button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    );
  }

  // User có quyền admin -> cho phép truy cập
  return <Outlet />;
};

export default AdminRoute;
