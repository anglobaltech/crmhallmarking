import client from './client.js';
export const xrfApi = {
  getAll: (params = {}) => client.get('/api/xrf-tests', { params }),
  getStats: () => client.get('/api/xrf-tests/meta/stats'),
  getById: (id) => client.get(`/api/xrf-tests/${id}`),
  create: (data) => client.post('/api/xrf-tests', data),
  update: (id, data) => client.put(`/api/xrf-tests/${id}`, data),
  delete: (id) => client.delete(`/api/xrf-tests/${id}`),
};
