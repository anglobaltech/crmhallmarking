import client from './client.js';
export const dashboardApi = {
  getStats: () => client.get('/api/dashboard/stats'),
  getMonthlyRevenue: () => client.get('/api/dashboard/monthly-revenue'),
  getActivity: () => client.get('/api/dashboard/activity'),
};
