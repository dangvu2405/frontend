import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { storage, type CartItem } from '@/utils/storage';
import { cartService } from '@/services/cartService';
import { useAuth } from '@/contexts/AuthContext';
export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setCartItems(storage.getCart());
  }, []);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, p) => {
      const unit = Number(p.gia) || 0;
      const discount = Number(p.giamGia) || 0;
      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      return sum + finalUnit * (p.quantity || 0);
    }, 0);
  }, [cartItems]);

  const shipping = 0;
  const total = subtotal + shipping;

  const handleIncrease = (id: string) => {
    const current = storage.getCart();
    const found = current.find((c) => c.id === id);
    const next = storage.updateCartItemQuantity(id, (found?.quantity || 0) + 1);
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleDecrease = (id: string) => {
    const current = storage.getCart();
    const found = current.find((c) => c.id === id);
    const newQty = Math.max(0, (found?.quantity || 0) - 1);
    const next = storage.updateCartItemQuantity(id, newQty);
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleRemove = (id: string) => {
    const next = storage.removeCartItem(id);
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };
  const getCart = async () => {
    try {
      const res = await cartService.getCart();
      // Backend trả về { message, cart } hoặc { data: { cart } }
      const cartData = (res as any)?.data?.cart || (res as any)?.cart || [];
      if (Array.isArray(cartData) && cartData.length > 0) {
        // Nếu cart là array, map sang format CartItem
        const mappedItems = cartData.map((item: any) => ({
          id: item.MaSanPham?._id || item.MaSanPham || item.id,
          tenSP: item.MaSanPham?.TenSanPham || item.tenSP || 'Sản phẩm',
          gia: item.MaSanPham?.Gia || item.gia || 0,
          giamGia: item.MaSanPham?.KhuyenMai || item.giamGia || 0,
          hinhAnh: item.MaSanPham?.HinhAnhChinh || item.hinhAnh || '',
          loaiSP: item.MaSanPham?.MaLoaiSanPham?.TenLoaiSanPham || item.loaiSP || '',
          quantity: item.quantity || 1,
        }));
        setCartItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Fallback to localStorage cart
      setCartItems(storage.getCart());
    }
  };
  useEffect(() => {
    if(isAuthenticated) {
      getCart();
    }
  }, [isAuthenticated]);
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Giỏ hàng</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-muted-foreground mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.hinhAnh || 'https://placehold.co/100x100/E5E5EA/000?text=No+Image'}
                        alt={item.tenSP}
                        className="w-24 h-24 rounded-lg object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/100x100/E5E5EA/000?text=No+Image';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">{item.loaiSP || 'Nước hoa'}</p>
                        <h3 className="font-bold text-foreground mb-2">{item.tenSP}</h3>
                        <p className="text-primary font-bold">
                          {(() => {
                            const unit = Number(item.gia) || 0;
                            const discount = Number(item.giamGia) || 0;
                            const finalUnit = discount > 0 ? Math.round(unit * (discount ? (1 - discount / 100) : 1)) : unit;
                            return finalUnit.toLocaleString('vi-VN') + 'đ';
                          })()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border"
                            onClick={() => handleDecrease(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border"
                            onClick={() => handleIncrease(item.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Tóm tắt đơn hàng
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-foreground">
                      <span>Tạm tính</span>
                      <span className="font-semibold">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between text-lg font-bold text-foreground">
                        <span>Tổng cộng</span>
                        <span className="text-primary">
                          {total.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to="/checkout">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                      Tiến hành thanh toán
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button variant="outline" className="w-full mt-3 border-border">
                      Tiếp tục mua sắm
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

