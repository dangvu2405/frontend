import axiosInstance from './axios';

export interface ChatRoom {
  _id: string;
  CustomerId: {
    _id: string;
    HoTen: string;
    Email: string;
    AvatarUrl?: string;
    TenDangNhap?: string;
  };
  AdminId?: {
    _id: string;
    HoTen: string;
    Email: string;
    AvatarUrl?: string;
  } | null;
  Status: 'pending' | 'active' | 'closed';
  LastMessage?: string;
  LastMessageAt?: string;
  UnreadCount: {
    customer: number;
    admin: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  ChatRoomId: string;
  SenderId: {
    _id: string;
    HoTen: string;
    Email: string;
    AvatarUrl?: string;
  };
  SenderType: 'customer' | 'admin';
  Message: string;
  IsRead: boolean;
  ReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

const chatService = {
  // Get or create chat room for customer
  getOrCreateChatRoom: async (): Promise<ChatRoom> => {
    // axiosInstance interceptor returns response.data directly
    const response: { success: boolean; data: ChatRoom } = await axiosInstance.get(
      '/chat/room'
    );
    return response.data;
  },

  // Get all chat rooms (admin only)
  getChatRooms: async (status?: string, page: number = 1, limit: number = 20): Promise<{
    data: ChatRoom[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    // axiosInstance interceptor returns response.data directly
    const response: {
      success: boolean;
      data: ChatRoom[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    } = await axiosInstance.get(`/chat/rooms?${params.toString()}`);
    return {
      data: response.data,
      pagination: response.pagination,
    };
  },

  // Get chat room by ID
  getChatRoomById: async (chatRoomId: string): Promise<ChatRoom> => {
    // axiosInstance interceptor returns response.data directly
    const response: { success: boolean; data: ChatRoom } = await axiosInstance.get(
      `/chat/room/${chatRoomId}`
    );
    return response.data;
  },

  // Get messages for a chat room
  getMessages: async (
    chatRoomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    // axiosInstance interceptor returns response.data directly
    const response: {
      success: boolean;
      data: ChatMessage[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    } = await axiosInstance.get(`/chat/room/${chatRoomId}/messages?${params.toString()}`);
    return {
      data: response.data,
      pagination: response.pagination,
    };
  },

  // Assign admin to chat room
  assignAdmin: async (chatRoomId: string): Promise<ChatRoom> => {
    // axiosInstance interceptor returns response.data directly
    const response: { success: boolean; data: ChatRoom } = await axiosInstance.post(
      `/chat/room/${chatRoomId}/assign`
    );
    return response.data;
  },

  // Close chat room
  closeChatRoom: async (chatRoomId: string): Promise<void> => {
    await axiosInstance.post(`/chat/room/${chatRoomId}/close`);
  },

  // Mark messages as read
  markAsRead: async (chatRoomId: string): Promise<void> => {
    await axiosInstance.post(`/chat/room/${chatRoomId}/read`);
  },

  // Delete chat room
  deleteChatRoom: async (chatRoomId: string): Promise<void> => {
    await axiosInstance.delete(`/chat/room/${chatRoomId}`);
  },
};

export default chatService;

