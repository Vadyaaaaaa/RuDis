import { useEffect, useState, useRef } from 'react';
import { Message } from '../../api/messages';
import { messagesApi } from '../../api/messages';
import { useSocketStore } from '../../store/socketStore';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';

interface ChatAreaProps {
  channelId: string | null;
}

export default function ChatArea({ channelId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (channelId) {
      loadMessages();
      joinChannel();
    } else {
      setMessages([]);
    }

    return () => {
      if (channelId && socket) {
        socket.emit('leave_channel', channelId);
      }
    };
  }, [channelId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (message.channel_id === channelId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const response = await messagesApi.getByChannel(channelId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChannel = () => {
    if (channelId && socket) {
      socket.emit('join_channel', channelId);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!channelId || !socket) return;

    socket.emit('send_message', {
      channelId,
      content,
    });
  };

  if (!channelId) {
    return (
      <div className="flex-1 bg-discord-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Добро пожаловать в Ruscord!</h2>
          <p className="text-discord-text-muted">Выберите канал для начала общения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-discord-dark flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-discord-text-muted">Загрузка сообщений...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-discord-text-muted">Нет сообщений</div>
        ) : (
          messages.map((message) => <MessageItem key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}

