import axios from "axios";

const API =
  (process.env.VITE_API_URL || process.env.API_URL) ?? "http://localhost:3000";

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
});

function getAccessToken() {
  return localStorage.getItem("access_token");
}
function setAccessToken(tok: string | null) {
  if (tok) localStorage.setItem("access_token", tok);
  else localStorage.removeItem("access_token");
}

http.interceptors.request.use((cfg) => {
  const tok = getAccessToken();
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

http.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = (async () => {
          try {
            const { data } = await axios.post(
              `${API}/api/auth/refresh`,
              {},
              { withCredentials: true },
            );
            setAccessToken(data.access_token);
            return data.access_token as string;
          } catch {
            setAccessToken(null);
            return null;
          } finally {
            refreshing = null;
          }
        })();
      }
      const tok = await refreshing;
      if (tok) {
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${tok}`,
        };
        return http(original);
      }
    }
    throw err;
  },
);

export { getAccessToken, setAccessToken };
