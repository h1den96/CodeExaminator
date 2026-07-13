"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTests = listTests;
exports.startTest = startTest;
exports.fetchSubmission = fetchSubmission;
exports.saveAnswers = saveAnswers;
exports.submitSubmission = submitSubmission;
const http_1 = require("./http");
async function listTests() {
    const { data } = await http_1.http.get("/api/tests");
    return data;
}
async function startTest(params) {
    const q = new URLSearchParams();
    if (params?.tf)
        q.set("tf", String(params.tf));
    if (params?.mcq)
        q.set("mcq", String(params.mcq));
    if (params?.prog)
        q.set("prog", String(params.prog));
    const qs = q.toString() ? `?${q.toString()}` : "";
    const { data } = await http_1.http.get(`/api/test/start${qs}`);
    return data; // { submission_id, questions, ... }
}
async function fetchSubmission(id) {
    const { data } = await http_1.http.get(`/api/submissions/${id}`);
    return data;
}
async function saveAnswers(id, answers) {
    await http_1.http.patch(`/api/submissions/${id}/answers`, { answers });
}
async function submitSubmission(id) {
    const { data } = await http_1.http.post(`/api/submissions/${id}/submit`, {});
    return data;
}
