import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { productsService, type Product } from '@/services/productsService';
import adminService from '@/services/adminService';
import { toast } from 'sonner';
import { storage, type CartItem } from '@/utils/storage';

const ProductsGrid = lazy(async () => {
  const module = await import('@/components/products');
  return { default: module.ProductsGrid };
});

// Parse Cloudinary connection string và tạo base URL
const parseCloudinaryUrl = (connectionString: string): string => {
  // Format: icloudinary://{api_key}:{api_secret}@{cloud_name}
  const match = connectionString.match(/@([^@]+)$/);
  if (match && match[1]) {
    const cloudName = match[1];
    return `https://res.cloudinary.com/${cloudName}/image/upload`;
  }
  return '';
};

// Lấy Cloudinary URL từ connection string hoặc env
const cloudinaryConnectionString = import.meta.env.VITE_CLOUDINARY_URL || 'icloudinary://686864971786299:e2HY_MPTM8XR4vlUDKqmVySC3Rk@dbiabh88k';
const imageUrl = cloudinaryConnectionString.startsWith('https://')
  ? cloudinaryConnectionString
  : parseCloudinaryUrl(cloudinaryConnectionString);

// Helper function để lấy URL ảnh từ Cloudinary
// Database trả về: ZmfIxdkQ0gc.jpg
// Cloudinary Public ID: products/ZmfIxdkQ0gc
// URL: https://res.cloudinary.com/dbiabh88k/image/upload/products/ZmfIxdkQ0gc
const getCloudinaryImageUrl = (imageName: string): string => {
  // Nếu đã là full URL, trả về trực tiếp
  if (imageName && (imageName.startsWith('http://') || imageName.startsWith('https://'))) {
    return imageName;
  }
  
  // Luôn ghép base URL với tên ảnh từ database
  if (imageUrl) {
    if (!imageName) {
      // Nếu không có tên ảnh, vẫn trả về base URL
      return imageUrl;
    }
    
    // Loại bỏ leading slash nếu có
    let cleanImageName = imageName.startsWith('/') ? imageName.slice(1) : imageName;
    
    // Loại bỏ extension (.jpg, .png, etc.) vì Cloudinary Public ID không cần extension
    cleanImageName = cleanImageName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
    
    // Kiểm tra xem đã có prefix 'products/' chưa
    // Nếu chưa có, thêm prefix 'products/'
    if (!cleanImageName.startsWith('products/')) {
      cleanImageName = `products/${cleanImageName}`;
    }
    
    // Ghép với base URL: https://res.cloudinary.com/dbiabh88k/image/upload/products/ZmfIxdkQ0gc
    return `${imageUrl}/${cleanImageName}`;
  }
  
  // Nếu không có imageUrl, trả về tên ảnh gốc (fallback)
  return imageName || '';
};

type Category = {
  _id: string;
  TenLoaiSanPham: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;
  const deferredQuery = useDeferredValue(query);
  
  // Filter states
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<string>('all');
  const [discountFilter, setDiscountFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminService.getCategories();
        const categoriesData = (response as any)?.data || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const result = await productsService.getAllProducts({
          page: currentPage,
          limit: productsPerPage
        });
        
        if (!isMounted) return;

        const apiProducts = result.products || [];
        const pagination = result.pagination;

        const normalized: Product[] = apiProducts.map((raw: any, index: number) => {
          let discountPercent = 0;
          if (raw.KhuyenMai > 0) {
            discountPercent = Number(raw.KhuyenMai);
          } else if (raw.GiaKhuyenMai && raw.Gia && raw.GiaKhuyenMai < raw.Gia) {
            discountPercent = Math.round(((Number(raw.Gia) - Number(raw.GiaKhuyenMai)) / Number(raw.Gia)) * 100);
          }

          // Hình ảnh chính - lấy từ Cloudinary dựa trên tên ảnh trong database
          const hinhAnhChinh = getCloudinaryImageUrl(raw.HinhAnhChinh);
          
          // Hình ảnh phụ - lấy từ Cloudinary dựa trên tên ảnh trong database
          const hinhAnhPhu = Array.isArray(raw.HinhAnhPhu) 
            ? raw.HinhAnhPhu.map((img: string) => getCloudinaryImageUrl(img))
            : [];

          return {
            id: raw._id || raw.id || `product-${index}`,
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
          } as Product;
        });

        setProducts(normalized);
        
        if (pagination) {
          setTotalPages(pagination.totalPages);
          setTotalProducts(pagination.total);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error('❌ Error fetching products:', error);
        toast.error(error?.message || 'Không thể tải sản phẩm');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filtered = useMemo(
    () => {
      let result = products;

      // Search filter
      if (deferredQuery) {
        result = result.filter((p) =>
          (p.tenSP || '').toLowerCase().includes(deferredQuery.toLowerCase()) ||
            (p.mota || '').toLowerCase().includes(deferredQuery.toLowerCase())
        );
      }

      // Category filter
      if (selectedCategories.size > 0) {
        result = result.filter((p) => {
          const categoryNames = Array.from(selectedCategories);
          return categoryNames.some(catName => p.loaiSP === catName);
        });
      }

      // Price range filter
      if (priceRange !== 'all') {
        result = result.filter((p) => {
          const price = p.gia;
          switch (priceRange) {
            case 'under-1m':
              return price < 1000000;
            case '1m-2m':
              return price >= 1000000 && price < 2000000;
            case '2m-3m':
              return price >= 2000000 && price < 3000000;
            case '3m-5m':
              return price >= 3000000 && price < 5000000;
            case 'over-5m':
              return price >= 5000000;
            default:
              return true;
          }
        });
      }

      // Discount filter
      if (discountFilter !== 'all') {
        result = result.filter((p) => {
          switch (discountFilter) {
            case 'has-discount':
              return (p.giamGia || 0) > 0;
            case 'no-discount':
              return (p.giamGia || 0) === 0;
            default:
              return true;
          }
        });
      }

      // Stock filter
      if (stockFilter !== 'all') {
        result = result.filter((p) => {
          switch (stockFilter) {
            case 'in-stock':
              return p.soLuong > 0;
            case 'out-of-stock':
              return p.soLuong === 0;
            case 'low-stock':
              return p.soLuong > 0 && p.soLuong < 10;
            default:
              return true;
          }
        });
      }

      // Sort
      if (sortBy !== 'default') {
        result = [...result].sort((a, b) => {
          switch (sortBy) {
            case 'price-asc':
              return a.gia - b.gia;
            case 'price-desc':
              return b.gia - a.gia;
            case 'name-asc':
              return a.tenSP.localeCompare(b.tenSP);
            case 'name-desc':
              return b.tenSP.localeCompare(a.tenSP);
            case 'discount-desc':
              return (b.giamGia || 0) - (a.giamGia || 0);
            default:
              return 0;
          }
        });
      }

      return result;
    },
    [products, deferredQuery, selectedCategories, priceRange, discountFilter, stockFilter, sortBy]
  );

  const handleCategoryToggle = (categoryName: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setPriceRange('all');
    setDiscountFilter('all');
    setStockFilter('all');
    setSortBy('default');
    setQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategories.size > 0 || priceRange !== 'all' || discountFilter !== 'all' || stockFilter !== 'all' || sortBy !== 'default';

  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Sản phẩm</h1>
          <p className="text-lg text-muted-foreground">Khám phá bộ sưu tập nước hoa cao cấp chính hãng</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters || deferredQuery ? 'Kết quả tìm kiếm' : 'Tổng số sản phẩm'}
              </p>
              <p className="text-3xl font-bold text-primary">
                {hasActiveFilters || deferredQuery ? filtered.length : totalProducts}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-12 bg-muted border-input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp → Cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao → Thấp</SelectItem>
                  <SelectItem value="name-asc">Tên: A → Z</SelectItem>
                  <SelectItem value="name-desc">Tên: Z → A</SelectItem>
                  <SelectItem value="discount-desc">Giảm giá nhiều nhất</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
                <SheetTrigger asChild>
            <Button variant="outline" className="border-border">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Bộ lọc
                    {hasActiveFilters && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {[selectedCategories.size, priceRange !== 'all' ? 1 : 0, discountFilter !== 'all' ? 1 : 0, stockFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
                    <SheetDescription>
                      Lọc sản phẩm theo danh mục, giá, khuyến mãi và tồn kho
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-6">
                    {/* Categories */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Danh mục</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {categories.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>
                        ) : (
                          categories.map((category) => (
                            <div key={category._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category._id}`}
                                checked={selectedCategories.has(category.TenLoaiSanPham)}
                                onCheckedChange={() => handleCategoryToggle(category.TenLoaiSanPham)}
                              />
                              <Label
                                htmlFor={`category-${category._id}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {category.TenLoaiSanPham}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Khoảng giá</Label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khoảng giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="under-1m">Dưới 1 triệu</SelectItem>
                          <SelectItem value="1m-2m">1 - 2 triệu</SelectItem>
                          <SelectItem value="2m-3m">2 - 3 triệu</SelectItem>
                          <SelectItem value="3m-5m">3 - 5 triệu</SelectItem>
                          <SelectItem value="over-5m">Trên 5 triệu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Discount */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Khuyến mãi</Label>
                      <Select value={discountFilter} onValueChange={setDiscountFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khuyến mãi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="has-discount">Có khuyến mãi</SelectItem>
                          <SelectItem value="no-discount">Không khuyến mãi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stock */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Tồn kho</Label>
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tồn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="in-stock">Còn hàng</SelectItem>
                          <SelectItem value="low-stock">Sắp hết hàng</SelectItem>
                          <SelectItem value="out-of-stock">Hết hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Xóa tất cả bộ lọc
            </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 rounded-3xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <ProductsGrid
              products={filtered}
              loading={loading}
              emptyMessage="Không có sản phẩm nào"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              onAddToCart={handleAddToCart}
              showPagination={!deferredQuery}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: handlePageChange
              }}
            />
          </Suspense>
        </div>
      </section>
    </MainLayout>
  );
}

