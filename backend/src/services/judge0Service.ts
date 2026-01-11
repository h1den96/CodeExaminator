// backend/src/services/judge0Service.ts
import axios from "axios";

// This points to your Docker container
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class Judge0Service {
  /**
   * Sends code to Judge0 for execution
   */
  static async submitCode(languageId: number, code: string, stdin: string = "") {
    try {
      // 1. Send to Judge0 using Base64 Mode
      // We encode inputs to Base64 to prevent "UTF-8 conversion" errors with special characters.
      const response = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, 
        {
          source_code: Buffer.from(code).toString('base64'), // 👈 Encode Code
          language_id: languageId,
          stdin: Buffer.from(stdin).toString('base64'),      // 👈 Encode Input
          base64_encoded: true                               // 👈 Tell Judge0 we are using Base64
        }
      );

      const result = response.data;
      
      // Status ID 3 means "Accepted" (Code ran successfully)
      const isSuccess = result.status.id === 3;
      
      // 2. Decode the results back to plain text for the Frontend
      // Helper function to safely decode base64 strings or return empty string
      const decode = (str: string | null) => str ? Buffer.from(str, 'base64').toString('utf-8') : "";

      return {
        success: isSuccess,
        status: result.status.description,
        stdout: decode(result.stdout),
        stderr: decode(result.stderr),
        compile_output: decode(result.compile_output),
        message: result.message
      };

    } catch (error: any) {
      console.error("Judge0 Connection Error:", error.message);
      // Fallback response if Docker is down
      return {
        success: false,
        status: "System Error",
        stderr: "Could not connect to code execution engine. Is Docker running?",
        stdout: ""
      };
    }
  }
}