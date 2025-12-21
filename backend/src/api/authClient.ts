import { http, setAccessToken } from "./http";

export const signup = async (body: { email: string; password: string; full_name?: string|null }) => {
  const { data } = await http.post("/api/auth/signup", body);
  return data;
};

export const login = async (body: { email: string; password: string }) => {
  const { data } = await http.post("/api/auth/login", body);
  setAccessToken(data.access_token);
  return data;
};

export const logout = async () => {
  await http.post("/api/auth/logout", {});
  setAccessToken(null);
};
