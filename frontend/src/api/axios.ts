import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // Η διεύθυνση του Backend σου
  withCredentials: true, // Σημαντικό για τα cookies
});

// Interceptor: Πριν φύγει το request, βάλε το Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // Θα το αποθηκεύουμε εδώ στο Login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: The "Bouncer"
api.interceptors.response.use(
  (response) => {
    // If the request was good, just pass it through
    return response;
  },
  (error) => {
    // If the error is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Logging out...");

      // 1. Clear the bad token from storage
      localStorage.removeItem("accessToken"); // use token if needed
      localStorage.removeItem("user");

      // 2. Force redirect to login page
      // Note: We use window.location because hooks like useNavigate won't work inside this plain JS file
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=tue";
      }
    }

    // Pass the error down so your components still know it failed
    return Promise.reject(error);
  },
);

export default api;
