import api from './client';

export interface Server {
  id: string;
  name: string;
  icon?: string;
  owner_id: string;
  created_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  type: 'text' | 'voice';
  created_at: string;
}

export interface ServerMember {
  id: string;
  username: string;
  avatar?: string;
  role: string;
}

export const serversApi = {
  getAll: async () => {
    const response = await api.get('/servers');
    return response.data;
  },
  getById: async (serverId: string) => {
    const response = await api.get(`/servers/${serverId}`);
    return response.data;
  },
  create: async (name: string, icon?: string) => {
    const response = await api.post('/servers', { name, icon });
    return response.data;
  },
  join: async (serverId: string) => {
    const response = await api.post(`/servers/${serverId}/join`);
    return response.data;
  },
};

