import client from './client.js';
export const solderingApi = {
  getAll: (params = {}) => client.get('/api/soldering-jobs', { params }),
  getStats: () => client.get('/api/soldering-jobs/meta/stats'),
  getById: (id) => client.get(`/api/soldering-jobs/${id}`),
  create: (data) => client.post('/api/soldering-jobs', data),
  update: (id, data) => client.put(`/api/soldering-jobs/${id}`, data),
  delete: (id) => client.delete(`/api/soldering-jobs/${id}`),
};
