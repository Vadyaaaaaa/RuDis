import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import './ChannelView.css';

const socket = io('http://localhost:5000');

function ChannelView({ server, channel }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (channel) {
      fetchMessages();
      socket.emit('join-channel', channel.id);
    }

    return () => {
      if (channel) {
        socket.emit('leave-channel', channel.id);
      }
    };
  }, [channel]);

  useEffect(() => {
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('new-message');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!channel) return;
    
    try {
      const response = await axios.get(`/api/messages/channel/${channel.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !channel) return;

    try {
      const response = await axios.post('/api/messages', {
        content: newMessage,
        channelId: channel.id
      });

      socket.emit('send-message', response.data);
      setNewMessage('');
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping && channel) {
      setIsTyping(true);
      socket.emit('typing', {
        userId: user.id,
        username: user.username,
        channelId: channel.id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', {
        userId: user.id,
        channelId: channel.id
      });
    }, 1000);
  };

  if (!channel) {
    return (
      <div className="channel-view empty">
        <div className="empty-state">
          <h2>Добро пожаловать в RuDis!</h2>
          <p>Выберите сервер и канал, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-view">
      <div className="channel-header">
        <span className="channel-hash">#</span>
        <h2>{channel.name}</h2>
      </div>

      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} className="message">
            <div className="message-avatar">
              {message.username?.charAt(0).toUpperCase()}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-username">{message.username}</span>
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder={`Написать в #${channel.name}`}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          className="message-input"
        />
        <button type="submit" className="send-button" disabled={!newMessage.trim()}>
          Отправить
        </button>
      </form>
    </div>
  );
}

export default ChannelView;

