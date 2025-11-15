import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, HeadphonesIcon } from 'lucide-react';
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { productsService, type Product } from '@/services/productsService';
import { toast } from 'sonner';
import { storage, type CartItem } from '@/utils/storage';
const ProductsGrid = lazy(async () => {
  const module = await import('@/components/products');
  return { default: module.ProductsGrid };
});

const FEATURE_CARDS = [
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: 'Hàng chính hãng',
    description: '100% sản phẩm chính hãng, có tem chống giả',
  },
  {
    icon: <Truck className="w-8 h-8" />,
    title: 'Giao hàng nhanh',
    description: 'Giao hàng toàn quốc trong 2-3 ngày',
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Chất lượng cao',
    description: 'Sản phẩm cao cấp từ các thương hiệu hàng đầu',
  },
  {
    icon: <HeadphonesIcon className="w-8 h-8" />,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ tư vấn nhiệt tình, chuyên nghiệp',
  },
];


export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPlayHero, setCanPlayHero] = useState(false);

  const handleAddToCart = useCallback((product: Product) => {
    const item: CartItem = {
      id: product.id,
      tenSP: product.tenSP,
      gia: product.gia,
      giamGia: product.giamGia,
      hinhAnh: product.hinhAnhChinh || product.hinhAnh,
      loaiSP: product.loaiSP,
      quantity: 1,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  useEffect(() => {
    let isMounted = true; // Flag để track component mounted
    const frame = requestAnimationFrame(() => setCanPlayHero(true));

    const fetchProducts = async () => {
      try {
        const result = await productsService.getAllProducts({ limit: 8 });
        
        // Chỉ update state nếu component vẫn còn mounted
        if (isMounted) {
          const products = result.products || [];
          
          // Validate và normalize dữ liệu
          const validProducts = products.map((product, index) => {
            const p = product as any; // Cast để tránh lỗi TypeScript
            // Tính % giảm giá
            let discountPercent = 0;
            if (p.KhuyenMai > 0) {
              // Nếu có field KhuyenMai (%) → dùng luôn
              discountPercent = Number(p.KhuyenMai);
            } else if (p.GiaKhuyenMai && p.Gia && p.GiaKhuyenMai < p.Gia) {
              // Nếu có GiaKhuyenMai (giá sau giảm) → tính %
              discountPercent = Math.round(((p.Gia - p.GiaKhuyenMai) / p.Gia) * 100);
            }
            return {
              // ID từ MongoDB _id
              id: p._id || p.id || `product-${index}`,
              
              // Tên sản phẩm
              tenSP: p.TenSanPham || 'Sản phẩm',
              
              // Mô tả
              mota: p.MoTa || 'Sản phẩm chính hãng cao cấp',
              
              // Giá gốc
              gia: Number(p.Gia || 0),
              
              // % Khuyến mãi
              giamGia: discountPercent,
              
              // Số lượng tồn
              soLuong: Number(p.SoLuong || 0),
              
              // Đã bán
              daBan: Number(p.DaBan || 0),
              
              // Hình ảnh chính
              hinhAnhChinh: p.HinhAnhChinh 
                ? (p.HinhAnhChinh.startsWith('http') ? p.HinhAnhChinh : `/${p.HinhAnhChinh}`)
                : 'https://placehold.co/300x300/E5E5EA/000?text=No+Image',
              
              // Hình ảnh phụ
              hinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
                ? p.HinhAnhPhu.map((img: string) => 
                    img.startsWith('http') ? img : `/${img}`
                  )
                : [],
              
              // Deprecated: giữ lại để tương thích
              hinhAnh: p.HinhAnhChinh 
                ? (p.HinhAnhChinh.startsWith('http') ? p.HinhAnhChinh : `/${p.HinhAnhChinh}`)
                : 'https://placehold.co/300x300/E5E5EA/000?text=No+Image',
              
              // Loại sản phẩm
              loaiSP: p.MaLoaiSanPham?.TenLoaiSanPham || 'Nước hoa',
            } as Product;
          });
          
          // Lấy 8 sản phẩm đầu tiên để hiển thị
          setFeaturedProducts(validProducts.slice(0, 8));
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching products:', error);
          toast.error('Không thể tải sản phẩm');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    // Cleanup function
    return () => {
      isMounted = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Nước hoa
                <span className="text-primary"> cao cấp</span>
                <br />
                Chính hãng 100%
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Khám phá bộ sưu tập nước hoa cao cấp từ các thương hiệu hàng đầu thế giới.
                Mang đến hương thơm quyến rũ, đẳng cấp.
              </p>
              <div className="flex space-x-4">
                <Link to="/products">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
                    Khám phá ngay
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" className="text-lg px-8 py-6">
                    Tìm hiểu thêm
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 rounded-3xl overflow-hidden shadow-2xl bg-muted">
                {canPlayHero ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="none"
                    poster="https://placehold.co/800x600/151515/ffffff?text=Perfume+Shop"
                    className="w-full h-full object-cover will-change-transform"
                    onLoadedData={(e) => {
                      // Video loaded, can start playing
                      (e.target as HTMLVideoElement).play().catch(() => {
                        // Auto-play failed, user interaction required
                      });
                    }}
                  >
                    <source src="/backgroud.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <div className="w-full h-full bg-muted animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {FEATURE_CARDS.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-muted transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Sản phẩm nổi bật</h2>
            <p className="text-lg text-muted-foreground">
              Những sản phẩm được yêu thích nhất tại Perfume Shop
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 rounded-3xl bg-background/50 animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <ProductsGrid
              products={featuredProducts}
              loading={loading}
              emptyMessage="Không có sản phẩm nào"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              onAddToCart={handleAddToCart}
            />
          </Suspense>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                Xem tất cả sản phẩm
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Đăng ký nhận ưu đãi đặc biệt
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Nhận ngay voucher giảm giá 20% cho đơn hàng đầu tiên
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="px-6 py-4 rounded-xl text-foreground bg-background flex-1 max-w-md"
            />
            <Button className="bg-background text-primary hover:bg-muted px-8 py-4 text-lg font-semibold">
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

