import axiosInstance from "./axios";

export interface User {
  id: string;
  hoten?: string;
  username: string;
  email: string;
  sdt?: string;
  diaChi?: string;
  avatar?: string;
  role?: string;
}

export interface UpdateUserData {
  hoten?: string;
  email?: string;
  sdt?: string;
  diaChi?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  // Lấy thông tin user hiện tại
  getCurrentUser: async (): Promise<User> => {
    const response: any = await axiosInstance.get("/user/me");
    // Return data from response.data or response itself
    return response?.data || response;
  },

  // Cập nhật thông tin user
  updateProfile: async (data: UpdateUserData): Promise<User> => {
    const response: any = await axiosInstance.put("/user/me", data);
    return response;
  },

  // Đổi mật khẩu
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await axiosInstance.post("/user/changepassword", data);
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("avatar", file);
    
    const response: any = await axiosInstance.post("/user/uploadAvatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  },

  // Đơn hàng người dùng
  getOrders: async (): Promise<{ orders: any[] } | any> => {
    const response: any = await axiosInstance.get("/user/orderUser");
    return response;
  },

  // Địa chỉ giao hàng
  getAddresses: async (): Promise<{ addresses: any[] } | any> => {
    const response: any = await axiosInstance.get("/user/addess");
    return response;
  },
  createAddress: async (address: any): Promise<any> => {
    const response: any = await axiosInstance.post("/user/addess", { address });
    return response;
  },
  editAddress: async (id: string, address: any): Promise<any> => {
    const response: any = await axiosInstance.patch(`/user/addess/${id}`, { address });
    return response;
  },
  deleteAddress: async (id: string): Promise<any> => {
    const response: any = await axiosInstance.delete(`/user/addess/${id}`);
    return response;
  },
};

