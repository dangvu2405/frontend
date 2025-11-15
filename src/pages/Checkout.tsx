import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { storage, type CartItem } from '@/utils/storage';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import PaymentSuccess from '@/components/payment-sucess';
import PaymentFail from '@/components/payment-fail';

type Address = {
  _id?: string;
  HoTen: string;
  SoDienThoai: string;
  DiaChiChiTiet: string;
  PhuongXa?: string;
  QuanHuyen?: string;
  TinhThanh?: string;
  MacDinh: boolean;
};

type CheckoutResponse = {
  message?: string;
  orderId?: string;
  _id?: string | { toString(): string };
  donHang?: {
    _id?: string | { toString(): string };
    id?: string | { toString(): string };
  };
  data?: {
    donHang?: {
      _id?: string | { toString(): string };
      id?: string | { toString(): string };
    };
  };
};


export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'BANK' | 'CARD' | 'VNPay' | 'VNPayQR'>('COD');
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'fail' | 'processing'>('idle');
  const [vnpayQRCode, setVnpayQRCode] = useState<string>('');
  const [vnpayPaymentUrl, setVnpayPaymentUrl] = useState<string>('');
  const [newAddress, setNewAddress] = useState<Address>({
    HoTen: '',
    SoDienThoai: '',
    DiaChiChiTiet: '',
    PhuongXa: '',
    QuanHuyen: '',
    TinhThanh: '',
    MacDinh: false,
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscountPct, setVoucherDiscountPct] = useState<number>(0);

  useEffect(() => {
    setCartItems(storage.getCart());
    const onUpdate = () => setCartItems(storage.getCart());
    window.addEventListener('cart:updated', onUpdate as EventListener);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('cart:updated', onUpdate as EventListener);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  // Load user addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) {
        // Không đăng nhập: không gọi API, hiển thị form nhập địa chỉ
        setAddresses([]);
        setShowNewAddress(true);
        return;
      }
      try {
        const res: any = await userService.getAddresses();
        // Backend trả về { message, data: DiaChi[] }
        // Axios interceptor đã extract response.data, nên res = { message, data: [...] }
        const list: Address[] = (res?.data || res?.DiaChi || res?.addresses || []) as Address[];
        
        // Format địa chỉ để đảm bảo có _id
        const formattedList = list.map((addr: any) => ({
          _id: addr._id || addr.id,
          HoTen: addr.HoTen || '',
          SoDienThoai: addr.SoDienThoai || '',
          DiaChiChiTiet: addr.DiaChiChiTiet || '',
          PhuongXa: addr.PhuongXa || '',
          QuanHuyen: addr.QuanHuyen || '',
          TinhThanh: addr.TinhThanh || '',
          MacDinh: !!addr.MacDinh,
        }));
        
        setAddresses(formattedList);
        const def = formattedList.find((a) => a.MacDinh);
        setSelectedAddressId((def?._id as string) || (formattedList[0]?._id as string) || null);
        setShowNewAddress(formattedList.length === 0); // nếu chưa có địa chỉ -> mở form
      } catch (e: any) {
        console.error('Error fetching addresses:', e);
        // Nếu lỗi khi lấy địa chỉ, cho phép nhập tay
        setAddresses([]);
        setShowNewAddress(true);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, p) => {
      const unit = Number(p.gia) || 0;
      const discount = Number(p.giamGia) || 0;
      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      return sum + finalUnit * (p.quantity || 0);
    }, 0);
  }, [cartItems]);
  const shipping = 0;
  const voucherDiscountAmount = Math.floor(subtotal * (voucherDiscountPct / 100));
  const total = Math.max(0, subtotal - voucherDiscountAmount + shipping);

  const applyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherDiscountPct(0);
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (code === 'GIAM10') {
      setVoucherDiscountPct(10);
      toast.success('Áp dụng mã giảm 10% thành công');
    } else if (code === 'GIAM20') {
      setVoucherDiscountPct(20);
      toast.success('Áp dụng mã giảm 20% thành công');
    } else if (code === 'FREESHIP') {
      setVoucherDiscountPct(0);
      toast.success('Áp dụng miễn phí vận chuyển');
    } else {
      setVoucherDiscountPct(0);
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const saveNewAddress = async () => {
    try {
      const response: any = await userService.createAddress(newAddress);
      toast.success('Đã lưu địa chỉ');
      
      // Thêm địa chỉ mới vào state thay vì fetch lại toàn bộ
      const newAddr: Address = {
        _id: response?._id || response?.data?._id || response?.id,
        HoTen: newAddress.HoTen,
        SoDienThoai: newAddress.SoDienThoai,
        DiaChiChiTiet: newAddress.DiaChiChiTiet,
        PhuongXa: newAddress.PhuongXa,
        QuanHuyen: newAddress.QuanHuyen,
        TinhThanh: newAddress.TinhThanh,
        MacDinh: Boolean(newAddress.MacDinh),
      };

      // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
      const normalizedExisting = newAddr.MacDinh
        ? addresses.map((addr) => ({ ...addr, MacDinh: false }))
        : addresses;
      const updatedAddresses = [...normalizedExisting, newAddr];
      setAddresses(updatedAddresses);
      setShowNewAddress(false);
      setSelectedAddressId(newAddr._id || null);
      setNewAddress({ HoTen: '', SoDienThoai: '', DiaChiChiTiet: '', PhuongXa: '', QuanHuyen: '', TinhThanh: '', MacDinh: false });
    } catch (e: any) {
      toast.error(e?.message || 'Không thể lưu địa chỉ');
    }
  };
  const checkOut = async () => {
    try {
      if (cartItems.length === 0) {
        toast.error('Giỏ hàng trống');
        return;
      }
      // Xác định payload địa chỉ
      let DiaChiPayload: any = null;
      if (isAuthenticated) {
        if (!selectedAddressId) {
          toast.error('Vui lòng chọn địa chỉ giao hàng');
          return;
        }
        DiaChiPayload = selectedAddressId;
      } else {
        // Khách vãng lai – yêu cầu nhập đầy đủ địa chỉ
        if (!newAddress.HoTen || !newAddress.SoDienThoai || !newAddress.DiaChiChiTiet) {
          toast.error('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ chi tiết');
          return;
        }
        DiaChiPayload = newAddress;
      }

      setIsSubmitting(true);
      setPaymentStatus('processing');

      // Tạo đơn hàng
      if (import.meta.env.DEV) {
        console.log('Starting checkout with payload:', {
          DiaChi: DiaChiPayload,
          SanPham: cartItems,
          TongTien: total,
          PhuongThucThanhToan: selectedPaymentMethod,
          GhiChu: selectedNote,
          Voucher: voucherCode || undefined,
        });
      }

      let checkoutResult: CheckoutResponse | null = null;
      try {
        const response = await cartService.checkout({
          DiaChi: DiaChiPayload,
          SanPham: cartItems,
          TongTien: total,
          PhuongThucThanhToan: selectedPaymentMethod,
          GhiChu: selectedNote,
          Voucher: voucherCode || undefined,
        } as any);
        
        if (import.meta.env.DEV) {
          console.log('Raw checkout response:', response);
        }
        
        checkoutResult = response as CheckoutResponse;
      } catch (checkoutError: any) {
        if (import.meta.env.DEV) {
          console.error('Checkout API error:', checkoutError);
        }
        const errorMsg = checkoutError?.message || checkoutError?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
        toast.error(errorMsg);
        setPaymentStatus('fail');
        setIsSubmitting(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Checkout result:', checkoutResult);
      }

      // Validate checkout result
      if (!checkoutResult) {
        if (import.meta.env.DEV) {
          console.error('Checkout result is null or undefined');
        }
        toast.error('Không nhận được phản hồi từ server. Vui lòng thử lại.');
        setPaymentStatus('fail');
        setIsSubmitting(false);
        return;
      }

      // Lấy orderId từ response - có thể ở nhiều vị trí
      let orderId: string | null = null;
      
      // Thử các cách lấy orderId
      if (checkoutResult?.donHang?._id) {
        orderId = typeof checkoutResult.donHang._id === 'string' 
          ? checkoutResult.donHang._id 
          : checkoutResult.donHang._id.toString();
      } else if (checkoutResult?.donHang?.id) {
        orderId = typeof checkoutResult.donHang.id === 'string' 
          ? checkoutResult.donHang.id 
          : checkoutResult.donHang.id.toString();
      } else if (checkoutResult?.data?.donHang?._id) {
        orderId = typeof checkoutResult.data.donHang._id === 'string' 
          ? checkoutResult.data.donHang._id 
          : checkoutResult.data.donHang._id.toString();
      } else if (checkoutResult?.data?.donHang?.id) {
        orderId = typeof checkoutResult.data.donHang.id === 'string' 
          ? checkoutResult.data.donHang.id 
          : checkoutResult.data.donHang.id.toString();
      } else if (checkoutResult?._id) {
        orderId = typeof checkoutResult._id === 'string' 
          ? checkoutResult._id 
          : checkoutResult._id.toString();
      } else if (checkoutResult?.donHang) {
        // Nếu donHang là object trực tiếp
        const donHang = checkoutResult.donHang;
        orderId = donHang._id?.toString() || donHang.id?.toString() || null;
      }

      console.log('Order ID extracted:', orderId, 'Type:', typeof orderId);
      console.log('Full checkout result structure:', JSON.stringify(checkoutResult, null, 2));

      if (!orderId || orderId === 'null' || orderId === 'undefined') {
        console.error('Failed to extract order ID. Full result:', checkoutResult);
        toast.error('Không thể lấy ID đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
        setPaymentStatus('fail');
        setIsSubmitting(false);
        return;
      }

      // Nếu là COD, hoàn tất luôn
      if (selectedPaymentMethod === 'COD') {
        toast.success('Đặt hàng thành công');
        storage.setCart([]);
        window.dispatchEvent(new CustomEvent('cart:updated'));
        setPaymentStatus('success');
        return;
      }

      // Nếu là VNPay hoặc VNPayQR, tạo payment
      if (selectedPaymentMethod === 'VNPay' || selectedPaymentMethod === 'VNPayQR') {
        try {
          // Đảm bảo orderId và amount là hợp lệ
          if (!orderId || !total || total <= 0) {
            throw new Error(`Invalid payment data: orderId=${orderId}, amount=${total}`);
          }

          if (import.meta.env.DEV) {
            console.log('Creating payment with:', { orderId, amount: total, method: selectedPaymentMethod });
          }

          if (selectedPaymentMethod === 'VNPayQR') {
            // Tạo QR code
            const qrResult: any = await cartService.createVNPayQR({
              orderId: orderId,
              amount: total,
              orderDescription: `Thanh toan don hang ${orderId}`
            });
            if (import.meta.env.DEV) {
              console.log('QR Result:', qrResult);
            }
            const qrData = qrResult?.data || qrResult;
            if (!qrData?.qrCode && !qrData?.paymentUrl) {
              throw new Error('VNPay QR response không hợp lệ');
            }
            setVnpayQRCode(qrData.qrCode || '');
            setVnpayPaymentUrl(qrData.paymentUrl || '');
            toast.info('Quét QR code để thanh toán');
          } else {
            // Tạo payment URL và redirect
            const paymentResult: any = await cartService.createVNPayUrl({
              orderId: orderId,
              amount: total,
              orderDescription: `Thanh toan don hang ${orderId}`
            });
            if (import.meta.env.DEV) {
              console.log('Payment URL Result:', paymentResult);
            }
            const paymentData = paymentResult?.data || paymentResult;
            if (!paymentData?.paymentUrl) {
              throw new Error('Không nhận được paymentUrl từ VNPay');
            }
            setVnpayPaymentUrl(paymentData.paymentUrl);
            // Redirect đến VNPay
            window.location.href = paymentData.paymentUrl;
            return;
          }
        } catch (paymentError: any) {
          if (import.meta.env.DEV) {
            console.error('Lỗi khi tạo payment:', paymentError);
          }
          const errorMsg = paymentError?.message || paymentError?.data?.message || 'Không thể tạo thanh toán. Vui lòng thử lại.';
          toast.error(errorMsg);
          setPaymentStatus('fail');
          setIsSubmitting(false);
          return;
        }
      }

      // Các phương thức thanh toán khác (BANK, CARD)
      if (selectedPaymentMethod === 'BANK' || selectedPaymentMethod === 'CARD') {
        toast.success('Đặt hàng thành công. Vui lòng thanh toán theo hướng dẫn.');
        storage.setCart([]);
        window.dispatchEvent(new CustomEvent('cart:updated'));
        setPaymentStatus('success');
      }
    } catch (e: any) {
      console.error('Checkout error:', e);
      toast.error(e?.message || 'Không thể đặt hàng');
      setPaymentStatus('fail');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (paymentStatus === 'success') {
    return (
      <MainLayout>
        <PaymentSuccess />
      </MainLayout>
    );
  }
  if (paymentStatus === 'fail') {
    return (
      <MainLayout>
        <PaymentFail />
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Địa chỉ giao hàng
                  </h2>
                </div>
                <div className="space-y-4">
                  {addresses.length > 0 && !showNewAddress && (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                          <input
                            type="radio"
                            name="address"
                            className="mt-1"
                            checked={selectedAddressId === addr._id}
                            onChange={() => setSelectedAddressId(addr._id || null)}
                          />
                          <div className="text-sm">
                            <p className="font-semibold text-foreground">{addr.HoTen} · {addr.SoDienThoai}</p>
                            <p className="text-foreground">{addr.DiaChiChiTiet}</p>
                            <p className="text-muted-foreground">
                              {[addr.PhuongXa, addr.QuanHuyen, addr.TinhThanh].filter(Boolean).join(', ')}
                            </p>
                            {addr.MacDinh && (
                              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">Mặc định</span>
                            )}
                          </div>
                        </label>
                      ))}
                      <Button variant="outline" className="border-border" onClick={() => setShowNewAddress(true)}>
                        Thêm địa chỉ mới
                      </Button>
                    </div>
                  )}

                  {(addresses.length === 0 || showNewAddress) && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Họ và tên</Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.HoTen} onChange={(e) => setNewAddress({ ...newAddress, HoTen: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Số điện thoại</Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.SoDienThoai} onChange={(e) => setNewAddress({ ...newAddress, SoDienThoai: e.target.value })} required />
                        </div>
                      </div>
                      <div>
                        <Label>Địa chỉ chi tiết</Label>
                        <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.DiaChiChiTiet} onChange={(e) => setNewAddress({ ...newAddress, DiaChiChiTiet: e.target.value })} required />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Tỉnh/Thành phố</Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.TinhThanh} onChange={(e) => setNewAddress({ ...newAddress, TinhThanh: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Quận/Huyện</Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.QuanHuyen} onChange={(e) => setNewAddress({ ...newAddress, QuanHuyen: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Phường/Xã</Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.PhuongXa} onChange={(e) => setNewAddress({ ...newAddress, PhuongXa: e.target.value })} required />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input type="checkbox" checked={newAddress.MacDinh} onChange={(e) => setNewAddress({ ...newAddress, MacDinh: e.target.checked })} />
                          Đặt làm địa chỉ mặc định
                        </label>
                        <div className="space-x-2">
                          {addresses.length > 0 && (
                            <Button variant="outline" className="border-border" onClick={() => setShowNewAddress(false)}>Hủy</Button>
                          )}
                          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={saveNewAddress}>Lưu địa chỉ</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Phương thức thanh toán
                  </h2>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-primary rounded-xl cursor-pointer bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'COD'}
                      onChange={() => setSelectedPaymentMethod('COD')}
                    />
                    <span className="font-semibold text-foreground">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'VNPay'}
                      onChange={() => setSelectedPaymentMethod('VNPay')}
                    />
                    <span className="font-semibold text-foreground">
                      💳 VNPay (Thẻ tín dụng/Ghi nợ)
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'VNPayQR'}
                      onChange={() => setSelectedPaymentMethod('VNPayQR')}
                    />
                    <span className="font-semibold text-foreground">
                      📱 VNPay QR Code
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'BANK'}
                      onChange={() => setSelectedPaymentMethod('BANK')}
                    />
                    <span className="font-semibold text-foreground">
                      Chuyển khoản ngân hàng
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'CARD'}
                      onChange={() => setSelectedPaymentMethod('CARD')}
                    />
                    <span className="font-semibold text-foreground">
                      Thẻ tín dụng/Ghi nợ (Khác)
                    </span>
                  </label>
                  <div>
                    <Label>Ghi chú</Label>
                    <Input
                      placeholder="Ghi chú cho đơn hàng (tuỳ chọn)"
                      className="bg-background border-input h-12 rounded-xl px-4"
                      value={selectedNote}
                      onChange={(e) => setSelectedNote(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VNPay QR Code Display */}
            {vnpayQRCode && selectedPaymentMethod === 'VNPayQR' && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold text-foreground">Quét mã QR để thanh toán</h3>
                    <div className="flex justify-center">
                      <img 
                        src={vnpayQRCode} 
                        alt="VNPay QR Code" 
                        className="w-64 h-64 border-2 border-border rounded-lg p-2 bg-white"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sử dụng ứng dụng ngân hàng để quét mã QR và thanh toán
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (vnpayPaymentUrl) {
                          window.open(vnpayPaymentUrl, '_blank');
                        }
                      }}
                    >
                      Mở trang thanh toán
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setVnpayQRCode('');
                        setVnpayPaymentUrl('');
                        setPaymentStatus('idle');
                      }}
                    >
                      Hủy thanh toán
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Đơn hàng của bạn
                </h2>
                {/* Voucher */}
                <div className="mb-6">
                  <Label>Mã giảm giá</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nhập mã (vd: GIAM10, GIAM20, FREESHIP)"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="bg-background border-input h-12 rounded-xl px-4"
                    />
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={applyVoucher}>Áp dụng</Button>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const unit = Number(item.gia) || 0;
                    const discount = Number(item.giamGia) || 0;
                    const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.tenSP} x{item.quantity}
                        </span>
                        <span className="font-semibold text-foreground">
                          {(finalUnit * (item.quantity || 0)).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-foreground mb-2">
                      <span>Tạm tính</span>
                      <span className="font-semibold">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {voucherDiscountPct > 0 && (
                      <div className="flex justify-between text-foreground mb-2">
                        <span>Giảm giá ({voucherDiscountPct}%)</span>
                        <span className="font-semibold text-green-600">- {voucherDiscountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between text-foreground mb-4">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Tổng cộng</span>
                      <span className="text-primary">
                        {total.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg"
                  onClick={checkOut}
                  disabled={isSubmitting || (paymentStatus === 'processing' && selectedPaymentMethod === 'VNPayQR')}
                >
                  {isSubmitting 
                    ? (selectedPaymentMethod === 'VNPay' || selectedPaymentMethod === 'VNPayQR' 
                        ? 'Đang xử lý thanh toán...' 
                        : 'Đang xử lý...')
                    : 'Đặt hàng'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Bằng việc đặt hàng, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

