import axiosClient from './axiosClient';

export const dashboardApi = {
  summary: () => axiosClient.get('/dashboard/summary').then((r) => r.data),
};
