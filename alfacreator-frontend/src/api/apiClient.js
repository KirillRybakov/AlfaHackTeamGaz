import axios from 'axios';

// Создаем инстанс axios
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для автоматического добавления токена в заголовки
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Экспортируем каждую функцию по имени
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

export const runSmartAnalysis = (formData) => {
  return apiClient.post('/smart_analytics/smart', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHistory = (type) => {
  return apiClient.get(`/history/?request_type=${type}`);
};

// Функции для аутентификации
export const registerUser = (email, password) => {
  return apiClient.post('/auth/register', { email, password });
};

export const loginUser = (email, password) => {
  const formData = new FormData();
  formData.append('username', email); // FastAPI OAuth2 требует 'username'
  formData.append('password', password);
  return apiClient.post('/auth/token', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getCurrentUserProfile = () => {
  return apiClient.get('/auth/users/me');
};

// Функция для чата SMM-бота
export const sendChatMessage = (formData) => {
  return apiClient.post('/smm_bot/chat', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Исправлена опечатка 'form--data'
    },
  });
};

// Экспорт по умолчанию не используется, чтобы все импорты были одинаковыми.