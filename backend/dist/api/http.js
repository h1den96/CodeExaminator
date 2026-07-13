"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.http = void 0;
exports.getAccessToken = getAccessToken;
exports.setAccessToken = setAccessToken;
const axios_1 = __importDefault(require("axios"));
const API = (process.env.VITE_API_URL || process.env.API_URL) ?? "http://localhost:3000";
exports.http = axios_1.default.create({
    baseURL: API,
    withCredentials: true,
});
function getAccessToken() {
    return localStorage.getItem("access_token");
}
function setAccessToken(tok) {
    if (tok)
        localStorage.setItem("access_token", tok);
    else
        localStorage.removeItem("access_token");
}
exports.http.interceptors.request.use((cfg) => {
    const tok = getAccessToken();
    if (tok)
        cfg.headers.Authorization = `Bearer ${tok}`;
    return cfg;
});
let refreshing = null;
exports.http.interceptors.response.use((r) => r, async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
        original._retry = true;
        if (!refreshing) {
            refreshing = (async () => {
                try {
                    const { data } = await axios_1.default.post(`${API}/api/auth/refresh`, {}, { withCredentials: true });
                    setAccessToken(data.access_token);
                    return data.access_token;
                }
                catch {
                    setAccessToken(null);
                    return null;
                }
                finally {
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
            return (0, exports.http)(original);
        }
    }
    throw err;
});
