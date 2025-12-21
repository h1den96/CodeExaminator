import { gradeSubmission } from './src/services/gradingService';

async function test() {
    // ID 134 links Submission 19 -> Question 2 (Factorial)
    const SUBMISSION_Q_ID = 134; 
    
    // This is the Correct Solution for Factorial
    const STUDENT_CODE = `
    #include <iostream>
    using namespace std;
    
    long long factorial(int n) {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }
    
    int main() {
        int n;
        cin >> n;
        cout << factorial(n);
        return 0;
    }
    `;

    try {
        console.log("--- Starting Live Test ---");
        
        // UPDATE: Pass only 2 arguments now
        const result = await gradeSubmission(SUBMISSION_Q_ID, STUDENT_CODE);
        
        console.log("--- SUCCESS! ---");
        console.log("Answer ID Saved:", result.answer_id);
        console.log("Final Grade:", result.question_grade);
    } catch (error) {
        console.error("Test failed", error);
    }
}

test();