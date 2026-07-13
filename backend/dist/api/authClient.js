"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.signup = void 0;
const http_1 = require("./http");
const signup = async (body) => {
    const { data } = await http_1.http.post("/api/auth/signup", body);
    return data;
};
exports.signup = signup;
const login = async (body) => {
    const { data } = await http_1.http.post("/api/auth/login", body);
    (0, http_1.setAccessToken)(data.access_token);
    return data;
};
exports.login = login;
const logout = async () => {
    await http_1.http.post("/api/auth/logout", {});
    (0, http_1.setAccessToken)(null);
};
exports.logout = logout;
