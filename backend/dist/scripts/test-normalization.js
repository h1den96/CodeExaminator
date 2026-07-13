"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_URL = process.env.API_URL || "http://localhost:5000";
const SUBMISSION_ID = 1;
const QUESTION_ID = 82;
const TOKEN = process.env.TOKEN || "mock_token";
async function testNormalization() {
    console.log("\n--- NORMALIZATION PRECISION TEST ---");
    const messyCode = `
    #include <iostream>
    int main() { 
        std::cout << "  10  " << std::endl; 
        return 0; 
    }`;
    try {
        const res = await axios_1.default.post(`${API_URL}/submissions/${SUBMISSION_ID}/run`, { question_id: QUESTION_ID, code: messyCode }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        const passed = res.data.test_results?.[0]?.passed;
        if (passed) {
            console.log("Success: System ignored trailing spaces/newlines.");
        }
        else {
            console.log("Failure: System is too rigid with formatting.");
        }
    }
    catch (err) {
        console.error("Test failed to run.");
    }
}
testNormalization();
