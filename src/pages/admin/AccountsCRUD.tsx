import { useEffect, useState, useRef } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import adminService, { type AdminUserPayload } from "@/services/adminService"
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
import { Edit, Plus, Trash2, UserCheck, UserX, Search, Filter, CheckSquare, Square } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type User = {
  _id: string
  HoTen: string
  Email: string
  TenDangNhap: string
  SoDienThoai?: string
  DiaChi?: string[]
  GioiTinh?: string
  NgaySinh?: string
  AvatarUrl?: string | null
  AvatarId?: string | null
  MaVaiTro: string | Role // hoặc object nếu populate
  TrangThai: string
  createdAt: string
  updatedAt: string
}

type Role = {
  _id: string
  TenVaiTro: string
}

type ChartItem = {
  name: string
  count?: number
}

export default function AdminAccountsPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [roleChart, setRoleChart] = useState<ChartItem[]>([])
  const [statusChart, setStatusChart] = useState<ChartItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Multi-select states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // Form thêm tài khoản 
  const [formData, setFormData] = useState<AdminUserPayload & {
    tenDangNhap?: string
    matKhau?: string
    trangThai?: string
    maVaiTro?: string
    gioiTinh?: string
    ngaySinh?: string
  }>({
    hoten: "",
    email: "",
    sdt: "",
    tenDangNhap: "",
    matKhau: "",
    trangThai: "active",
    maVaiTro: "",
    gioiTinh: "",
    ngaySinh: "",
  })
  const [submitting, setSubmitting] = useState(false)
  
  // Track if roles have been fetched
  const rolesFetchedRef = useRef(false)
  
  // Fetch roles only once on mount
  useEffect(() => {
    const fetchRoles = async () => {
      if (rolesFetchedRef.current || roles.length > 0) return
      try {
        rolesFetchedRef.current = true
        const rolesRes = await adminService.getRoles()
        // Backend trả về: { success: true, data: { roles: [...] } }
        const rolesData = (rolesRes as any)?.data?.roles ?? (rolesRes as any)?.roles ?? []
        
        // Đảm bảo rolesData là array
        if (!Array.isArray(rolesData)) {
          console.warn('rolesData is not an array:', rolesData)
          setRoles([])
        } else {
          setRoles(rolesData)
        }
      } catch (err) {
        rolesFetchedRef.current = false
        console.error("Error fetching roles:", err)
      }
    }
    fetchRoles()
  }, [])
  
  useEffect(() => {
    fetchData()
  }, [currentPage, roleFilter, statusFilter])
  
  // Reset selected users when filter changes
  useEffect(() => {
    setSelectedUsers(new Set())
    setIsSelectMode(false)
  }, [roleFilter, statusFilter, searchQuery])
  
  // lấy danh sách user - roles đã được fetch riêng
  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: pageSize,
      }
      
      if (roleFilter !== "all") {
        params.roleId = roleFilter
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      
      const usersRes = await adminService.getUsers(params)
      
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes
      const pagination = (usersRes as any)?.pagination
      
      setUsers(usersData as User[])
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setTotal(pagination.total || 0)
      }
      
      // Chỉ update charts ở trang đầu tiên để tránh fetch 1000 users mỗi lần
      if (currentPage === 1) {
        const allUsersParams = { ...params, page: 1, limit: 1000 }
        const allUsersRes = await adminService.getUsers(allUsersParams)
        const allUsersData = Array.isArray(allUsersRes.data) ? allUsersRes.data : allUsersRes
        updateCharts(allUsersData as User[], roles)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      toast.error("Không thể tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }
  
  // Filter users locally by search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      user.HoTen?.toLowerCase().includes(query) ||
      user.Email?.toLowerCase().includes(query) ||
      user.TenDangNhap?.toLowerCase().includes(query) ||
      user.SoDienThoai?.includes(query)
    )
  })
  
  const handleToggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user._id)))
    }
  }
  
  const handleToggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }
  
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Vui lòng chọn ít nhất một tài khoản")
      return
    }
    
    try {
      setSubmitting(true)
      const promises = Array.from(selectedUsers).map(userId =>
        adminService.deleteUser(userId)
      )
      
      await Promise.all(promises)
      toast.success(`Đã xóa ${selectedUsers.size} tài khoản thành công`)
      setSelectedUsers(new Set())
      setIsSelectMode(false)
      await fetchData()
    } catch (err: any) {
      console.error("Error bulk deleting users:", err)
      toast.error("Không thể xóa một số tài khoản")
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedUsers.size === 0) {
      toast.error("Vui lòng chọn ít nhất một tài khoản")
      return
    }
    
    try {
      setSubmitting(true)
      const promises = Array.from(selectedUsers).map(userId =>
        adminService.updateUser(userId, { trangThai: newStatus })
      )
      
      await Promise.all(promises)
      toast.success(`Đã cập nhật trạng thái ${selectedUsers.size} tài khoản thành công`)
      setSelectedUsers(new Set())
      setIsSelectMode(false)
      await fetchData()
    } catch (err: any) {
      console.error("Error bulk updating users:", err)
      toast.error("Không thể cập nhật một số tài khoản")
    } finally {
      setSubmitting(false)
    }
  }

  // Sửa phần updateCharts để hiển thị tên role đúng
  const updateCharts = (usersData: User[], rolesData: Role[] = roles) => {
    // Chart theo role
    const roleMap = new Map<string, ChartItem>()
    usersData.forEach((user) => {
      // Tìm tên role từ danh sách roles
      const roleName =
        typeof user.MaVaiTro === "string"
          ? rolesData.find((r) => r._id === user.MaVaiTro)?.TenVaiTro || "Chưa xác định"
          : user.MaVaiTro?.TenVaiTro || "Chưa xác định"
      
      if (!roleMap.has(roleName)) {
        roleMap.set(roleName, { name: roleName, count: 0 })
      }
      roleMap.get(roleName)!.count! += 1
    })
    setRoleChart(Array.from(roleMap.values()))

    // Chart theo status
    const statusMap = new Map<string, ChartItem>()
    usersData.forEach((user) => {
      const status = user.TrangThai === "active" ? "Đang hoạt động" : "Đã khóa"
      if (!statusMap.has(status)) {
        statusMap.set(status, { name: status, count: 0 })
      }
      statusMap.get(status)!.count! += 1
    })
    setStatusChart(Array.from(statusMap.values()))
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData({
      hoten: "",
      email: "",
      sdt: "",
      tenDangNhap: "",
      matKhau: "",
      trangThai: "active",
      maVaiTro: "",
      gioiTinh: "",
      ngaySinh: "",
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    const roleId = typeof user.MaVaiTro === "string" 
      ? user.MaVaiTro 
      : user.MaVaiTro?._id || ""
    
    setFormData({
      hoten: user.HoTen,
      email: user.Email,
      sdt: user.SoDienThoai || "",
      tenDangNhap: user.TenDangNhap || "",
      matKhau: "", // Không hiển thị password khi edit
      trangThai: user.TrangThai || "active",
      maVaiTro: roleId,
      gioiTinh: user.GioiTinh || "",
      ngaySinh: user.NgaySinh ? new Date(user.NgaySinh).toISOString().split('T')[0] : "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.hoten || !formData.hoten.trim()) {
      toast.error("Họ tên là bắt buộc")
      return
    }
    
    if (formData.hoten.trim().length < 2 || formData.hoten.trim().length > 100) {
      toast.error("Họ tên phải từ 2 đến 100 ký tự")
      return
    }
    
    if (!formData.email || !formData.email.trim()) {
      toast.error("Email là bắt buộc")
      return
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Email không hợp lệ")
      return
    }
    
    if (!formData.maVaiTro) {
      toast.error("Vai trò là bắt buộc")
      return
    }

    if (!editingUser) {
      // Validate khi tạo mới
      if (!formData.tenDangNhap || !formData.tenDangNhap.trim()) {
        toast.error("Tên đăng nhập là bắt buộc")
        return
      }
      
      if (formData.tenDangNhap.trim().length < 3 || formData.tenDangNhap.trim().length > 50) {
        toast.error("Tên đăng nhập phải từ 3 đến 50 ký tự")
        return
      }
      
      if (!formData.matKhau || formData.matKhau.length < 6) {
        toast.error("Mật khẩu phải có ít nhất 6 ký tự")
        return
      }
      
      // SoDienThoai là required khi tạo mới (không OAuth)
      if (!formData.sdt || !formData.sdt.trim()) {
        toast.error("Số điện thoại là bắt buộc")
        return
      }
      
      // Validate số điện thoại: 10 chữ số
      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(formData.sdt.trim())) {
        toast.error("Số điện thoại phải có đúng 10 chữ số")
        return
      }
    } else {
      // Khi edit, validate số điện thoại nếu có
      if (formData.sdt && formData.sdt.trim()) {
        const phoneRegex = /^[0-9]{10}$/
        if (!phoneRegex.test(formData.sdt.trim())) {
          toast.error("Số điện thoại phải có đúng 10 chữ số")
          return
        }
      }
      
      // Validate tên đăng nhập nếu có thay đổi
      if (formData.tenDangNhap && formData.tenDangNhap.trim()) {
        if (formData.tenDangNhap.trim().length < 3 || formData.tenDangNhap.trim().length > 50) {
          toast.error("Tên đăng nhập phải từ 3 đến 50 ký tự")
          return
        }
      }
      
      // Validate mật khẩu nếu có thay đổi
      if (formData.matKhau && formData.matKhau.length > 0 && formData.matKhau.length < 6) {
        toast.error("Mật khẩu phải có ít nhất 6 ký tự")
        return
      }
    }

    try {
      setSubmitting(true)
      
      // Prepare payload - đảm bảo đúng format và kiểu dữ liệu
      const payload: any = {
        hoten: formData.hoten?.trim() || "",
        email: formData.email?.trim().toLowerCase() || "",
        sdt: formData.sdt?.trim() || "",
        trangThai: formData.trangThai || "active",
        maVaiTro: formData.maVaiTro || "",
      }
      
      // Chỉ thêm các field có giá trị
      if (formData.tenDangNhap?.trim()) {
        payload.tenDangNhap = formData.tenDangNhap.trim();
      }
      
      if (formData.matKhau?.trim()) {
        payload.matKhau = formData.matKhau;
      }
      
      if (formData.gioiTinh) {
        payload.gioiTinh = formData.gioiTinh;
      }
      
      if (formData.ngaySinh) {
        payload.ngaySinh = formData.ngaySinh;
      }
      
      if (editingUser) {
        // Khi edit, chỉ gửi matKhau nếu có thay đổi
        if (!payload.matKhau || payload.matKhau === "") {
          delete payload.matKhau;
        }
        await adminService.updateUser(editingUser._id, payload)
        toast.success("Cập nhật tài khoản thành công")
      } else {
        // Khi create, matKhau là bắt buộc
        if (!payload.tenDangNhap || !payload.matKhau) {
          toast.error("Tên đăng nhập và mật khẩu là bắt buộc")
          setSubmitting(false)
          return
        }
        await adminService.createUser(payload)
        toast.success("Thêm tài khoản thành công")
      }
      
      setIsDialogOpen(false)
      await fetchData()
      // Update charts sau khi create/update nếu không ở trang 1
      if (currentPage !== 1) {
        const allUsersRes = await adminService.getUsers({ page: 1, limit: 1000 })
        const allUsersData = Array.isArray(allUsersRes.data) ? allUsersRes.data : allUsersRes
        updateCharts(allUsersData as User[], roles)
      }
    } catch (err) {
      console.error("Error submitting user:", err)
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    try {
      if (!deletingUser._id) return
      await adminService.deleteUser(deletingUser._id)
      toast.success("Xóa tài khoản thành công")
      setIsDeleteDialogOpen(false)
      await fetchData()
      // Update charts sau khi xóa nếu không ở trang 1
      if (currentPage !== 1) {
        const allUsersRes = await adminService.getUsers({ page: 1, limit: 1000 })
        const allUsersData = Array.isArray(allUsersRes.data) ? allUsersRes.data : allUsersRes
        updateCharts(allUsersData as User[], roles)
      }
    } catch (err) {
      console.error("Error deleting user:", err)
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa tài khoản"
      toast.error(errorMessage)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        <UserCheck className="h-3 w-3" />
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
        <UserX className="h-3 w-3" />
        Đã khóa
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý tài khoản</h1>
          <p className="text-muted-foreground">
            Quản lý người dùng và phân quyền
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectMode ? "default" : "outline"}
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              if (isSelectMode) {
                setSelectedUsers(new Set())
              }
            }}
          >
            {isSelectMode ? (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Đã chọn: {selectedUsers.size}
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Chọn nhiều
              </>
            )}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm tài khoản
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
              placeholder="Tìm kiếm theo tên, email, tên đăng nhập, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm whitespace-nowrap">Vai trò:</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.TenVaiTro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
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
          {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRoleFilter("all")
                setStatusFilter("all")
                setSearchQuery("")
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
        
        {/* Bulk Actions */}
        {isSelectMode && selectedUsers.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm font-medium">
              Đã chọn {selectedUsers.size} tài khoản:
            </span>
            <div className="flex gap-2">
              <Select onValueChange={handleBulkUpdateStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Thay đổi trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={submitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa tài khoản
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={roleChart.map(item => ({ name: item.name, sold: item.count || 0 }))}
          loading={loading}
          title="Phân bổ theo vai trò"
          description="Số lượng người dùng theo từng vai trò"
        />
        <ChartAreaInteractive
          data={statusChart.map(item => ({ name: item.name, sold: item.count || 0 }))}
          loading={loading}
          title="Trạng thái tài khoản"
          description="Số lượng tài khoản đang hoạt động và bị khóa"
        />
      </div>

      {/* Users Table */}
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
                      {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Số điện thoại</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Vai trò</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? "Không tìm thấy tài khoản phù hợp" : "Chưa có tài khoản nào"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  // Resolve role name whether API returns role id (string) or populated object
                  const roleName =
                    typeof user.MaVaiTro === "string"
                      ? roles.find((r) => r._id === user.MaVaiTro)?.TenVaiTro ?? "N/A"
                      : (user.MaVaiTro as Role)?.TenVaiTro ?? "N/A";

                  const createdText = user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN") 
                    : "—";

                  return (
                    <tr 
                      key={user._id} 
                      className={`border-b hover:bg-muted/50 ${selectedUsers.has(user._id) ? 'bg-primary/5' : ''}`}
                    >
                      {isSelectMode && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleToggleSelectUser(user._id)}
                          >
                            {selectedUsers.has(user._id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium">{user.HoTen}</td>
                      <td className="px-4 py-3 text-sm">{user.Email}</td>
                      <td className="px-4 py-3 text-sm">{user.SoDienThoai || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(user.TrangThai)}</td>
                      <td className="px-4 py-3 text-sm">{createdText}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(user)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
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
            Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} trong tổng số {total} tài khoản
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin tài khoản. Các trường có dấu * là bắt buộc.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hoten">Họ tên *</Label>
              <Input
                id="hoten"
                value={formData.hoten}
                onChange={(e) => setFormData({ ...formData, hoten: e.target.value })}
                placeholder="Nhập họ tên (2-100 ký tự)"
                minLength={2}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                Từ 2 đến 100 ký tự
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                placeholder="example@email.com"
                required
              />
            </div>

            {!editingUser ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenDangNhap">Tên đăng nhập *</Label>
                  <Input
                    id="tenDangNhap"
                    value={formData.tenDangNhap}
                    onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value.trim() })}
                    placeholder="Nhập tên đăng nhập (3-50 ký tự)"
                    minLength={3}
                    maxLength={50}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Từ 3 đến 50 ký tự, không được trùng
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matKhau">Mật khẩu *</Label>
                  <Input
                    id="matKhau"
                    type="password"
                    value={formData.matKhau}
                    onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu 6 ký tự
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenDangNhap">Tên đăng nhập</Label>
                  <Input
                    id="tenDangNhap"
                    value={formData.tenDangNhap}
                    onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value.trim() })}
                    placeholder="Để trống nếu không thay đổi"
                    minLength={3}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Để trống nếu không thay đổi (3-50 ký tự)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matKhau">Mật khẩu mới</Label>
                  <Input
                    id="matKhau"
                    type="password"
                    value={formData.matKhau}
                    onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                    placeholder="Để trống nếu không thay đổi"
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Để trống nếu không thay đổi (tối thiểu 6 ký tự)
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại {!editingUser && '*'}</Label>
              <Input
                id="sdt"
                type="tel"
                value={formData.sdt}
                onChange={(e) => {
                  // Chỉ cho phép nhập số
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, sdt: value })
                }}
                placeholder="0123456789"
                maxLength={10}
                required={!editingUser}
              />
              <p className="text-xs text-muted-foreground">
                {!editingUser ? 'Bắt buộc, đúng 10 chữ số' : 'Đúng 10 chữ số (để trống nếu không thay đổi)'}
              </p>
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="ngaySinh">Ngày sinh</Label>
              <Input
                id="ngaySinh"
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="maVaiTro">Vai trò *</Label>
              <Select
                value={formData.maVaiTro}
                onValueChange={(value) => setFormData({ ...formData, maVaiTro: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.TenVaiTro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trangThai">Trạng thái *</Label>
              <Select
                value={formData.trangThai}
                onValueChange={(value) => setFormData({ ...formData, trangThai: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang xử lý..." : editingUser ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản "{deletingUser?.HoTen}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

