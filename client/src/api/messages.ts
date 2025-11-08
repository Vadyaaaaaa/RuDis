import api from './client';

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  attachment?: string;
  created_at: string;
  username: string;
  avatar?: string;
}

export const messagesApi = {
  getByChannel: async (channelId: string, limit = 50, before?: string) => {
    const response = await api.get(`/messages/channel/${channelId}`, {
      params: { limit, before },
    });
    return response.data;
  },
  send: async (channelId: string, content: string, attachment?: string) => {
    const response = await api.post('/messages', {
      channelId,
      content,
      attachment,
    });
    return response.data;
  },
};

