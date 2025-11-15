import axiosInstance from './axios';

export interface AdminProductPayload {
  TenSanPham?: string;
  MoTa?: string;
  Gia?: number;
  KhuyenMai?: number;
  SoLuong?: number;
  MaLoaiSanPham?: string;
  HinhAnhChinh?: string;
  HinhAnhPhu?: string[];
  [key: string]: any;
}

export interface AdminCategoryPayload {
  TenLoaiSanPham: string;
}

export interface AdminRolePayload {
  TenVaiTro: string;
}

export interface AdminUserPayload {
  hoten?: string;
  email?: string;
  sdt?: string;
  diaChi?: string;
  [key: string]: any;
}

export interface AdminInventoryPayload {
  amount?: number;
  quantity?: number;
}

const adminService = {
  // ==========================
  // PRODUCTS
  // ==========================
  createProduct: (payload: AdminProductPayload) =>
    axiosInstance.post('/admin/products', payload),

  getProducts: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/products', { params }),

  getProductById: (id: string) => axiosInstance.get(`/admin/products/${id}`),

  updateProduct: (id: string, payload: AdminProductPayload) =>
    axiosInstance.put(`/admin/products/${id}`, payload),

  deleteProduct: (id: string) => axiosInstance.delete(`/admin/products/${id}`),

  // ==========================
  // CATEGORIES
  // ==========================
  createCategory: (payload: AdminCategoryPayload) =>
    axiosInstance.post('/admin/categories', payload),

  getCategories: () => axiosInstance.get('/admin/categories'),

  getCategoryById: (id: string) => axiosInstance.get(`/admin/categories/${id}`),

  updateCategory: (id: string, payload: AdminCategoryPayload) =>
    axiosInstance.put(`/admin/categories/${id}`, payload),

  deleteCategory: (id: string) => axiosInstance.delete(`/admin/categories/${id}`),

  // ==========================
  // ROLES
  // ==========================
  createRole: (payload: AdminRolePayload) =>
    axiosInstance.post('/admin/roles', payload),

  getRoles: () => axiosInstance.get('/admin/roles'),

  getRoleById: (id: string) => axiosInstance.get(`/admin/roles/${id}`),

  updateRole: (id: string, payload: AdminRolePayload) =>
    axiosInstance.put(`/admin/roles/${id}`, payload),

  deleteRole: (id: string) => axiosInstance.delete(`/admin/roles/${id}`),

  // ==========================
  // USERS (self profile functions)
  // ==========================
  getUsers: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/users', { params }),

  createUser: (payload: AdminUserPayload) =>
    axiosInstance.post('/admin/users', payload),

  updateUser: (id: string, payload: AdminUserPayload) =>
    axiosInstance.put(`/admin/users/${id}`, payload),
  deleteUser: (id: string) => axiosInstance.delete(`/admin/users/${id}`),


  // ==========================
  // CUSTOMERS (only Customer role accounts)
  // ==========================
  getCustomers: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/customers', { params }),

  updateCustomer: (id: string, payload: any) =>
    axiosInstance.put(`/admin/customers/${id}`, payload),

  deleteCustomer: (id: string) =>
    axiosInstance.delete(`/admin/customers/${id}`),

  lockCustomer: (id: string, lock: boolean) =>
    axiosInstance.post(`/admin/customers/${id}/lock`, { lock }),

  changeCustomerRole: (id: string, roleId: string) =>
    axiosInstance.post(`/admin/customers/${id}/change-role`, { maVaiTro: roleId }),




  // ==========================
  // ORDERS
  // ==========================
  createOrder: (payload: any) =>
    axiosInstance.post('/admin/orders', payload),

  getOrders: (params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/orders', { params }),

  getOrderById: (id: string) => axiosInstance.get(`/admin/orders/${id}`),

  updateOrder: (id: string, payload: any) =>
    axiosInstance.put(`/admin/orders/${id}`, payload),

  deleteOrder: (id: string) => axiosInstance.delete(`/admin/orders/${id}`),

  cancelOrder: (id: string) =>
    axiosInstance.post(`/admin/orders/${id}/cancel`, {}),

  checkout: (payload: any) =>
    axiosInstance.post('/admin/orders/checkout', payload),

  // ==========================
  // CART
  // ==========================
  addToCart: (payload: any) =>
    axiosInstance.post('/admin/cart/items', payload),

  getCart: () => axiosInstance.get('/admin/cart'),

  updateCartItem: (id: string, payload: any) =>
    axiosInstance.put(`/admin/cart/items/${id}`, payload),

  deleteCartItem: (id: string) =>
    axiosInstance.delete(`/admin/cart/items/${id}`),

  clearCart: () => axiosInstance.delete('/admin/cart'),

  // ==========================
  // INVENTORY
  // ==========================
  getInventory: (params?: { min?: number; max?: number; categoryId?: string }) =>
    axiosInstance.get('/admin/inventory', { params }),

  getInventoryItem: (id: string) =>
    axiosInstance.get(`/admin/inventory/${id}`),

  increaseStock: (id: string, payload: AdminInventoryPayload) =>
    axiosInstance.post(`/admin/inventory/${id}/increase`, payload),

  decreaseStock: (id: string, payload: AdminInventoryPayload) =>
    axiosInstance.post(`/admin/inventory/${id}/decrease`, payload),

  setStock: (id: string, payload: AdminInventoryPayload) =>
    axiosInstance.put(`/admin/inventory/${id}`, payload),

  clearStock: (id: string) =>
    axiosInstance.delete(`/admin/inventory/${id}`),

  // ==========================
  // DASHBOARD / STATS
  // ==========================
  getSummaryStats: () => axiosInstance.get('/admin/stats/summary'),

  getRevenueStats: (params?: { startDate?: string; endDate?: string }) =>
    axiosInstance.get('/admin/stats/revenue', { params }),

  getTopProducts: (params?: { limit?: number }) =>
    axiosInstance.get('/admin/stats/top-products', { params }),

  getLowStockProducts: (params?: { threshold?: number }) =>
    axiosInstance.get('/admin/stats/low-stock', { params }),

  getMonthlyOrdersStats: (params?: { months?: number }) =>
    axiosInstance.get('/admin/stats/monthly-orders', { params }),

  getTopCustomersByOrders: (params?: { limit?: number }) =>
    axiosInstance.get('/admin/stats/top-customers', { params }),
};

export default adminService;

