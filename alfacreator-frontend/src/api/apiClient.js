// alfacreator-frontend/src/api/apiClient.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generatePromo = (data) => apiClient.post('/promo/generate', data);

export const uploadAnalyticsFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/analytics/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAnalyticsResult = (taskId) => apiClient.get(`/analytics/results/${taskId}`);

export const generateDocument = (data) => apiClient.post('/documents/generate', data);

// Вот функция, которую мы добавим/исправим
export const runSmartAnalysis = (formData) => {
  return apiClient.post('/smart_analytics/smart', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHistory = (type) => {
  return apiClient.get(`/history/?request_type=${type}`);
};

// Удаляем экспорт по умолчанию, так как мы используем именованные экспорты
// export default apiClient;
