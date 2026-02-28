# CodeExaminer 🎓

CodeExaminer is a robust, full-stack automated examination platform designed for educators to create, manage, and grade programming and theoretical assessments. It features a real-time code execution engine, dynamic question generation, and strict static analysis to ensure academic integrity.

---

## 🚀 Key Features

### 🛠️ For Teachers
* **Universal Question Bank**: Supports Multiple Choice (MCQ), True/False, and complex Programming tasks.
* **Dynamic Test Blueprinting**: Define exam "laws" (e.g., 2 MCQs, 3 Programming) and "filters" (difficulty distribution and topics).
* **Live Test Case Management**: Edit C++ test cases directly through the teacher dashboard to update grading criteria on the fly.
* **Topic Management**: Organize questions by categories like "C++ Basics," "OOP," and "Arrays & Strings."

### ✍️ For Students
* **Integrated Code Runner**: Write and test C++ code in-browser with real-time feedback powered by **Judge0**.
* **Resume Capability**: Progress is automatically saved, allowing students to resume "In-Progress" tests if they get disconnected.
* **Instant Results**: Automated grading for theoretical questions and unit-test-based grading for programming tasks.

### 🧠 Smart Grading & Integrity
* **Static Analysis**: Automatically scans code for forbidden keywords (e.g., banning `for` loops in recursion tasks) or required keywords.
* **Dynamic MCQ Scoring**: Supports partial credit and negative marking weights for multi-select questions.
* **Automated Unit Testing**: Runs student code against multiple batch inputs and calculates scores based on passed test cases.

---

## 🏗️ Technical Architecture


### **The Stack**
* **Frontend**: React (TypeScript), Vite, CSS3
* **Backend**: Node.js, Express (TypeScript), PostgreSQL (pg)
* **Execution Engine**: Judge0 (Dockerized) for secure, isolated code execution

---

## 🛠️ Installation & Setup

### **1. Local Development (Current)**
Currently, the system is designed for local deployment using Docker and PostgreSQL.
1. **Database**: Ensure PostgreSQL is running; create `exam_system` and initialize the `auth` and `exam` schemas.
2. **Judge0**: Start the execution engine via Docker: `docker run -d -p 2358:2358 judge0/judge0`.
3. **Backend**: Configure your `.env` and run `npm run dev`.
4. **Frontend**: Run `npm install` and `npm run dev`.

### **2. Cloud Hosting (🚀 Coming Soon)**
> [!IMPORTANT]
> **Production Hosting is currently under construction.**
> I am currently working on a cloud-native deployment strategy.
