import { useEffect, useState } from "react"
import adminService from "@/services/adminService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Trash2, 
  Search, 
  Filter, 
  Star, 
  Eye,
  X,
  CheckSquare,
  Square,
  BarChart3,
  TrendingUp
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Review = {
  _id: string
  IdSanPham: {
    _id: string
    TenSanPham: string
    HinhAnhChinh?: string
    Gia?: number
  } | string | null
  IdKhachHang: {
    _id: string
    HoTen?: string
    Email?: string
    AvatarUrl?: string
  } | string | null
  NoiDung: string
  SoSao: number
  createdAt: string
  updatedAt: string
}

type ReviewStats = {
  summary: {
    totalReviews: number
    avgRating: number
    distribution: {
      star5: number
      star4: number
      star3: number
      star2: number
      star1: number
    }
  }
  topReviewedProducts: Array<{
    productId: string
    productName: string
    reviewCount: number
    avgRating: number
  }>
  monthlyStats: Array<{
    year: number
    month: number
    reviewCount: number
    avgRating: number
  }>
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}/5</span>
    </div>
  )
}

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Filter states
  const [productIdFilter, setProductIdFilter] = useState<string>("")
  const [customerIdFilter, setCustomerIdFilter] = useState<string>("")
  const [minRating, setMinRating] = useState<string>("")
  const [maxRating, setMaxRating] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  // Multi-select states
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Dialog states
  const [viewingReview, setViewingReview] = useState<Review | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingReview, setDeletingReview] = useState<Review | null>(null)

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [currentPage, sortBy, sortOrder, productIdFilter, customerIdFilter, minRating, maxRating])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      }

      if (productIdFilter.trim()) {
        params.productId = productIdFilter.trim()
      }
      if (customerIdFilter.trim()) {
        params.customerId = customerIdFilter.trim()
      }
      if (minRating) {
        params.minRating = parseInt(minRating)
      }
      if (maxRating) {
        params.maxRating = parseInt(maxRating)
      }

      const reviewsRes = await adminService.getReviews(params)
      const reviewsData = (reviewsRes as any)?.data ?? []
      const pagination = (reviewsRes as any)?.pagination

      setReviews(reviewsData)
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setTotal(pagination.total || 0)
      }
    } catch (err: any) {
      console.error("Error fetching reviews:", err)
      toast.error("Không thể tải danh sách đánh giá")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsRes = await adminService.getReviewStats()
      const statsData = (statsRes as any)?.data
      if (statsData) {
        setStats(statsData)
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleViewReview = (review: Review) => {
    setViewingReview(review)
    setIsViewDialogOpen(true)
  }

  const handleDeleteReview = (review: Review) => {
    setDeletingReview(review)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteReview = async () => {
    if (!deletingReview) return

    try {
      await adminService.deleteReview(deletingReview._id)
      toast.success("Xóa đánh giá thành công")
      setIsDeleteDialogOpen(false)
      setDeletingReview(null)
      fetchData()
      fetchStats()
    } catch (err: any) {
      console.error("Error deleting review:", err)
      toast.error("Không thể xóa đánh giá")
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedReviews.size === 0) {
      toast.error("Vui lòng chọn đánh giá cần xóa")
      return
    }

    try {
      await adminService.deleteMultipleReviews(Array.from(selectedReviews))
      toast.success(`Đã xóa ${selectedReviews.size} đánh giá thành công`)
      setSelectedReviews(new Set())
      setIsSelectMode(false)
      fetchData()
      fetchStats()
    } catch (err: any) {
      console.error("Error deleting multiple reviews:", err)
      toast.error("Không thể xóa đánh giá")
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set())
    } else {
      setSelectedReviews(new Set(reviews.map((review) => review._id)))
    }
  }

  const handleToggleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviews)
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId)
    } else {
      newSelected.add(reviewId)
    }
    setSelectedReviews(newSelected)
  }

  const clearFilters = () => {
    setProductIdFilter("")
    setCustomerIdFilter("")
    setMinRating("")
    setMaxRating("")
    setCurrentPage(1)
  }

  const getProductName = (product: Review["IdSanPham"]): string => {
    if (!product || typeof product === "string") return "N/A"
    return product.TenSanPham || "N/A"
  }

  const getCustomerName = (customer: Review["IdKhachHang"]): string => {
    if (!customer || typeof customer === "string") return "N/A"
    return customer.HoTen || customer.Email || "N/A"
  }

  const getCustomerEmail = (customer: Review["IdKhachHang"]): string => {
    if (!customer || typeof customer === "string") return ""
    return customer.Email || ""
  }

  const getProductImage = (product: Review["IdSanPham"]): string => {
    if (!product || typeof product === "string") return ""
    return product.HinhAnhChinh || ""
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đánh giá</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalReviews}</div>
              <p className="text-xs text-muted-foreground">Tổng số đánh giá</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.summary.avgRating.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(Math.round(stats.summary.avgRating))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 sao</CardTitle>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.distribution.star5}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalReviews > 0
                  ? Math.round(
                      (stats.summary.distribution.star5 / stats.summary.totalReviews) * 100
                    )
                  : 0}
                % tổng đánh giá
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">1 sao</CardTitle>
              <Star className="h-4 w-4 text-gray-400 fill-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.distribution.star1}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalReviews > 0
                  ? Math.round(
                      (stats.summary.distribution.star1 / stats.summary.totalReviews) * 100
                    )
                  : 0}
                % tổng đánh giá
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý đánh giá</CardTitle>
              <CardDescription>
                Quản lý và xem tất cả đánh giá của khách hàng
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSelectMode && selectedReviews.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMultiple}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa ({selectedReviews.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSelectMode(!isSelectMode)
                  if (isSelectMode) setSelectedReviews(new Set())
                }}
              >
                {isSelectMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Hủy chọn
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Chọn nhiều
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Mã sản phẩm</Label>
                  <Input
                    id="productId"
                    placeholder="Nhập mã sản phẩm"
                    value={productIdFilter}
                    onChange={(e) => setProductIdFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerId">Mã khách hàng</Label>
                  <Input
                    id="customerId"
                    placeholder="Nhập mã khách hàng"
                    value={customerIdFilter}
                    onChange={(e) => setCustomerIdFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minRating">Đánh giá tối thiểu</Label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả</SelectItem>
                      <SelectItem value="5">5 sao</SelectItem>
                      <SelectItem value="4">4 sao trở lên</SelectItem>
                      <SelectItem value="3">3 sao trở lên</SelectItem>
                      <SelectItem value="2">2 sao trở lên</SelectItem>
                      <SelectItem value="1">1 sao trở lên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRating">Đánh giá tối đa</Label>
                  <Select value={maxRating} onValueChange={setMaxRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả</SelectItem>
                      <SelectItem value="5">5 sao</SelectItem>
                      <SelectItem value="4">4 sao trở xuống</SelectItem>
                      <SelectItem value="3">3 sao trở xuống</SelectItem>
                      <SelectItem value="2">2 sao trở xuống</SelectItem>
                      <SelectItem value="1">1 sao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="mb-4 flex items-center gap-2">
            <Label>Sắp xếp theo:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Ngày tạo</SelectItem>
                <SelectItem value="SoSao">Đánh giá</SelectItem>
                <SelectItem value="updatedAt">Ngày cập nhật</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Tăng dần" : "↓ Giảm dần"}
            </Button>
          </div>

          {/* Reviews Table */}
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có đánh giá nào
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {isSelectMode && (
                        <th className="px-4 py-3 text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleSelectAll}
                          >
                            {selectedReviews.size === reviews.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Đánh giá
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Nội dung
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr
                        key={review._id}
                        className="border-t hover:bg-muted/50 transition-colors"
                      >
                        {isSelectMode && (
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleSelectReview(review._id)}
                            >
                              {selectedReviews.has(review._id) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {getProductImage(review.IdSanPham) && (
                              <img
                                src={getProductImage(review.IdSanPham)}
                                alt={getProductName(review.IdSanPham)}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">
                                {getProductName(review.IdSanPham)}
                              </div>
                              {(() => {
                                const product = review.IdSanPham;
                                return product &&
                                  typeof product !== "string" &&
                                  product.Gia !== undefined ? (
                                    <div className="text-xs text-muted-foreground">
                                      {currencyFormatter.format(product.Gia)}
                                    </div>
                                  ) : null;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">
                              {getCustomerName(review.IdKhachHang)}
                            </div>
                            {getCustomerEmail(review.IdKhachHang) && (
                              <div className="text-xs text-muted-foreground">
                                {getCustomerEmail(review.IdKhachHang)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {renderStars(review.SoSao)}
                            <Badge
                              variant={
                                review.SoSao >= 4
                                  ? "default"
                                  : review.SoSao >= 3
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {review.SoSao} sao
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate">{review.NoiDung}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReview(review)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReview(review)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              <div className="text-sm text-muted-foreground text-center">
                Hiển thị {reviews.length} / {total} đánh giá
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đánh giá</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đánh giá này</DialogDescription>
          </DialogHeader>
          {viewingReview && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Sản phẩm</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {getProductImage(viewingReview.IdSanPham) && (
                      <img
                        src={getProductImage(viewingReview.IdSanPham)}
                        alt={getProductName(viewingReview.IdSanPham)}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">
                        {getProductName(viewingReview.IdSanPham)}
                      </div>
                      {(() => {
                        const product = viewingReview.IdSanPham;
                        return product &&
                          typeof product !== "string" &&
                          product.Gia !== undefined ? (
                            <div className="text-sm text-muted-foreground">
                              {currencyFormatter.format(product.Gia)}
                            </div>
                          ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Khách hàng</Label>
                  <div className="mt-2">
                    <div className="font-medium">
                      {getCustomerName(viewingReview.IdKhachHang)}
                    </div>
                    {getCustomerEmail(viewingReview.IdKhachHang) && (
                      <div className="text-sm text-muted-foreground">
                        {getCustomerEmail(viewingReview.IdKhachHang)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label>Đánh giá</Label>
                <div className="mt-2">{renderStars(viewingReview.SoSao)}</div>
              </div>
              <div>
                <Label>Nội dung đánh giá</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  {viewingReview.NoiDung}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Ngày tạo</Label>
                  <div className="mt-2 text-sm">{formatDate(viewingReview.createdAt)}</div>
                </div>
                <div>
                  <Label>Ngày cập nhật</Label>
                  <div className="mt-2 text-sm">{formatDate(viewingReview.updatedAt)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (viewingReview) {
                  setIsViewDialogOpen(false)
                  handleDeleteReview(viewingReview)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa đánh giá
            </Button>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingReview(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReview} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
