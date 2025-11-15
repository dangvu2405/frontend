import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { productsService, type Product } from '@/services/productsService';
import { storage, type CartItem } from '@/utils/storage';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  Minus,
  Plus
} from 'lucide-react';
import { ProductsGrid } from '@/components/products';
import { ProductReviews } from '@/components/ProductReviews';

const FALLBACK_IMAGE = 'https://placehold.co/600x600/E5E5EA/000?text=No+Image';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch product detail
  useEffect(() => {
    let isMounted = true;

    const fetchProductDetail = async () => {
      if (!id) {
        navigate('/products');
        return;
      }

      try {
        setLoading(true);
        const productData = await productsService.getProductById(id);
        
        if (!isMounted) return;

        if (!productData) {
          toast.error('Không tìm thấy sản phẩm');
          navigate('/products');
          return;
        }

        // Normalize data
        const raw = productData as any;
        let discountPercent = 0;
        if (raw.KhuyenMai > 0) {
          discountPercent = Number(raw.KhuyenMai);
        } else if (raw.GiaKhuyenMai && raw.Gia && raw.GiaKhuyenMai < raw.Gia) {
          discountPercent = Math.round(((Number(raw.Gia) - Number(raw.GiaKhuyenMai)) / Number(raw.Gia)) * 100);
        }

        const hinhAnhChinh = raw.HinhAnhChinh 
          ? (raw.HinhAnhChinh.startsWith('http') ? raw.HinhAnhChinh : `/${raw.HinhAnhChinh}`)
          : FALLBACK_IMAGE;
        
        const hinhAnhPhu = Array.isArray(raw.HinhAnhPhu) 
          ? raw.HinhAnhPhu.map((img: string) => 
              img.startsWith('http') ? img : `/${img}`
            )
          : [];

        const normalized: Product = {
          id: raw._id || raw.id,
          tenSP: raw.TenSanPham || 'Sản phẩm',
          mota: raw.MoTa || 'Sản phẩm chính hãng cao cấp',
          gia: Number(raw.Gia || 0),
          giamGia: discountPercent,
          soLuong: Number(raw.SoLuong || 0),
          daBan: Number(raw.DaBan || 0),
          hinhAnh: hinhAnhChinh, // Deprecated: giữ lại để tương thích
          hinhAnhChinh: hinhAnhChinh,
          hinhAnhPhu: hinhAnhPhu,
          loaiSP: raw.MaLoaiSanPham?.TenLoaiSanPham || 'Nước hoa',
        };

        setProduct(normalized);
        setSelectedImage(0); // Reset về ảnh đầu tiên khi load sản phẩm mới

        // Fetch related products (same category) - chỉ fetch theo category thay vì tất cả products
        try {
          const categoryProducts = await productsService.getProductsByCategory(normalized.loaiSP);
          const related = categoryProducts
            .filter((p: any) => {
              const pId = p._id || p.id;
              return pId !== id;
            })
            .slice(0, 4)
            .map((raw: any) => {
            const hinhAnhChinh = raw.HinhAnhChinh 
              ? (raw.HinhAnhChinh.startsWith('http') ? raw.HinhAnhChinh : `/${raw.HinhAnhChinh}`)
              : FALLBACK_IMAGE;
            
            const hinhAnhPhu = Array.isArray(raw.HinhAnhPhu) 
              ? raw.HinhAnhPhu.map((img: string) => 
                  img.startsWith('http') ? img : `/${img}`
                )
              : [];

            return {
            id: raw._id || raw.id,
            tenSP: raw.TenSanPham || 'Sản phẩm',
            mota: raw.MoTa || '',
            gia: Number(raw.Gia || 0),
            giamGia: raw.KhuyenMai || 0,
            soLuong: Number(raw.SoLuong || 0),
            daBan: Number(raw.DaBan || 0),
              hinhAnh: hinhAnhChinh, // Deprecated: giữ lại để tương thích
              hinhAnhChinh: hinhAnhChinh,
              hinhAnhPhu: hinhAnhPhu,
            loaiSP: raw.MaLoaiSanPham?.TenLoaiSanPham || 'Nước hoa',
            };
          });

          setRelatedProducts(related);
        } catch (relatedError) {
          // Nếu không lấy được related products, để mảng rỗng
          console.warn('Could not fetch related products:', relatedError);
          setRelatedProducts([]);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error('Error fetching product:', error);
        toast.error('Không thể tải thông tin sản phẩm');
        navigate('/products');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductDetail();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.soLuong || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const item: CartItem = {
      id: product.id,
      tenSP: product.tenSP,
      gia: product.gia,
      giamGia: product.giamGia,
      hinhAnh: product.hinhAnhChinh || product.hinhAnh,
      loaiSP: product.loaiSP,
      quantity: quantity,
    };

    storage.addCartItem(item, quantity);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
  }, [product, quantity]);

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleAddToCartRelated = useCallback((relatedProduct: Product) => {
    const item: CartItem = {
      id: relatedProduct.id,
      tenSP: relatedProduct.tenSP,
      gia: relatedProduct.gia,
      giamGia: relatedProduct.giamGia,
      hinhAnh: relatedProduct.hinhAnhChinh || relatedProduct.hinhAnh,
      loaiSP: relatedProduct.loaiSP,
      quantity: 1,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground mt-4">Đang tải sản phẩm...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return null;
  }

  const isSoldOut = product.soLuong <= 0;
  const discount = product.giamGia || 0;
  const price = product.gia;
  const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const savings = price - discountedPrice;

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <section className="bg-muted/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách sản phẩm</span>
          </button>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-border">
                {(() => {
                  // Tạo mảng tất cả ảnh: ảnh chính + ảnh phụ
                  const allImages = [
                    product.hinhAnhChinh || product.hinhAnh || FALLBACK_IMAGE,
                    ...(product.hinhAnhPhu || [])
                  ];
                  const currentImage = allImages[selectedImage] || allImages[0];
                  
                  return (
                    <img
                      src={currentImage}
                  alt={product.tenSP}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                  );
                })()}
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    -{discount}%
                  </div>
                )}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg font-bold text-lg">
                      HẾT HÀNG
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {(() => {
                // Tạo mảng tất cả ảnh: ảnh chính + ảnh phụ
                const allImages = [
                  product.hinhAnhChinh || product.hinhAnh || FALLBACK_IMAGE,
                  ...(product.hinhAnhPhu || [])
                ];
                
                // Chỉ hiển thị thumbnail nếu có nhiều hơn 1 ảnh
                if (allImages.length <= 1) return null;
                
                return (
              <div className="grid grid-cols-4 gap-2">
                    {allImages.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.tenSP} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
                );
              })()}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category */}
              <div>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                  {product.loaiSP}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-foreground">{product.tenSP}</h1>

              {/* Rating & Sold */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-500">★</span>
                    ))}
                  </div>
                  <span className="text-muted-foreground">(128 đánh giá)</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-muted-foreground">
                  Đã bán: <span className="font-semibold text-foreground">{product.daBan}</span>
                </span>
              </div>

              {/* Price */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-primary">
                        {discountedPrice.toLocaleString('vi-VN')}₫
                      </span>
                      {discount > 0 && (
                        <span className="text-xl text-muted-foreground line-through">
                          {price.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Tiết kiệm: <span className="font-semibold text-destructive">{savings.toLocaleString('vi-VN')}₫</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tình trạng:</p>
                {isSoldOut ? (
                  <span className="text-destructive font-semibold">Hết hàng</span>
                ) : product.soLuong <= 10 ? (
                  <span className="text-orange-500 font-semibold">
                    ⚠️ Chỉ còn {product.soLuong} sản phẩm
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold">
                    ✓ Còn hàng ({product.soLuong} sản phẩm)
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              {!isSoldOut && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Số lượng:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="h-12 w-12"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-16 text-center font-semibold text-lg">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.soLuong}
                        className="h-12 w-12"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.soLuong} sản phẩm có sẵn
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Thêm vào giỏ
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={isSoldOut}
                  className="flex-1 h-14 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  Mua ngay
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Miễn phí vận chuyển cho đơn hàng trên 500.000₫</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Cam kết 100% hàng chính hãng</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => navigate(`/products/${product.id}/trace`)}
              >
                Xem nguồn gốc & chứng nhận trên blockchain
              </Button>
            </div>
          </div>

          {/* Product Description */}
          <div className="mt-16">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Mô tả sản phẩm</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line">{product.mota}</p>
                  
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Thông tin chi tiết</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Danh mục:</span>
                        <span>{product.loaiSP}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Tình trạng:</span>
                        <span>{isSoldOut ? 'Hết hàng' : 'Còn hàng'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Đã bán:</span>
                        <span>{product.daBan} sản phẩm</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Mã sản phẩm:</span>
                        <span className="font-mono text-sm">{product.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Reviews */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Đánh giá sản phẩm</h2>
            <ProductReviews productId={id!} />
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Sản phẩm liên quan</h2>
              <ProductsGrid
                products={relatedProducts}
                loading={false}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                onAddToCart={handleAddToCartRelated}
              />
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

