import axiosClient from './axiosClient';

export const entriesApi = {
  list: (collectionId, params) =>
    axiosClient.get(`/collections/${collectionId}/entries`, { params }).then((r) => r.data),
  get: (collectionId, entryId) =>
    axiosClient.get(`/collections/${collectionId}/entries/${entryId}`).then((r) => r.data.entry),
  create: (collectionId, data) =>
    axiosClient.post(`/collections/${collectionId}/entries`, { data }).then((r) => r.data.entry),
  update: (collectionId, entryId, data) =>
    axiosClient.put(`/collections/${collectionId}/entries/${entryId}`, { data }).then((r) => r.data.entry),
  remove: (collectionId, entryId) => axiosClient.delete(`/collections/${collectionId}/entries/${entryId}`),
  bulkDelete: (collectionId, ids) =>
    axiosClient.post(`/collections/${collectionId}/entries/bulk-delete`, { ids }).then((r) => r.data),
  previewImport: (collectionId, file) => {
    const form = new FormData();
    form.append('file', file);
    return axiosClient
      .post(`/collections/${collectionId}/entries/import/preview`, form)
      .then((r) => r.data);
  },
  importCsv: (collectionId, file, mapping) => {
    const form = new FormData();
    form.append('file', file);
    form.append('mapping', JSON.stringify(mapping));
    return axiosClient.post(`/collections/${collectionId}/entries/import`, form).then((r) => r.data);
  },
};
