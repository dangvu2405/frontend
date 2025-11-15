import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import chatService, { type ChatMessage, type ChatRoom } from '@/services/chatService';
import socketService, { type NewMessageEvent } from '@/services/socketService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CustomerChat() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load chat room and messages
  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    const loadChat = async () => {
      try {
        setLoading(true);
        // Get or create chat room
        const room = await chatService.getOrCreateChatRoom();
        setChatRoom(room);

        // Load messages
        const { data } = await chatService.getMessages(room._id);
        setMessages(data);

        // Connect to socket and join room
        socketService.connect();
        socketService.joinChatRoom(room._id);

        // Mark messages as read
        await chatService.markAsRead(room._id);
      } catch (error: any) {
        console.error('Error loading chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [isAuthenticated, isOpen]);

  // Set up socket listeners
  useEffect(() => {
    if (!isOpen || !chatRoom) return;

    const handleNewMessage = (message: NewMessageEvent) => {
      if (message.ChatRoomId === chatRoom._id) {
        setMessages((prev) => [...prev, message as ChatMessage]);
        // Mark as read
        chatService.markAsRead(chatRoom._id);
      }
    };

    socketService.on('new-message', handleNewMessage);

    return () => {
      socketService.off('new-message', handleNewMessage);
    };
  }, [isOpen, chatRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom || sending) return;

    try {
      setSending(true);
      socketService.sendMessage(chatRoom._id, newMessage.trim());
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatRoom) {
        socketService.leaveChatRoom(chatRoom._id);
      }
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>CS</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">Hỗ trợ khách hàng</h3>
                <p className="text-xs text-muted-foreground">
                  {chatRoom?.Status === 'active' ? 'Đang trực tuyến' : 'Đang chờ...'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                if (chatRoom) {
                  socketService.leaveChatRoom(chatRoom._id);
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.SenderType === 'customer';
                return (
                  <div
                    key={message._id}
                    className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.SenderId.AvatarUrl} />
                        <AvatarFallback>
                          {message.SenderId.HoTen.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg p-3',
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.Message}</p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                      </p>
                    </div>
                    {isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          {user?.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={sending || !chatRoom}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim() || !chatRoom}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

