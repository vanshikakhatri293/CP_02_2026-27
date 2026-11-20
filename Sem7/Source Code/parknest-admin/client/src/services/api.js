import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return import.meta.env.DEV ? 'http://localhost:5002/api' : 'https://parknest-wt7j.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const parkingService = {
  getSlots: () => api.get('/parking/slots'),
  getSlot: (id) => api.get(`/parking/slots/${id}`),
  createSlot: (data) => api.post('/parking/slots', data),
  updateSlot: (id, data) => api.put(`/parking/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/parking/slots/${id}`),
  getAreas: () => api.get('/parking/areas'),
  createArea: (data) => api.post('/parking/areas', data),
  updateArea: (id, data) => api.put(`/parking/areas/${id}`, data),
};

export const sensorService = {
  getSensors: () => api.get('/sensors'),
  getSensor: (id) => api.get(`/sensors/${id}`),
  getHealth: () => api.get('/sensors/health'),
  updateSensorData: (data) => api.post('/sensors/update', data),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const reservationService = {
  getReservations: () => api.get('/reservations'),
  createReservation: (data) => api.post('/reservations', data),
  cancelReservation: (id) => api.post(`/reservations/${id}/cancel`),
};

export const userService = {
  login: (phone) => api.post('/users/login', { phone }),
  updateProfile: (data) => api.put('/users/profile', data),
};

export default api;
