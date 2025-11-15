
import { memo, useCallback } from "react"
import { type Product } from "@/services/productsService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type ProductsGridProps = {
  products: Product[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  showCategoryBadge?: boolean
  showSoldQuantity?: boolean
  showAddToCartButton?: boolean
  onAddToCart?: (product: Product) => void
  pagination?: PaginationProps
  showPagination?: boolean
}

const FALLBACK_IMAGE =
  "https://placehold.co/300x300/E5E5EA/000?text=No+Image"

// ProductCard component - tách ra ngoài để tránh vi phạm Rules of Hooks
type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showCategoryBadge: boolean;
  showSoldQuantity: boolean;
  showAddToCartButton: boolean;
  onProductClick: (productId: string) => void;
}

const ProductCard = memo(({ 
  product, 
  onAddToCart, 
  showCategoryBadge, 
  showSoldQuantity, 
  showAddToCartButton,
  onProductClick
}: ProductCardProps) => {
  const isSoldOut = Number(product.soLuong ?? 0) <= 0;
  const discount = Number(product.giamGia ?? 0);
  const price = Number(product.gia ?? 0);
  const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/20 bg-background cursor-pointer"
      onClick={() => onProductClick(product.id)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.hinhAnhChinh || product.hinhAnh || FALLBACK_IMAGE}
            alt={product.tenSP}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE
            }}
          />
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              -{discount}%
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-bold">
                HẾT HÀNG
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-sm font-medium line-clamp-2">
                {product.mota || "Sản phẩm chính hãng cao cấp"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            {showCategoryBadge ? (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                {product.loaiSP || "Nước hoa"}
              </span>
            ) : (
              <span />
            )}
            {showSoldQuantity && Number(product.daBan ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                Đã bán {Number(product.daBan ?? 0)}
              </span>
            )}
          </div>

          <h3 className="font-bold text-foreground text-lg mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
            {product.tenSP}
          </h3>

          <div className="mb-4 space-y-1">
            <p className="text-primary font-bold text-2xl">
              {discountedPrice.toLocaleString("vi-VN")}₫
            </p>
            {discount > 0 && (
              <p className="text-muted-foreground text-sm line-through">
                {price.toLocaleString("vi-VN")}₫
              </p>
            )}
          </div>

          {Number(product.soLuong ?? 0) > 0 &&
            Number(product.soLuong ?? 0) <= 10 && (
              <p className="text-xs text-destructive mb-3 font-medium">
                ⚠️ Chỉ còn {Number(product.soLuong ?? 0)} sản phẩm
              </p>
            )}

          {showAddToCartButton && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSoldOut || !onAddToCart}
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(product)
              }}
            >
              {isSoldOut ? "❌ Hết hàng" : "🛒 Thêm vào giỏ"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

function ProductsGridComponent({
  products,
  loading,
  emptyMessage = "Không có sản phẩm nào",
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
  showCategoryBadge = true,
  showSoldQuantity = true,
  showAddToCartButton = true,
  onAddToCart,
  pagination,
  showPagination = false,
}: ProductsGridProps) {
  // Tất cả hooks phải được gọi ở đầu component, trước các early returns
  const navigate = useNavigate()
  const handleProductClick = useCallback((productId: string) => {
    navigate(`/products/${productId}`);
  }, [navigate]);

  // Early returns sau khi hooks đã được gọi
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground mt-4">Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const renderPagination = () => {
    if (!showPagination || !pagination) return null

    const { currentPage, totalPages, onPageChange } = pagination
    const maxVisiblePages = 5
    
    // Tính toán range của pages hiển thị
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // Điều chỉnh nếu không đủ pages ở cuối
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

    return (
      <div className="flex justify-center items-center gap-2 mt-12">
        {/* Previous Button */}
        <Button
          variant="outline"
          className="border-border"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Trước
        </Button>

        {/* First Page */}
        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              className={currentPage === 1 ? "bg-primary text-primary-foreground" : "border-border"}
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-muted-foreground">...</span>}
          </>
        )}

        {/* Page Numbers */}
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className={
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "border-border"
            }
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {/* Last Page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-muted-foreground">...</span>}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              className={
                currentPage === totalPages
                  ? "bg-primary text-primary-foreground"
                  : "border-border"
              }
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          className="border-border"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau →
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={className}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            showCategoryBadge={showCategoryBadge}
            showSoldQuantity={showSoldQuantity}
            showAddToCartButton={showAddToCartButton}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
      
      {renderPagination()}
    </>
  )
}

export const ProductsGrid = memo(ProductsGridComponent)
ProductsGrid.displayName = "ProductsGrid"
