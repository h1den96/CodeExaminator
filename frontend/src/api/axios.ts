import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Η διεύθυνση του Backend σου
  withCredentials: true, // Σημαντικό για τα cookies
});

// Interceptor: Πριν φύγει το request, βάλε το Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // Θα το αποθηκεύουμε εδώ στο Login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;