import axiosInstance from './axios';

export interface Review {
  _id: string;
  IdSanPham: string;
  IdKhachHang: {
    _id: string;
    HoTen: string;
    AvatarUrl?: string;
    Email: string;
  };
  NoiDung: string;
  SoSao: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  avgRating: number;
  totalReviews: number;
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
}

export interface CreateReviewData {
  IdSanPham: string;
  NoiDung: string;
  SoSao: number;
}

export const reviewService = {
  // Lấy danh sách đánh giá của sản phẩm
  getProductReviews: async (productId: string, params?: { page?: number; limit?: number }) => {
    const response = await axiosInstance.get(`/api/reviews/product/${productId}`, { params });
    return {
      reviews: (response as any)?.data || [],
      pagination: (response as any)?.pagination
    };
  },

  // Lấy thống kê rating của sản phẩm
  getProductRatingStats: async (productId: string): Promise<RatingStats> => {
    const response = await axiosInstance.get(`/api/reviews/product/${productId}/stats`);
    return (response as any)?.data || {
      avgRating: 0,
      totalReviews: 0,
      star5: 0,
      star4: 0,
      star3: 0,
      star2: 0,
      star1: 0
    };
  },

  // Tạo đánh giá mới
  createReview: async (data: CreateReviewData) => {
    const response = await axiosInstance.post('/api/reviews', data);
    return (response as any)?.data;
  },

  // Lấy đánh giá của user cho sản phẩm
  getMyReview: async (productId: string): Promise<Review | null> => {
    try {
      const response = await axiosInstance.get(`/api/reviews/product/${productId}/my-review`);
      return (response as any)?.data;
    } catch (error: any) {
      // Axios interceptor đã transform error, check error.status thay vì error.response.status
      if (error.status === 404 || error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Lấy tất cả đánh giá của user
  getMyReviews: async (params?: { page?: number; limit?: number }) => {
    const response = await axiosInstance.get('/api/reviews/my-reviews', { params });
    return {
      reviews: (response as any)?.data || [],
      pagination: (response as any)?.pagination
    };
  },

  // Cập nhật đánh giá
  updateReview: async (reviewId: string, data: { NoiDung?: string; SoSao?: number }) => {
    const response = await axiosInstance.put(`/api/reviews/${reviewId}`, data);
    return (response as any)?.data;
  },

  // Xóa đánh giá
  deleteReview: async (reviewId: string) => {
    const response = await axiosInstance.delete(`/api/reviews/${reviewId}`);
    return response;
  },
};

