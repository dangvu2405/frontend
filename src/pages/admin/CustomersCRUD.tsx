import { useEffect, useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import adminService from "@/services/adminService"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Eye, Mail, Phone, Edit, Trash2, Lock, Unlock, UserCog, Search, Filter } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Customer = {
  _id: string
  HoTen: string
  Email: string
  SoDienThoai?: string
  GioiTinh?: string
  NgaySinh?: string
  TrangThai: string
  MaVaiTro?: string | { _id: string; TenVaiTro: string }
  createdAt: string
  orderCount?: number
  totalRevenue?: number
}

type Role = {
  _id: string
  TenVaiTro: string
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

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [topCustomersChart, setTopCustomersChart] = useState<ChartItem[]>([])
  const [statusChart, setStatusChart] = useState<ChartItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [lockingCustomer, setLockingCustomer] = useState<Customer | null>(null)
  const [changingRoleCustomer, setChangingRoleCustomer] = useState<Customer | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    hoten: "",
    email: "",
    sdt: "",
    gioiTinh: "",
    ngaySinh: "",
  })
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [currentPage, statusFilter])
  
  // Filter customers locally by search query
  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        customer.HoTen?.toLowerCase().includes(query) ||
        customer.Email?.toLowerCase().includes(query) ||
        customer.SoDienThoai?.includes(query)
      )
      if (!matchesSearch) return false
    }
    
    // Status filter
    if (statusFilter !== "all" && customer.TrangThai !== statusFilter) {
      return false
    }
    
    return true
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [customersRes, rolesRes] = await Promise.all([
        adminService.getCustomers({ page: currentPage, limit: pageSize }),
        adminService.getRoles(),
      ])
      const customersData = (customersRes as any)?.data ?? []
      const pagination = (customersRes as any)?.pagination
      
      // Backend trả về: { success: true, data: { roles: [...] } }
      const rolesData = (rolesRes as any)?.data?.roles ?? (rolesRes as any)?.roles ?? []
      
      // Đảm bảo rolesData là array
      if (!Array.isArray(rolesData)) {
        console.warn('rolesData is not an array:', rolesData)
        setRoles([])
      } else {
        setRoles(rolesData)
      }

      setCustomers(customersData)
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setTotal(pagination.total || 0)
      }
      // Update charts with all data (fetch all for charts)
      const allCustomersRes = await adminService.getCustomers({ page: 1, limit: 1000 })
      const allCustomersData = (allCustomersRes as any)?.data ?? []
      updateCharts(allCustomersData)
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      toast.error("Không thể tải dữ liệu khách hàng")
    } finally {
      setLoading(false)
    }
  }

  const updateCharts = (customersData: Customer[]) => {
    // Top customers by revenue
    const topCustomers = [...customersData]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.HoTen ? c.HoTen.split(" ").slice(-1)[0] : "N/A", // Lấy tên
        count: c.orderCount || 0,
        revenue: c.totalRevenue || 0,
      }))
    setTopCustomersChart(topCustomers)

    // Status chart
    const statusMap = new Map<string, ChartItem>()
    customersData.forEach((customer) => {
      const status = customer.TrangThai === "active" ? "Đang hoạt động" : "Đã khóa"
      if (!statusMap.has(status)) {
        statusMap.set(status, { name: status, count: 0 })
      }
      statusMap.get(status)!.count! += 1
    })
    setStatusChart(Array.from(statusMap.values()))
  }

  const openDetailDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500 text-white">Hoạt động</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Đã khóa</Badge>
    )
  }

  // Handler functions
  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      hoten: customer.HoTen || "",
      email: customer.Email || "",
      sdt: customer.SoDienThoai || "",
      gioiTinh: customer.GioiTinh || "",
      ngaySinh: customer.NgaySinh ? new Date(customer.NgaySinh).toISOString().split('T')[0] : "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (customer: Customer) => {
    setDeletingCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const openLockDialog = (customer: Customer) => {
    setLockingCustomer(customer)
    setIsLockDialogOpen(true)
  }

  const openRoleDialog = (customer: Customer) => {
    setChangingRoleCustomer(customer)
    const roleId = typeof customer.MaVaiTro === 'object' ? customer.MaVaiTro._id : customer.MaVaiTro || ""
    setSelectedRoleId(roleId)
    setIsRoleDialogOpen(true)
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return
    try {
      setSubmitting(true)
      await adminService.updateCustomer(editingCustomer._id, formData)
      toast.success("Cập nhật khách hàng thành công")
      setIsEditDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật khách hàng")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return
    try {
      await adminService.deleteCustomer(deletingCustomer._id)
      toast.success("Đã xóa khách hàng")
      setIsDeleteDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa khách hàng")
    }
  }

  const handleLockCustomer = async () => {
    if (!lockingCustomer) return
    try {
      const isLocked = lockingCustomer.TrangThai === "inactive"
      await adminService.lockCustomer(lockingCustomer._id, !isLocked)
      toast.success(isLocked ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản")
      setIsLockDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || "Không thể khóa/mở khóa tài khoản")
    }
  }

  const handleChangeRole = async () => {
    if (!changingRoleCustomer || !selectedRoleId) return
    try {
      setSubmitting(true)
      await adminService.changeCustomerRole(changingRoleCustomer._id, selectedRoleId)
      toast.success("Đã đổi role thành công")
      setIsRoleDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || "Không thể đổi role")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
          <p className="text-muted-foreground">
            Thông tin khách hàng và lịch sử mua hàng
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, SĐT..."
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
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters */}
          {(statusFilter !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all")
                setSearchQuery("")
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={topCustomersChart.map(item => ({ 
            name: item.name, 
            sold: item.count || 0,
            revenue: item.revenue 
          }))}
          loading={loading}
          title="Top 10 khách hàng"
          description="Khách hàng có tổng giá trị chi tiêu cao nhất"
        />
        <ChartAreaInteractive
          data={statusChart.map(item => ({ 
            name: item.name, 
            sold: item.count || 0 
          }))}
          loading={loading}
          title="Trạng thái khách hàng"
          description="Phân bổ khách hàng theo trạng thái"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div key="total-customers" className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Tổng khách hàng</div>
          <div className="mt-2 text-3xl font-bold">{customers.length}</div>
        </div>
        <div key="vip-customers" className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Khách hàng VIP</div>
          <div className="mt-2 text-3xl font-bold">
            {customers.filter(c => (c.totalRevenue || 0) >= 50000000).length}
          </div>
        </div>
        <div key="total-revenue" className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Tổng doanh thu</div>
          <div className="mt-2 text-2xl font-bold">
            {currencyFormatter.format(
              customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
            )}
          </div>
        </div>
        <div key="total-orders" className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</div>
          <div className="mt-2 text-3xl font-bold">
            {customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Số điện thoại</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng đơn hàng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? "Không tìm thấy khách hàng phù hợp" : "Chưa có khách hàng nào"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  return (
                    <tr key={customer._id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">{customer.HoTen || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {customer.Email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {customer.SoDienThoai ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.SoDienThoai}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {customer.orderCount || 0} đơn
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {currencyFormatter.format(customer.totalRevenue || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(customer.TrangThai)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDetailDialog(customer)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(customer)}
                            title="Sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openLockDialog(customer)}
                            title={customer.TrangThai === "inactive" ? "Mở khóa" : "Khóa"}
                          >
                            {customer.TrangThai === "inactive" ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openRoleDialog(customer)}
                            title="Đổi role"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteDialog(customer)}
                            title="Xóa"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} trong tổng số {total} khách hàng
            {searchQuery && ` (${filteredCustomers.length} kết quả tìm kiếm)`}
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

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và lịch sử mua hàng
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div key="name">
                  <p className="text-sm font-medium text-muted-foreground">Họ tên</p>
                  <p className="text-lg font-semibold">{selectedCustomer.HoTen || "N/A"}</p>
                </div>
                <div key="email">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedCustomer.Email}</p>
                </div>
                <div key="phone">
                  <p className="text-sm font-medium text-muted-foreground">Số điện thoại</p>
                  <p className="text-sm">{selectedCustomer.SoDienThoai || "Chưa cập nhật"}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-3 font-semibold">Thống kê mua hàng</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div key="order-count" className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Tổng đơn hàng</span>
                    <span className="text-xl font-bold">{selectedCustomer.orderCount || 0}</span>
                  </div>
                  <div key="total-spent" className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Tổng chi tiêu</span>
                    <span className="text-xl font-bold">
                      {currencyFormatter.format(selectedCustomer.totalRevenue || 0)}
                    </span>
                  </div>
                  <div key="avg-order" className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Trung bình/đơn</span>
                    <span className="text-xl font-bold">
                      {currencyFormatter.format(
                        (selectedCustomer.totalRevenue || 0) / (selectedCustomer.orderCount || 1)
                      )}
                    </span>
                  </div>
                  <div key="status" className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Trạng thái</span>
                    {getStatusBadge(selectedCustomer.TrangThai)}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Ngày đăng ký</p>
                <p className="text-sm">
                  {new Date(selectedCustomer.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin khách hàng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hoten">Họ tên</Label>
              <Input
                id="hoten"
                value={formData.hoten}
                onChange={(e) => setFormData({ ...formData, hoten: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input
                id="sdt"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="gioiTinh">Giới tính</Label>
              <Select
                value={formData.gioiTinh}
                onValueChange={(value) => setFormData({ ...formData, gioiTinh: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ngaySinh">Ngày sinh</Label>
              <Input
                id="ngaySinh"
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng <strong>{deletingCustomer?.HoTen}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock/Unlock Customer Dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lockingCustomer?.TrangThai === "inactive" ? "Mở khóa" : "Khóa"} tài khoản
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {lockingCustomer?.TrangThai === "inactive" ? "mở khóa" : "khóa"} 
              tài khoản của khách hàng <strong>{lockingCustomer?.HoTen}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleLockCustomer}>
              {lockingCustomer?.TrangThai === "inactive" ? "Mở khóa" : "Khóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi role khách hàng</DialogTitle>
            <DialogDescription>
              Thay đổi role cho khách hàng <strong>{changingRoleCustomer?.HoTen}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn role" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roles) && roles.length > 0 ? (
                    roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.TenVaiTro}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Không có role nào
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleChangeRole} disabled={submitting || !selectedRoleId}>
              {submitting ? "Đang xử lý..." : "Đổi role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

