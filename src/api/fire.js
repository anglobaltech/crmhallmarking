import client from './client.js';
export const fireApi = {
  getAll: (params = {}) => client.get('/api/fire-assays', { params }),
  getStats: () => client.get('/api/fire-assays/meta/stats'),
  getById: (id) => client.get(`/api/fire-assays/${id}`),
  create: (data) => client.post('/api/fire-assays', data),
  update: (id, data) => client.put(`/api/fire-assays/${id}`, data),
  delete: (id) => client.delete(`/api/fire-assays/${id}`),
};
