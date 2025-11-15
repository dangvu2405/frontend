import axiosInstance from "./axios";

export interface Product {
  id: string;
  tenSP: string;
  mota: string;
  gia: number;
  giamGia?: number;
  soLuong: number;
  daBan: number;
  hinhAnh: string; // Deprecated: dùng hinhAnhChinh thay thế
  hinhAnhChinh: string;
  hinhAnhPhu: string[];
  loaiSP: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  message?: string;
  pagination?: Pagination;
}

interface ProductResponse {
  success: boolean;
  product: Product;
  message?: string;
}

export const productsService = {
  // Lấy tất cả sản phẩm
  getAllProducts: async (params?: { page?: number; limit?: number }): Promise<{ products: Product[]; pagination?: Pagination }> => {
    try {
      const response = await axiosInstance.get<ProductsResponse>("/api/products", { params });
      return {
        products: (response as any)?.data || [],
        pagination: (response as any)?.pagination
      };
    } catch (error: any) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const response = await axiosInstance.get<ProductResponse>(`/api/products/${id}`);
      return (response as any)?.product || null;
    } catch (error: any) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Lấy sản phẩm theo loại
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get<ProductsResponse>(`/api/products?loaiSP=${category}`);
      return (response as any)?.data || [];
    } catch (error: any) {
      console.error(`Error fetching products by category ${category}:`, error);
      throw error;
    }
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (keyword: string): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get<ProductsResponse>(`/api/products/search?q=${keyword}`);
      return (response as any)?.data || [];
    } catch (error: any) {
      console.error(`Error searching products with keyword ${keyword}:`, error);
      throw error;
    }
  },
};
