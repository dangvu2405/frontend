import axiosInstance from "./axios";
import { apiCache } from "@/utils/apiCache";

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
      // Create cache key from params
      const cacheKey = `products:${JSON.stringify(params || {})}`;
      
      // Check cache first
      const cached = apiCache.get<{ products: Product[]; pagination?: Pagination }>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axiosInstance.get<ProductsResponse>("/api/products", { params });
      const result = {
        products: (response as any)?.data || [],
        pagination: (response as any)?.pagination
      };

      // Cache the result (5 minutes for product list)
      apiCache.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error: any) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const cacheKey = `product:${id}`;
      
      // Check cache first
      const cached = apiCache.get<Product>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axiosInstance.get<ProductResponse>(`/api/products/${id}`);
      const product = (response as any)?.product || null;

      // Cache the result (10 minutes for product detail)
      if (product) {
        apiCache.set(cacheKey, product, 10 * 60 * 1000);
      }

      return product;
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
