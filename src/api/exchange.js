import client from './client.js';
export const exchangeApi = {
  getAll: (params = {}) => client.get('/api/gold-exchanges', { params }),
  getStats: () => client.get('/api/gold-exchanges/meta/stats'),
  getById: (id) => client.get(`/api/gold-exchanges/${id}`),
  create: (data) => client.post('/api/gold-exchanges', data),
  update: (id, data) => client.put(`/api/gold-exchanges/${id}`, data),
  delete: (id) => client.delete(`/api/gold-exchanges/${id}`),
};
