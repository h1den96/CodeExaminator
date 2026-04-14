async function testNormalization() {
    console.log("\n--- 🧠 NORMALIZATION PRECISION TEST ---");
    
    // Κώδικας που επιστρέφει σωστή τιμή αλλά με "περίεργο" formatting
    const messyCode = `
    #include <iostream>
    int main() { 
        std::cout << "  10  " << std::endl; // Spaces + Newline
        return 0; 
    }`;

    try {
        const res = await axios.post(`${API_URL}/submissions/${SUBMISSION_ID}/run`, 
            { question_id: QUESTION_ID, code: messyCode },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        const passed = res.data.test_results?.[0]?.passed;
        if (passed) {
            console.log("✅ Success: System ignored trailing spaces/newlines.");
        } else {
            console.log("❌ Failure: System is too rigid with formatting.");
        }
    } catch (err) {
        console.error("Test failed to run.");
    }
}