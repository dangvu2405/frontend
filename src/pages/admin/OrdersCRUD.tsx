import { useEffect, useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import adminService from "@/services/adminService"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner"
import { Eye, Ban, Edit, Search, Filter, CheckSquare, Square } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Order = {
  _id: string
  MaDonHang: string
  IdKhachHang: {
    _id: string
    HoTen: string
    Email: string
    SoDienThoai?: string
  } | null
  TongTien: number
  TrangThai: string
  PhuongThucThanhToan: string
  DiaChi?: string
  PhiVanChuyen?: number
  GhiChu?: string
  createdAt: string
  updatedAt?: string
  SanPham: Array<{
    MaSanPham?: string
    TenSanPham?: string
    SoLuong?: number
    GiaTaiThoiDiemDat?: number
    Gia?: number
  }>
}

type ChartItem = {
  name: string
  count?: number
  revenue?: number
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-500" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-500" },
  shipping: { label: "Đang giao", color: "bg-cyan-500" },
  delivered: { label: "Hoàn thành", color: "bg-green-500" },
  cancelled: { label: "Đã hủy", color: "bg-red-500" },
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [statusChart, setStatusChart] = useState<ChartItem[]>([])
  const [monthlyChart, setMonthlyChart] = useState<ChartItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // Dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    TrangThai: "",
    PhuongThucThanhToan: "",
    DiaChi: "",
    PhiVanChuyen: 0,
    GhiChu: "",
    TongTien: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Multi-select states
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [statusFilter, paymentMethodFilter, dateFilter, currentPage])
  
  // Reset selected orders when filter changes
  useEffect(() => {
    setSelectedOrders(new Set())
    setIsSelectMode(false)
  }, [statusFilter, paymentMethodFilter, dateFilter, searchQuery])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: pageSize,
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      
      if (paymentMethodFilter !== "all") {
        params.paymentMethod = paymentMethodFilter
      }
      
      if (dateFilter !== "all") {
        const now = new Date()
        const startDate = new Date()
        switch (dateFilter) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            params.startDate = startDate.toISOString()
            params.endDate = now.toISOString()
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            params.startDate = startDate.toISOString()
            params.endDate = now.toISOString()
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            params.startDate = startDate.toISOString()
            params.endDate = now.toISOString()
            break
        }
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      
      const ordersRes = await adminService.getOrders(params)
      const ordersData = (ordersRes as any)?.data ?? []
      const pagination = (ordersRes as any)?.pagination

      setOrders(ordersData)
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setTotal(pagination.total || 0)
      }
      
      // Chỉ update charts ở trang đầu tiên hoặc khi filter thay đổi
      // Tránh fetch 1000 orders mỗi lần chuyển trang
      if (currentPage === 1) {
        const allOrdersParams = { ...params, page: 1, limit: 1000 }
        const allOrdersRes = await adminService.getOrders(allOrdersParams)
        const allOrdersData = (allOrdersRes as any)?.data ?? []
        updateCharts(allOrdersData)
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      toast.error("Không thể tải dữ liệu đơn hàng")
    } finally {
      setLoading(false)
    }
  }
  
  // Filter orders locally by search query and other filters (if backend doesn't support them)
  const filteredOrders = orders.filter((order) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        order.MaDonHang?.toLowerCase().includes(query) ||
        order.IdKhachHang?.HoTen?.toLowerCase().includes(query) ||
        order.IdKhachHang?.Email?.toLowerCase().includes(query) ||
        order.IdKhachHang?.SoDienThoai?.includes(query)
      )
      if (!matchesSearch) return false
    }
    
    // Payment method filter (if backend doesn't support it)
    if (paymentMethodFilter !== "all" && order.PhuongThucThanhToan !== paymentMethodFilter) {
      return false
    }
    
    // Date filter (if backend doesn't support it)
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt)
      const now = new Date()
      let startDate = new Date()
      
      switch (dateFilter) {
        case "today":
          startDate.setHours(0, 0, 0, 0)
          if (orderDate < startDate || orderDate > now) return false
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          if (orderDate < startDate || orderDate > now) return false
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          if (orderDate < startDate || orderDate > now) return false
          break
      }
    }
    
    return true
  })

  const updateCharts = (ordersData: Order[]) => {
    // Chart theo status
    const statusMap = new Map<string, ChartItem>()
    ordersData.forEach((order) => {
      const status = order.TrangThai
      const statusLabel = STATUS_MAP[status]?.label || status
      
      if (!statusMap.has(statusLabel)) {
        statusMap.set(statusLabel, { name: statusLabel, count: 0, revenue: 0 })
      }
      const statusData = statusMap.get(statusLabel)!
      statusData.count! += 1
      statusData.revenue! += order.TongTien
    })
    setStatusChart(Array.from(statusMap.values()))

    // Chart theo tháng (6 tháng gần nhất)
    const monthlyData: ChartItem[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("vi-VN", { month: "short" })
      
      const monthOrders = ordersData.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === date.getMonth() && 
               orderDate.getFullYear() === date.getFullYear()
      })
      
      monthlyData.push({
        name: monthName,
        count: monthOrders.length,
        revenue: monthOrders.reduce((sum, o) => sum + o.TongTien, 0),
      })
    }
    setMonthlyChart(monthlyData)
  }

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailDialogOpen(true)
  }

  const openEditDialog = (order: Order) => {
    setEditingOrder(order)
    setFormData({
      TrangThai: order.TrangThai || "",
      PhuongThucThanhToan: order.PhuongThucThanhToan || "",
      DiaChi: order.DiaChi || "",
      PhiVanChuyen: order.PhiVanChuyen || 0,
      GhiChu: order.GhiChu || "",
      TongTien: order.TongTien || 0,
    })
    setIsEditDialogOpen(true)
  }

  const openCancelDialog = (order: Order) => {
    setCancellingOrder(order)
    setIsCancelDialogOpen(true)
  }

  const handleUpdateOrder = async () => {
    if (!editingOrder) return
    try {
      setSubmitting(true)
      await adminService.updateOrder(editingOrder._id, formData)
      toast.success("Cập nhật đơn hàng thành công")
      setIsEditDialogOpen(false)
      setCurrentPage(1)
      await fetchData()
      // Charts sẽ được update tự động vì currentPage = 1
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể cập nhật đơn hàng")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return

    try {
      await adminService.cancelOrder(cancellingOrder._id)
      toast.success("Hủy đơn hàng thành công")
      setIsCancelDialogOpen(false)
      setCurrentPage(1)
      await fetchData()
      // Charts sẽ được update tự động vì currentPage = 1
    } catch (err: any) {
      console.error("Error cancelling order:", err)
      toast.error(err?.response?.data?.message || "Không thể hủy đơn hàng")
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await adminService.updateOrder(orderId, { TrangThai: newStatus })
      toast.success("Cập nhật trạng thái thành công")
      // Chỉ reset về trang 1 nếu đang ở trang khác
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        // Nếu đang ở trang 1, chỉ refresh data
        await fetchData()
      }
    } catch (err: any) {
      console.error("Error updating order status:", err)
      toast.error(err?.response?.data?.message || "Không thể cập nhật trạng thái")
    }
  }
  
  const handleToggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order._id)))
    }
  }
  
  const handleToggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }
  
  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng")
      return
    }
    
    try {
      setSubmitting(true)
      const promises = Array.from(selectedOrders).map(orderId =>
        adminService.updateOrder(orderId, { TrangThai: newStatus })
      )
      
      await Promise.all(promises)
      toast.success(`Đã cập nhật trạng thái ${selectedOrders.size} đơn hàng thành công`)
      setSelectedOrders(new Set())
      setIsSelectMode(false)
      await fetchData()
    } catch (err: any) {
      console.error("Error bulk updating orders:", err)
      toast.error("Không thể cập nhật một số đơn hàng")
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleBulkCancel = async () => {
    if (selectedOrders.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng")
      return
    }
    
    try {
      setSubmitting(true)
      const promises = Array.from(selectedOrders).map(orderId =>
        adminService.cancelOrder(orderId)
      )
      
      await Promise.all(promises)
      toast.success(`Đã hủy ${selectedOrders.size} đơn hàng thành công`)
      setSelectedOrders(new Set())
      setIsSelectMode(false)
      await fetchData()
    } catch (err: any) {
      console.error("Error bulk cancelling orders:", err)
      toast.error("Không thể hủy một số đơn hàng")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_MAP[status] || { label: status, color: "bg-gray-500" }
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý đơn hàng của khách hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectMode ? "default" : "outline"}
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              if (isSelectMode) {
                setSelectedOrders(new Set())
              }
            }}
          >
            {isSelectMode ? (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Đã chọn: {selectedOrders.size}
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Chọn nhiều
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đơn, tên khách hàng, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm whitespace-nowrap">Trạng thái:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="shipping">Đang giao</SelectItem>
                <SelectItem value="delivered">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Thanh toán:</Label>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="COD">COD</SelectItem>
                <SelectItem value="VNPay">VNPay</SelectItem>
                <SelectItem value="MoMo">MoMo</SelectItem>
                <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Thời gian:</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="week">7 ngày qua</SelectItem>
                <SelectItem value="month">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters */}
          {(statusFilter !== "all" || paymentMethodFilter !== "all" || dateFilter !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all")
                setPaymentMethodFilter("all")
                setDateFilter("all")
                setSearchQuery("")
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
        
        {/* Bulk Actions */}
        {isSelectMode && selectedOrders.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm font-medium">
              Đã chọn {selectedOrders.size} đơn hàng:
            </span>
            <div className="flex gap-2">
              <Select onValueChange={handleBulkUpdateStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Thay đổi trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="shipping">Đang giao</SelectItem>
                  <SelectItem value="delivered">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkCancel}
                disabled={submitting}
              >
                <Ban className="mr-2 h-4 w-4" />
                Hủy đơn hàng
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={statusChart.map(item => ({
            name: item.name,
            sold: item.count || 0,
            revenue: item.revenue
          }))}
          loading={loading}
          title="Đơn hàng theo trạng thái"
          description="Phân bổ đơn hàng và doanh thu theo trạng thái"
        />
        <ChartAreaInteractive
          data={monthlyChart.map(item => ({
            name: item.name,
            sold: item.count || 0,
            revenue: item.revenue
          }))}
          loading={loading}
          title="Xu hướng 6 tháng"
          description="Số lượng đơn hàng và doanh thu theo tháng"
        />
      </div>

      {/* Orders Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {isSelectMode && (
                  <th className="px-4 py-3 text-center w-12">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleToggleSelectAll}
                    >
                      {selectedOrders.size === filteredOrders.length && filteredOrders.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium">Mã đơn</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Khách hàng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng tiền</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Thanh toán</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? "Không tìm thấy đơn hàng phù hợp" : "Chưa có đơn hàng nào"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    className={`border-b hover:bg-muted/50 ${selectedOrders.has(order._id) ? 'bg-primary/5' : ''}`}
                  >
                    {isSelectMode && (
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleToggleSelectOrder(order._id)}
                        >
                          {selectedOrders.has(order._id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-medium">{order.MaDonHang}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium">{order.IdKhachHang?.HoTen || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{order.IdKhachHang?.Email || ""}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {currencyFormatter.format(order.TongTien)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm capitalize">
                      {order.PhuongThucThanhToan || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Select
                        value={order.TrangThai}
                        onValueChange={(value) => handleUpdateStatus(order._id, value)}
                        disabled={order.TrangThai === "cancelled" || order.TrangThai === "delivered"}
                      >
                        <SelectTrigger className="w-[140px] mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_MAP).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDetailDialog(order)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(order)}
                          title="Sửa đơn hàng"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {order.TrangThai !== "cancelled" && order.TrangThai !== "delivered" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openCancelDialog(order)}
                            title="Hủy đơn hàng"
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} trong tổng số {total} đơn hàng
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(pageNum)
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.MaDonHang}</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn hàng
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div key="customer">
                  <p className="text-sm font-medium text-muted-foreground">Khách hàng</p>
                  <p className="text-lg font-semibold">{selectedOrder.IdKhachHang?.HoTen || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.IdKhachHang?.Email || ""}</p>
                  {selectedOrder.IdKhachHang?.SoDienThoai && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.IdKhachHang.SoDienThoai}</p>
                  )}
                </div>
                <div key="status">
                  <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.TrangThai)}</div>
                </div>
                <div key="payment">
                  <p className="text-sm font-medium text-muted-foreground">Phương thức thanh toán</p>
                  <p className="text-sm font-semibold capitalize">{selectedOrder.PhuongThucThanhToan || "N/A"}</p>
                </div>
                <div key="date">
                  <p className="text-sm font-medium text-muted-foreground">Ngày đặt</p>
                  <p className="text-sm font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                {selectedOrder.DiaChi && (
                  <div key="address" className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Địa chỉ giao hàng</p>
                    <p className="text-sm">{selectedOrder.DiaChi}</p>
                  </div>
                )}
                {selectedOrder.PhiVanChuyen !== undefined && (
                  <div key="shipping">
                    <p className="text-sm font-medium text-muted-foreground">Phí vận chuyển</p>
                    <p className="text-sm font-semibold">
                      {currencyFormatter.format(selectedOrder.PhiVanChuyen)}
                    </p>
                  </div>
                )}
                <div key="total">
                  <p className="text-sm font-medium text-muted-foreground">Tổng tiền</p>
                  <p className="text-lg font-bold text-primary">
                    {currencyFormatter.format(selectedOrder.TongTien)}
                  </p>
                </div>
                {selectedOrder.GhiChu && (
                  <div key="note" className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
                    <p className="text-sm">{selectedOrder.GhiChu}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Sản phẩm</p>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Tên sản phẩm</th>
                        <th className="px-4 py-2 text-center text-sm">Số lượng</th>
                        <th className="px-4 py-2 text-right text-sm">Đơn giá</th>
                        <th className="px-4 py-2 text-right text-sm">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.SanPham?.map((item, idx) => {
                        const price = item.GiaTaiThoiDiemDat || item.Gia || 0
                        const quantity = item.SoLuong || 0
                        return (
                          <tr key={`${selectedOrder._id}-${item.MaSanPham || idx}-${idx}`} className="border-b">
                            <td className="px-4 py-2 text-sm">{item.TenSanPham || "N/A"}</td>
                            <td className="px-4 py-2 text-center text-sm">{quantity}</td>
                            <td className="px-4 py-2 text-right text-sm">
                              {currencyFormatter.format(price)}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-medium">
                              {currencyFormatter.format(price * quantity)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="border-t bg-muted/50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm font-bold">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-bold">
                          {currencyFormatter.format(selectedOrder.TongTien)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa đơn hàng #{editingOrder?.MaDonHang}</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin đơn hàng
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="TrangThai">Trạng thái</Label>
                  <Select
                    value={formData.TrangThai}
                    onValueChange={(value) => setFormData({ ...formData, TrangThai: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_MAP).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="PhuongThucThanhToan">Phương thức thanh toán</Label>
                  <Select
                    value={formData.PhuongThucThanhToan}
                    onValueChange={(value) => setFormData({ ...formData, PhuongThucThanhToan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COD">COD</SelectItem>
                      <SelectItem value="VNPay">VNPay</SelectItem>
                      <SelectItem value="MoMo">MoMo</SelectItem>
                      <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="DiaChi">Địa chỉ giao hàng</Label>
                  <Input
                    id="DiaChi"
                    value={formData.DiaChi}
                    onChange={(e) => setFormData({ ...formData, DiaChi: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="PhiVanChuyen">Phí vận chuyển (VND)</Label>
                  <Input
                    id="PhiVanChuyen"
                    type="number"
                    value={formData.PhiVanChuyen}
                    onChange={(e) => setFormData({ ...formData, PhiVanChuyen: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="TongTien">Tổng tiền (VND)</Label>
                  <Input
                    id="TongTien"
                    type="number"
                    value={formData.TongTien}
                    onChange={(e) => setFormData({ ...formData, TongTien: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="GhiChu">Ghi chú</Label>
                  <Input
                    id="GhiChu"
                    value={formData.GhiChu}
                    onChange={(e) => setFormData({ ...formData, GhiChu: e.target.value })}
                    placeholder="Ghi chú đơn hàng..."
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateOrder} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng #{cancellingOrder?.MaDonHang}? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground">
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

