import api from './client';

export const authApi = {
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

