"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePartialGrade = exports.normalizeOutput = void 0;
const normalizeOutput = (str) => {
    if (!str)
        return "";
    return str
        .replace(/\r\n/g, "\n") // Standardize line endings
        .split("\n") // Split by line
        .map((line) => line.trim()) // Trim each line
        .filter((line) => line !== "") // Remove empty lines
        .join(" ") // Join into a single space-separated string
        .trim(); // Final cleanup
};
exports.normalizeOutput = normalizeOutput;
const calculatePartialGrade = (results, totalPoints) => {
    const passed = results.filter((r) => r.status === "Passed").length;
    if (results.length === 0)
        return 0;
    const score = (passed / results.length) * totalPoints;
    return Math.round(score * 100) / 100; // Round to 2 decimals
};
exports.calculatePartialGrade = calculatePartialGrade;
