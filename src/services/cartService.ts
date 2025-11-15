import axiosInstance from "./axios";

export interface Cart {
  id: string;
  SanPham: any[];
  TongTien: number;
}
export interface CheckoutData {
  MaKhachHang: string;
  DiaChi: string;
  SanPham: any[];
  TongTien: number;
  PhuongThucThanhToan: string;
  GhiChu?: string;
}


export const cartService = {
  // Lấy giỏ hàng
  getCart: async () => {
    // Axios interceptor already returns response.data, so we return the response directly
    return await axiosInstance.get('/cart/get-cart');
  },
  // Cập nhật sản phẩm trong giỏ hàng
  updateCart: async (data: any) => {
    // Axios interceptor already returns response.data, so we return the response directly
    return await axiosInstance.post('/cart/update-cart', data);
  },
  // Thanh toán đơn hàng
  checkout: async (data: any) => {
    // Axios interceptor already returns response.data, so we return the response directly
    return await axiosInstance.post('/cart/checkout', data);
  },
  // Tạo URL thanh toán VNPay
  createVNPayUrl: async (data: { orderId: string; amount: number; orderDescription?: string }) => {
    // Axios interceptor already returns response.data, so we return the response directly
    return await axiosInstance.post('/payment/vnpay/create-payment-url', data);
  },
  // Tạo QR code VNPay
  createVNPayQR: async (data: { orderId: string; amount: number; orderDescription?: string }) => {
    // Axios interceptor already returns response.data, so we return the response directly
    return await axiosInstance.post('/payment/vnpay/create-qr', data);
  }
};

