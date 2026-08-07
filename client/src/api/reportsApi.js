import axiosClient from './axiosClient';

export const reportsApi = {
  run: (config) => axiosClient.post('/reports/run', config).then((r) => r.data),
  exportCsv: async (config) => {
    const res = await axiosClient.post('/reports/export/csv', config, { responseType: 'blob' });
    return res.data;
  },
  listTemplates: () => axiosClient.get('/reports/templates').then((r) => r.data.templates),
  getTemplate: (id) => axiosClient.get(`/reports/templates/${id}`).then((r) => r.data.template),
  saveTemplate: (payload) => axiosClient.post('/reports/templates', payload).then((r) => r.data.template),
  updateTemplate: (id, payload) => axiosClient.put(`/reports/templates/${id}`, payload).then((r) => r.data.template),
  deleteTemplate: (id) => axiosClient.delete(`/reports/templates/${id}`),
  runTemplate: (id) => axiosClient.post(`/reports/templates/${id}/run`).then((r) => r.data),
  stockReport: (payload) => axiosClient.post('/reports/stock', payload).then((r) => r.data),
};
