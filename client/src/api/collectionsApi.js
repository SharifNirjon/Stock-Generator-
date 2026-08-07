import axiosClient from './axiosClient';

export const collectionsApi = {
  list: () => axiosClient.get('/collections').then((r) => r.data.collections),
  get: (id) => axiosClient.get(`/collections/${id}`).then((r) => r.data.collection),
  create: (payload) => axiosClient.post('/collections', payload).then((r) => r.data.collection),
  update: (id, payload) => axiosClient.put(`/collections/${id}`, payload).then((r) => r.data.collection),
  remove: (id) => axiosClient.delete(`/collections/${id}`),
};
