// alfacreator-frontend-old/src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  // Теперь базовый URL - это просто /api/v1. Nginx сделает остальное.
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generatePromo = (data) => {
  return apiClient.post('/promo/generate', data);
};

export const uploadAnalyticsFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/analytics/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getAnalyticsResult = (taskId) => {
  return apiClient.get(`/analytics/results/${taskId}`);
};

export const generateDocument = (data) => {
  return apiClient.post('/documents/generate', data);
};