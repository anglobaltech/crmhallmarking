import client from './client.js';

export const jewellersApi = {
  getAll: (params = {}) => client.get('/api/jewellers', { params }),
  getById: (id) => client.get(`/api/jewellers/${id}`),
  getStats: () => client.get('/api/jewellers/meta/stats'),
  create: (data) => client.post('/api/jewellers', data),
  update: (id, data) => client.put(`/api/jewellers/${id}`, data),
  delete: (id) => client.delete(`/api/jewellers/${id}`),
};
