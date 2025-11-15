import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/constants';
import { storage } from '@/utils/storage';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to Socket.IO server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = storage.getToken();

    this.socket = io(API_BASE_URL || 'http://localhost:3001', {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any);
      });
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Join a chat room
   */
  joinChatRoom(chatRoomId: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }
    this.socket?.emit('join-chat-room', { chatRoomId });
  }

  /**
   * Leave a chat room
   */
  leaveChatRoom(chatRoomId: string): void {
    this.socket?.emit('leave-chat-room', { chatRoomId });
  }

  /**
   * Send a message
   */
  sendMessage(chatRoomId: string, message: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }
    this.socket?.emit('send-message', { chatRoomId, message });
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatRoomId: string): void {
    this.socket?.emit('mark-as-read', { chatRoomId });
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.removeAllListeners(event);
    }
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

// Event types
export interface NewMessageEvent {
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
  createdAt: string;
}

export interface NewChatMessageEvent {
  chatRoomId: string;
  message: NewMessageEvent;
  unreadCount: number;
}

export interface MessagesReadEvent {
  chatRoomId: string;
  readBy: string;
}

