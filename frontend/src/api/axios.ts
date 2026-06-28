/*import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

// REQUEST Interceptor: Στέλνει το token στο backend
api.interceptors.request.use((config) => {
  // ✅ Χρησιμοποιούμε ΠΑΝΤΟΥ το κλειδί "token"
  const token = localStorage.getItem("token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE Interceptor: Σε πετάει στο login αν το token λήξει
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Redirecting...");
      localStorage.removeItem("token"); // ✅ Καθαρισμός σωστού κλειδιού
      localStorage.removeItem("user");
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;*/

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // ΕΔΩ: Πρέπει να λέει "token" (όπως το είδαμε στην εικόνα σου)
  const token = localStorage.getItem("token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Αν το backend στείλει 401, τότε και μόνο τότε σε πετάει έξω
    if (error.response && error.response.status === 401) {
      console.error("401 Error - Token is invalid or expired");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export default api;7