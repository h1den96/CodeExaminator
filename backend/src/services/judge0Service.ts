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
      // 1. Send to Judge0
      // wait=true makes it synchronous (easier for now)
      const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
        source_code: code,
        language_id: languageId,
        stdin: stdin
      });

      const result = response.data;
      
      // Status ID 3 means "Accepted" (Code ran successfully)
      const isSuccess = result.status.id === 3;
      
      return {
        success: isSuccess,
        status: result.status.description,
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output,
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