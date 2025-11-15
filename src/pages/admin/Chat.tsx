import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Clock, Search, MoreVertical, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import chatService, { type ChatRoom, type ChatMessage } from '@/services/chatService';
import socketService, { type NewMessageEvent, type NewChatMessageEvent } from '@/services/socketService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminChatPage() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ChatRoom | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load chat rooms
  useEffect(() => {
    loadChatRooms();
    // Connect to socket - admin will automatically join admin-room
    socketService.connect();
  }, []);

  // Set up socket listeners
  useEffect(() => {
    const handleNewChatMessage = (data: NewChatMessageEvent) => {
      const currentRoomId = selectedRoom?._id;
      const isCurrentRoom = currentRoomId === data.chatRoomId;
      const isFromCustomer = data.message.SenderType === 'customer';
      
      // Update unread count for the chat room
      setChatRooms((prev) => {
        const updated = prev.map((room) =>
          room._id === data.chatRoomId
            ? {
                ...room,
                UnreadCount: {
                  ...room.UnreadCount,
                  admin: data.unreadCount,
                },
                LastMessage: data.message.Message,
                LastMessageAt: data.message.createdAt,
              }
            : room
        );

        // Show notification if message is from customer and not in current room
        if (isFromCustomer && !isCurrentRoom) {
          const room = updated.find(r => r._id === data.chatRoomId);
          if (room) {
            toast.info(`Bạn có tin nhắn mới từ ${room.CustomerId.HoTen}`, {
              description: data.message.Message.length > 50 
                ? data.message.Message.substring(0, 50) + '...' 
                : data.message.Message,
              duration: 5000,
            });
          }
        }

        return updated;
      });

      // If this room is selected, add message to messages list (avoid duplicates)
      if (isCurrentRoom) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(
            (msg) => msg._id === data.message._id || 
            (msg.Message === data.message.Message && 
             msg.createdAt === data.message.createdAt &&
             msg.SenderType === data.message.SenderType)
          );
          if (messageExists) {
            return prev;
          }
          return [...prev, data.message as ChatMessage];
        });
        // Mark as read
        chatService.markAsRead(data.chatRoomId);
      }
    };

    const handleNewMessage = (message: NewMessageEvent) => {
      const currentRoomId = selectedRoom?._id;
      if (currentRoomId === message.ChatRoomId) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(
            (msg) => msg._id === message._id || 
            (msg.Message === message.Message && 
             msg.createdAt === message.createdAt &&
             msg.SenderType === message.SenderType)
          );
          if (messageExists) {
            return prev;
          }
          return [...prev, message as ChatMessage];
        });
        // Mark as read
        chatService.markAsRead(message.ChatRoomId);
      }
    };

    socketService.on('new-chat-message', handleNewChatMessage);
    socketService.on('new-message', handleNewMessage);

    return () => {
      socketService.off('new-chat-message', handleNewChatMessage);
      socketService.off('new-message', handleNewMessage);
    };
  }, [selectedRoom?._id]);

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom._id);
      socketService.joinChatRoom(selectedRoom._id);
      // Mark as read
      chatService.markAsRead(selectedRoom._id);
      
      // Update unread count
      setChatRooms((prev) =>
        prev.map((room) =>
          room._id === selectedRoom._id
            ? { ...room, UnreadCount: { ...room.UnreadCount, admin: 0 } }
            : room
        )
      );
    }
  }, [selectedRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatRooms = async () => {
    try {
      setLoadingRooms(true);
      const { data } = await chatService.getChatRooms();
      setChatRooms(data);
      
      // Auto-select first room if none selected
      if (!selectedRoom && data.length > 0) {
        setSelectedRoom(data[0]);
      }
    } catch (error: any) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (chatRoomId: string) => {
    try {
      setLoading(true);
      const { data } = await chatService.getMessages(chatRoomId);
      setMessages(data);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    
    // If admin hasn't been assigned, assign admin
    if (!room.AdminId && room.Status === 'pending') {
      try {
        const updatedRoom = await chatService.assignAdmin(room._id);
        setChatRooms((prev) =>
          prev.map((r) => (r._id === room._id ? updatedRoom : r))
        );
        setSelectedRoom(updatedRoom);
      } catch (error: any) {
        console.error('Error assigning admin:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || sending) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      setSending(true);
      // Don't add message to state here - wait for socket event to avoid duplicates
      socketService.sendMessage(selectedRoom._id, messageText);
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Restore message if error
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleCloseRoom = async (room: ChatRoom) => {
    if (!confirm('Bạn có chắc muốn đóng chat room này?')) return;

    try {
      await chatService.closeChatRoom(room._id);
      setChatRooms((prev) =>
        prev.map((r) =>
          r._id === room._id ? { ...r, Status: 'closed' as const } : r
        )
      );
      if (selectedRoom?._id === room._id) {
        setSelectedRoom(null);
        setMessages([]);
      }
      toast.success('Đã đóng chat room');
    } catch (error: any) {
      console.error('Error closing room:', error);
      toast.error('Không thể đóng chat room');
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      await chatService.deleteChatRoom(roomToDelete._id);
      setChatRooms((prev) => prev.filter((r) => r._id !== roomToDelete._id));
      if (selectedRoom?._id === roomToDelete._id) {
        setSelectedRoom(null);
        setMessages([]);
      }
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      toast.success('Đã xóa chat room');
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error('Không thể xóa chat room');
    }
  };

  const openDeleteDialog = (room: ChatRoom, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent room selection
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Đang hoạt động</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <Clock className="h-3 w-3" />
            <span>Chờ phản hồi</span>
          </div>
        );
      case 'closed':
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <X className="h-3 w-3" />
            <span>Đã đóng</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm', { locale: vi });
    } else if (isYesterday(messageDate)) {
      return 'Hôm qua';
    } else {
      return format(messageDate, 'dd/MM/yyyy', { locale: vi });
    }
  };

  const formatConversationTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm', { locale: vi });
    } else if (isYesterday(messageDate)) {
      return 'Hôm qua';
    } else {
      return format(messageDate, 'dd/MM', { locale: vi });
    }
  };

  const filteredRooms = chatRooms.filter((room) =>
    room.CustomerId.HoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.CustomerId.Email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-lg border border-border overflow-hidden bg-background">
      {/* Left Sidebar - Conversations List (Facebook Messenger Style) */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/30">
        {/* Search Header */}
        <div className="p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRooms.map((room) => {
                const isSelected = selectedRoom?._id === room._id;
                const hasUnread = room.UnreadCount.admin > 0;
                
                return (
                  <div
                    key={room._id}
                    className={cn(
                      'p-3 cursor-pointer transition-colors hover:bg-muted/50 relative group',
                      isSelected && 'bg-primary/10 border-l-2 border-l-primary'
                    )}
                  >
                    {/* Delete button on hover */}
                    <div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => openDeleteDialog(room, e)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div onClick={() => handleSelectRoom(room)}>
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={room.CustomerId.AvatarUrl} />
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                              {room.CustomerId.HoTen.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {room.Status === 'active' && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                          )}
                          {/* Chấm đỏ khi có tin nhắn mới */}
                          {hasUnread && !isSelected && (
                            <div className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 border-2 border-background animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn(
                              'font-semibold text-sm truncate',
                              hasUnread && !isSelected && 'font-bold'
                            )}>
                              {room.CustomerId.HoTen}
                            </p>
                            {room.LastMessageAt && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatConversationTime(room.LastMessageAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {room.LastMessage ? (
                              <p className={cn(
                                'text-sm truncate flex-1',
                                hasUnread && !isSelected 
                                  ? 'text-foreground font-medium' 
                                  : 'text-muted-foreground'
                              )}>
                                {room.LastMessage}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Chưa có tin nhắn</p>
                            )}
                            {hasUnread && (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                                {room.UnreadCount.admin > 9 ? '9+' : room.UnreadCount.admin}
                              </div>
                            )}
                          </div>
                          <div className="mt-1">
                            {getStatusBadge(room.Status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chat</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện với <strong>{roomToDelete?.CustomerId.HoTen}</strong>? 
              Hành động này không thể hoàn tác và sẽ xóa tất cả tin nhắn trong cuộc trò chuyện này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoomToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Right Side - Chat Area (Facebook Messenger Style) */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-background">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRoom.CustomerId.AvatarUrl} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {selectedRoom.CustomerId.HoTen.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedRoom.CustomerId.HoTen}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.CustomerId.Email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedRoom.Status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedRoom.Status !== 'closed' && (
                      <>
                        <DropdownMenuItem onClick={() => handleCloseRoom(selectedRoom)}>
                          <X className="mr-2 h-4 w-4" />
                          Đóng chat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => openDeleteDialog(selectedRoom, e)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto bg-muted/20 p-4"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Send className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                  <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message, index) => {
                    const isOwn = message.SenderType === 'admin';
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.SenderType !== message.SenderType;
                    const showTime = !prevMessage || 
                      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 minutes
                    
                    // Create unique key combining _id, index, and timestamp to avoid duplicates
                    const uniqueKey = `${message._id}-${index}-${message.createdAt}`;
                    
                    return (
                      <div key={uniqueKey}>
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            'flex gap-2 items-end group',
                            isOwn ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {!isOwn && (
                            <div className="w-8 flex-shrink-0">
                              {showAvatar ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={message.SenderId.AvatarUrl} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {message.SenderId.HoTen.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8"></div>
                              )}
                            </div>
                          )}
                          <div
                            className={cn(
                              'max-w-[65%] rounded-2xl px-4 py-2',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-background border border-border rounded-bl-sm'
                            )}
                          >
                            <p className={cn(
                              'text-sm whitespace-pre-wrap break-words',
                              isOwn ? 'text-primary-foreground' : 'text-foreground'
                            )}>
                              {message.Message}
                            </p>
                            <p
                              className={cn(
                                'text-xs mt-1 opacity-70',
                                isOwn ? 'text-primary-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                            </p>
                          </div>
                          {isOwn && (
                            <div className="w-8 flex-shrink-0">
                              {showAvatar ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8"></div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            {selectedRoom.Status !== 'closed' && (
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-border bg-background"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      disabled={sending}
                      className="pr-12 min-h-[44px] rounded-full border-border bg-muted/50 focus:bg-background"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    size="icon"
                    className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/10">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send className="h-10 w-10" />
            </div>
            <p className="text-xl font-semibold mb-2">Chọn một cuộc trò chuyện</p>
            <p className="text-sm">Chọn từ danh sách bên trái để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
}

