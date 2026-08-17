import client from './client.js';
export const laserApi = {
  getAll: (params = {}) => client.get('/api/laser-jobs', { params }),
  getStats: () => client.get('/api/laser-jobs/meta/stats'),
  getById: (id) => client.get(`/api/laser-jobs/${id}`),
  create: (data) => client.post('/api/laser-jobs', data),
  update: (id, data) => client.put(`/api/laser-jobs/${id}`, data),
  delete: (id) => client.delete(`/api/laser-jobs/${id}`),
};
