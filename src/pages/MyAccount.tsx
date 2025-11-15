import { MainLayout } from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { User, Package, Heart, Settings, LogOut, MapPin, CreditCard, FileText, Camera, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/constants';

export default function MyAccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    birthday: '',
  });
  const [newAddress, setNewAddress] = useState({
    HoTen: '',
    SoDienThoai: '',
    DiaChiChiTiet: '',
    PhuongXa: '',
    QuanHuyen: '',
    TinhThanh: '',
    MacDinh: false,
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddressForm, setEditAddressForm] = useState({ ...newAddress });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ format helpers
  const formatAddressList = (response: any) => {
    const list = response?.data || response?.DiaChi || [];
    return Array.isArray(list)
      ? list.map((a: any) => ({
          id: a._id || a.id,
          recipientName: a.HoTen || '',
          phone: a.SoDienThoai || '',
          addressLine: a.DiaChiChiTiet || '',
          ward: a.PhuongXa || '',
          district: a.QuanHuyen || '',
          province: a.TinhThanh || '',
          isDefault: !!a.MacDinh,
        }))
      : [];
  };

  const formatOrderList = (response: any) => {
    // Backend trả về: { success: true, message: "...", data: { donHang: [...] } }
    // Hoặc có thể là response.data từ axios
    const raw = response?.data?.donHang || response?.donHang || (Array.isArray(response?.data) ? response.data : []);
    if (!Array.isArray(raw)) {
      console.warn('formatOrderList: raw is not an array', raw);
      return [];
    }
    return raw.map((order: any) => ({
      id: order._id || order.id,
      date: new Date(order.createdAt).toLocaleDateString('vi-VN'),
      status:
        order.TrangThai === 'pending'
          ? 'Đang xử lý'
          : order.TrangThai === 'completed'
          ? 'Hoàn thành'
          : order.TrangThai === 'cancelled'
          ? 'Đã hủy'
          : order.TrangThai === 'shipping'
          ? 'Đang giao hàng'
          : order.TrangThai,
      total: order.TongTien || 0,
      products:
        order.SanPham?.map((sp: any) => ({
          id: sp.MaSanPham || sp.id,
          name: sp.TenSanPham || sp.tenSP,
          quantity: sp.SoLuong || sp.quantity || 1,
          price: sp.Gia || sp.gia || 0,
          discount: sp.giamGia || 0,
          image: sp.hinhAnh || '',
          category: sp.loaiSP || '',
        })) || [],
      address: order.DiaChi,
      shippingFee: order.PhiVanChuyen || 0,
      paymentMethod:
        order.PhuongThucThanhToan === 'COD'
          ? 'Thanh toán khi nhận hàng'
          : order.PhuongThucThanhToan,
      note: order.GhiChu || '',
    }));
  };

  // Redirect nếu chưa authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // ✅ fetch all data khi component mount hoặc user thay đổi
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchAll = async () => {
      try {
        // Chỉ fetch addresses và orders - user data đã có từ AuthContext
        // Chỉ fetch getCurrentUser nếu cần phone/birthday mà AuthContext chưa có
        const [addr, ordersRes] = await Promise.all([
          userService.getAddresses(),
          userService.getOrders(),
        ]);
        
        // Chỉ update state nếu component vẫn còn mounted
        if (!isMounted) return;
        
        setAddresses(formatAddressList(addr));
        setOrders(formatOrderList(ordersRes));
        
        // Sử dụng user data từ AuthContext, chỉ fetch getCurrentUser nếu thiếu phone/birthday
        if (user && (!user.phone || !user.birthday)) {
          try {
            const userRes = await userService.getCurrentUser();
            const userData: any = (userRes as any)?.data || userRes || {};
            if (!isMounted) return;
            setProfileForm({
              fullName: userData.HoTen || user?.fullName || '',
              email: userData.Email || user?.email || '',
              phone: userData.SoDienThoai || user?.phone || '',
              birthday: userData.NgaySinh
                ? new Date(userData.NgaySinh).toISOString().split('T')[0]
                : user?.birthday
                ? new Date(user.birthday).toISOString().split('T')[0]
                : '',
            });
          } catch (userErr) {
            // Fallback to AuthContext user data
            if (!isMounted) return;
            setProfileForm({
              fullName: user?.fullName || '',
              email: user?.email || '',
              phone: user?.phone || '',
              birthday: user?.birthday
                ? new Date(user.birthday).toISOString().split('T')[0]
                : '',
            });
          }
        } else {
          // Sử dụng user data từ AuthContext
          setProfileForm({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
            birthday: user?.birthday
              ? new Date(user.birthday).toISOString().split('T')[0]
              : '',
          });
        }
      } catch (err) {
        console.error('Lỗi khi load dữ liệu tài khoản:', err);
        // Fallback về user từ AuthContext nếu API fail
        if (!isMounted) return;
        if (user) {
          setProfileForm({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            birthday: user.birthday
              ? new Date(user.birthday).toISOString().split('T')[0]
              : '',
          });
        }
      }
    };
    
    fetchAll();
    
    // Cleanup function để tránh update state sau khi unmount
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 🏠 thêm địa chỉ — tối ưu: sử dụng response từ API thay vì gọi lại
  const addAddress = async (e?: FormEvent) => {
    e?.preventDefault();
    const { HoTen, SoDienThoai, DiaChiChiTiet } = newAddress;
    if (!HoTen || !SoDienThoai || !DiaChiChiTiet)
      return toast.error('Vui lòng nhập đầy đủ thông tin');
    try {
      const response = await userService.createAddress(newAddress);
      // Backend returns { data: DiaChi[] } - sử dụng response trực tiếp
      setAddresses(formatAddressList(response));
      setNewAddress({
        HoTen: '',
        SoDienThoai: '',
        DiaChiChiTiet: '',
        PhuongXa: '',
        QuanHuyen: '',
        TinhThanh: '',
        MacDinh: false,
      });
      setShowAddForm(false);
      toast.success('✅ Đã thêm địa chỉ');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thêm địa chỉ');
    }
  };

  // ✏️ sửa địa chỉ — tối ưu: sử dụng response từ API thay vì gọi lại
  const submitEditAddress = async () => {
    if (!editingAddressId) return;
    try {
      const response = await userService.editAddress(editingAddressId, editAddressForm);
      // Backend returns { data: DiaChi[] } - sử dụng response trực tiếp
      setAddresses(formatAddressList(response));
      setEditingAddressId(null);
      toast.success('Cập nhật địa chỉ thành công');
    } catch {
      toast.error('Không thể sửa địa chỉ');
    }
  };

  // 🗑 xóa địa chỉ — tối ưu: sử dụng response từ API thay vì filter local
  const removeAddress = async (id: string) => {
    try {
      const response = await userService.deleteAddress(id);
      // Backend returns { data: DiaChi[] } - sử dụng response trực tiếp
      setAddresses(formatAddressList(response));
      toast.success('Xóa địa chỉ thành công');
    } catch {
      toast.error('Không thể xóa địa chỉ');
    }
  };

  // 🔧 cập nhật profile
  const handleUpdateProfile = async () => {
    try {
      await userService.updateProfile({
        hoten: profileForm.fullName,
        email: profileForm.email,
        sdt: profileForm.phone,
        ...(profileForm.birthday ? { birthday: profileForm.birthday } : {}),
      });
      toast.success('Cập nhật thông tin thành công');
    } catch (err: any) {
      toast.error(err?.message || 'Cập nhật thất bại');
    }
  };

  // 📸 xử lý chọn và upload avatar tự động
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Tự động upload ngay khi chọn file
    try {
      setUploadingAvatar(true);
      const response = await userService.uploadAvatar(file);
      
      // Update user in AuthContext
      const userData = (response as any)?.data || response || {};
      const avatarUrl = userData.AvatarUrl || userData.avatar;
      
      if (avatarUrl) {
        // Trigger reload để update avatar ở mọi nơi
        window.location.reload();
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Cập nhật avatar thành công');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật avatar');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ✏️ bắt đầu sửa địa chỉ
  const startEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setEditAddressForm({
      HoTen: addr.recipientName || '',
      SoDienThoai: addr.phone || '',
      DiaChiChiTiet: addr.addressLine || '',
      PhuongXa: addr.ward || '',
      QuanHuyen: addr.district || '',
      TinhThanh: addr.province || '',
      MacDinh: !!addr.isDefault,
    });
  };

  // ⭐ đặt địa chỉ mặc định — tối ưu: sử dụng response từ API thay vì gọi lại
  const setDefaultAddress = async (id: string) => {
    try {
      const addr = addresses.find(a => a.id === id);
      if (!addr) return;
      
      // Convert back to backend format
      const addressData = {
        HoTen: addr.recipientName,
        SoDienThoai: addr.phone,
        DiaChiChiTiet: addr.addressLine,
        PhuongXa: addr.ward,
        QuanHuyen: addr.district,
        TinhThanh: addr.province,
        MacDinh: true,
      };
      
      const response = await userService.editAddress(id, addressData);
      // Backend returns { data: DiaChi[] } - sử dụng response trực tiếp
      setAddresses(formatAddressList(response));
      toast.success('Đã đặt làm địa chỉ mặc định');
    } catch {
      toast.error('Không thể đặt địa chỉ mặc định');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User, breadcrumb: 'Settings > Profile' },
    { id: 'orders', label: 'Đơn hàng', icon: Package, breadcrumb: 'Settings > Orders' },
    { id: 'addresses', label: 'Địa chỉ', icon: MapPin, breadcrumb: 'Settings > Addresses' },
    { id: 'wishlist', label: 'Yêu thích', icon: Heart, breadcrumb: 'Settings > Wishlist' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, breadcrumb: 'Settings > Settings' },
  ];

  const handleViewOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };
  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background flex items-center justify-center py-8">
        <div className="w-[70%] max-w-7xl mx-auto bg-background rounded-lg border border-border shadow-lg overflow-hidden">
          <div className="flex h-[calc(100vh-200px)]">
            {/* Left Sidebar - Settings Navigation */}
            <div className="w-64 border-r border-border bg-muted/30 flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar.startsWith('http') ? user.avatar : user.avatar.startsWith('/') ? `${API_BASE_URL}${user.avatar}` : `${API_BASE_URL}/${user.avatar}`}
                      alt={user?.fullName || user?.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className={`text-xl font-bold text-primary ${user?.avatar ? 'hidden' : ''}`}>
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">{user?.fullName || user?.username}</h2>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground'
                        : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-background/50 hover:text-destructive transition-colors mt-4"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Breadcrumb */}
            <div className="px-8 pt-6 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentTab?.breadcrumb || 'Settings'}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card className="border border-border bg-background">
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-6">
                    Thông tin cá nhân
                  </h2>
                  <div className="space-y-4">
                    {/* Avatar Upload Section */}
                    <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
                      <div className="relative">
                        <label
                          htmlFor="avatar-upload"
                          className="relative block cursor-pointer group"
                        >
                          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border overflow-hidden transition-all group-hover:border-primary/50">
                            {uploadingAvatar ? (
                              <div className="flex items-center justify-center w-full h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              </div>
                            ) : user?.avatar ? (
                              <img 
                                src={user.avatar.startsWith('http') ? user.avatar : user.avatar.startsWith('/') ? `${API_BASE_URL}${user.avatar}` : `${API_BASE_URL}/${user.avatar}`}
                                alt={user?.fullName || user?.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className={`text-5xl font-bold text-primary ${user?.avatar ? 'hidden' : ''}`}>
                              {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                            </span>
                          </div>
                          <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors border-2 border-background shadow-lg">
                            <Camera className="w-5 h-5" />
                          </div>
                          <input
                            ref={fileInputRef}
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarSelect}
                            disabled={uploadingAvatar}
                          />
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        {uploadingAvatar ? 'Đang tải ảnh...' : 'Nhấn vào biểu tượng camera để thay đổi ảnh đại diện'}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                          id="fullName"
                            value={profileForm.fullName || ''}
                            onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value || '' }))}
                            className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Tên đăng nhập</Label>
                        <Input
                          id="username"
                          defaultValue={user?.username}
                          disabled
                            className="bg-muted border-input h-12 rounded-xl px-4 opacity-80 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                            value={profileForm.email || ''}
                            onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value || '' }))}
                            className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          placeholder="0123 456 789"
                            value={profileForm.phone || ''}
                            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value || '' }))}
                            className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                        />
                      </div>
                      <div>
                        <Label htmlFor="birthday">Ngày sinh</Label>
                        <Input
                          id="birthday"
                          type="date"
                            value={profileForm.birthday}
                            onChange={(e) => setProfileForm((p) => ({ ...p, birthday: e.target.value || '' }))}
                            className="bg-background border-input h-12 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                        />
                      </div>
                    </div>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleUpdateProfile}>
                      Cập nhật thông tin
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <Card className="border border-border bg-background">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-foreground">Địa chỉ giao hàng</h2>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setShowAddForm(v => !v)}>
                        {showAddForm ? 'Đóng' : 'Thêm địa chỉ'}
                      </Button>
                    </div>
                    {showAddForm && (
                      <form className="mb-6 grid md:grid-cols-2 gap-4" onSubmit={addAddress}>
                        <div>
                          <Label>Họ tên</Label>
                          <Input
                            className="bg-background border-input h-12 rounded-xl px-4"
                            value={newAddress.HoTen || ''}
                            onChange={(e) => setNewAddress({ ...newAddress, HoTen: e.target.value || '' })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Số điện thoại</Label>
                          <Input
                            className="bg-background border-input h-12 rounded-xl px-4"
                            value={newAddress.SoDienThoai || ''}
                            onChange={(e) => setNewAddress({ ...newAddress, SoDienThoai: e.target.value || '' })}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Địa chỉ chi tiết</Label>
                          <Input
                            className="bg-background border-input h-12 rounded-xl px-4"
                            value={newAddress.DiaChiChiTiet || ''}
                            onChange={(e) => setNewAddress({ ...newAddress, DiaChiChiTiet: e.target.value || '' })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Phường/Xã</Label>
                          <Input
                            className="bg-background border-input h-12 rounded-xl px-4"
                            value={newAddress.PhuongXa || ''}
                            onChange={(e) => setNewAddress({ ...newAddress, PhuongXa: e.target.value || '' })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Quận/Huyện</Label>
                          <Input
                            className="bg-background border-input h-12 rounded-xl px-4"
                            value={newAddress.QuanHuyen || ''}
                            onChange={(e) => setNewAddress({ ...newAddress, QuanHuyen: e.target.value || '' })}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Tỉnh/Thành</Label>
                          <Input
                            className="bg-background border-input h-12 rounded-xl px-4"
                            value={newAddress.TinhThanh || ''}
                            onChange={(e) => setNewAddress({ ...newAddress, TinhThanh: e.target.value || '' })}
                            required
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                          <input
                            id="isDefault"
                            type="checkbox"
                            checked={newAddress.MacDinh}
                            onChange={(e) => setNewAddress({ ...newAddress, MacDinh: e.target.checked })}
                            required
                          />
                          <Label htmlFor="isDefault">Đặt làm địa chỉ mặc định</Label>
                          <div className="ml-auto">
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Lưu địa chỉ</Button>
                          </div>
                        </div>
                      </form>
                    )}
                    {addresses.length === 0 ? (
                      <p className="text-muted-foreground">Bạn chưa thêm địa chỉ nào.</p>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map(addr => (
                          <div key={addr.id} className={`rounded-xl border p-4 flex flex-col gap-3 ${addr.isDefault ? 'border-primary' : 'border-border'}`}>
                            {editingAddressId === addr.id ? (
                              <>
                                <div className="grid md:grid-cols-2 gap-3">
                                  <div>
                                    <Label>Họ tên</Label>
                                    <Input className="bg-background border-input h-12 rounded-xl px-4"
                                      value={editAddressForm.HoTen || ''}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, HoTen: e.target.value || '' })} />
                                  </div>
                                  <div>
                                    <Label>Số điện thoại</Label>
                                    <Input className="bg-background border-input h-12 rounded-xl px-4"
                                      value={editAddressForm.SoDienThoai || ''}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, SoDienThoai: e.target.value || '' })} />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Địa chỉ chi tiết</Label>
                                    <Input className="bg-background border-input h-12 rounded-xl px-4"
                                      value={editAddressForm.DiaChiChiTiet || ''}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, DiaChiChiTiet: e.target.value || '' })} />
                                  </div>
                                  <div>
                                    <Label>Phường/Xã</Label>
                                    <Input className="bg-background border-input h-12 rounded-xl px-4"
                                      value={editAddressForm.PhuongXa || ''}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, PhuongXa: e.target.value || '' })} />
                                  </div>
                                  <div>
                                    <Label>Quận/Huyện</Label>
                                    <Input className="bg-background border-input h-12 rounded-xl px-4"
                                      value={editAddressForm.QuanHuyen || ''}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, QuanHuyen: e.target.value || '' })} />
                                  </div>
                                  <div>
                                    <Label>Tỉnh/Thành</Label>
                                    <Input className="bg-background border-input h-12 rounded-xl px-4"
                                      value={editAddressForm.TinhThanh || ''}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, TinhThanh: e.target.value || '' })} />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" checked={editAddressForm.MacDinh}
                                      onChange={(e) => setEditAddressForm({ ...editAddressForm, MacDinh: e.target.checked })} />
                                    Đặt làm địa chỉ mặc định
                                  </label>
                                  <div className="space-x-2">
                                    <Button variant="outline" className="border-border" onClick={() => setEditingAddressId(null)}>Hủy</Button>
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={submitEditAddress}>Lưu</Button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-foreground">{addr.recipientName}</p>
                                    {addr.isDefault && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">Mặc định</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                                  <p className="text-sm text-foreground mt-1">
                                    {[addr.addressLine, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" className="border-border" onClick={() => startEditAddress(addr)}>Sửa</Button>
                                  <Button variant="outline" className="border-border" onClick={() => setDefaultAddress(addr.id)}>
                                    Đặt làm mặc định
                                  </Button>
                                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => removeAddress(addr.id)}>
                                    Xóa
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Đơn hàng của tôi</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Không có đơn hàng nào</p>
                  </div>
                ) : (
                  <>
                    {orders.map((order: any) => (
                      <Card key={order.id} className="border-2 border-border">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                              <p className="font-bold text-foreground">{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            order.status === 'Hoàn thành'
                                ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                : 'bg-primary/10 text-primary border-primary/30'
                            }`}>{order.status}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                              <p className="text-sm text-muted-foreground">{order.items || order.products?.length || 0} sản phẩm</p>
                              <p className="font-bold text-primary">
                            {order.total.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                            <Button 
                              variant="outline" 
                              className="border-border"
                              onClick={() => handleViewOrderDetail(order)}
                            >
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <Card className="border border-border bg-background">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Sản phẩm yêu thích
                  </h2>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Chưa có sản phẩm yêu thích nào</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card className="border border-border bg-background">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Cài đặt</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Đổi mật khẩu</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value || '' })}
                            className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Mật khẩu mới</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value || '' })}
                            className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value || '' })}
                            className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                          />
                        </div>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">Chi tiết đơn hàng</SheetTitle>
            <SheetDescription>
              Thông tin chi tiết về đơn hàng #{selectedOrder?.id?.slice(-8)}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="mt-6 space-y-6">
              {/* Order Info */}
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                    <p className="font-semibold text-foreground mt-1">#{selectedOrder.id?.slice(-12)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ngày đặt</p>
                    <p className="font-semibold text-foreground mt-1">{selectedOrder.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trạng thái</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                      selectedOrder.status === 'Hoàn thành'
                        ? 'bg-green-500/10 text-green-600 border-green-500/30'
                        : selectedOrder.status === 'Đang giao hàng'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        : selectedOrder.status === 'Đã hủy'
                        ? 'bg-red-500/10 text-red-600 border-red-500/30'
                        : 'bg-primary/10 text-primary border-primary/30'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phương thức thanh toán</p>
                    <p className="font-semibold text-foreground mt-1">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Sản phẩm ({selectedOrder.products?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.products?.map((product: any, index: number) => (
                    <div key={`${selectedOrder.id}-${product.id || product.MaSanPham || index}`} className="flex gap-4 p-4 rounded-xl border border-border bg-background">
                      {product.image && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-sm text-muted-foreground">
                            SL: <span className="font-semibold text-foreground">{product.quantity}</span>
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {product.price.toLocaleString('vi-VN')}đ
                          </p>
                          {product.discount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30">
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {(product.price * product.quantity).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Địa chỉ giao hàng
                </h3>
                <div className="p-4 rounded-xl border border-border bg-background">
                  <p className="text-foreground">{selectedOrder.address}</p>
                </div>
              </div>

              {/* Note */}
              {selectedOrder.note && (
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Ghi chú
                  </h3>
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-foreground">{selectedOrder.note}</p>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Thanh toán
                </h3>
                <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Tạm tính</p>
                    <p className="font-semibold text-foreground">
                      {(selectedOrder.total - selectedOrder.shippingFee).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Phí vận chuyển</p>
                    <p className="font-semibold text-foreground">
                      {selectedOrder.shippingFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        `${selectedOrder.shippingFee.toLocaleString('vi-VN')}đ`
                      )}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <p className="font-bold text-lg text-foreground">Tổng cộng</p>
                    <p className="font-bold text-2xl text-primary">
                      {selectedOrder.total.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 border-border"
                  onClick={() => setIsOrderDetailOpen(false)}
                >
                  Đóng
                </Button>
                {selectedOrder.status === 'Đang xử lý' && (
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement cancel order
                      toast.info('Chức năng hủy đơn hàng đang được phát triển');
                    }}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}

