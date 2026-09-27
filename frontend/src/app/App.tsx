import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { RequireAuth } from "../auth/RequireAuth";

import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";
import ExamRunner from "../pages/ExamRunner";

import TeacherDashboard from "../pages/TeacherDashboard";
import CreateTestPage from "../pages/CreateTestPage";
import TestDetailsPage from "../pages/TestDetailsPage";
import StudentHistoryPage from "../pages/StudentHistoryPage";

import QuestionTypeSelection from "../pages/QuestionTypeSelection";
import CreateProgrammingQuestion from "../pages/CreateProgrammingQuestion";
import CreateMCQ from "../pages/CreateMCQ";
import CreateTF from "../pages/CreateTF";
import Results from "../pages/Results";
import TeacherGradingDashboard from '../pages/TeacherGradingDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>

          <Routes>
            
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            <Route path="/tests" element={<RequireAuth><AvailableTestsPage /></RequireAuth>} />
            <Route path="/run-test" element={<RequireAuth><RunTestPage /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><StudentHistoryPage /></RequireAuth>} />
            <Route path="/exam" element={<RequireAuth><ExamRunner /></RequireAuth>} />

            <Route path="/results/:id" element={<RequireAuth><Results /></RequireAuth>} />

            <Route path="/teacher/dashboard" element={<RequireAuth allowedRoles={["teacher"]}><TeacherDashboard /></RequireAuth>} />
            <Route path="/teacher/create-test" element={<RequireAuth allowedRoles={["teacher"]}><CreateTestPage /></RequireAuth>} />
            <Route path="/teacher/test/:testId" element={<RequireAuth allowedRoles={["teacher"]}><TestDetailsPage /></RequireAuth>} />
            <Route path="/teacher/grading" element={<RequireAuth allowedRoles={["teacher"]}><TeacherGradingDashboard /></RequireAuth>} />

            <Route path="/teacher/create-question-hub" element={<RequireAuth allowedRoles={["teacher"]}><QuestionTypeSelection /></RequireAuth>} />
            <Route path="/teacher/create-programming" element={<RequireAuth allowedRoles={["teacher"]}><CreateProgrammingQuestion /></RequireAuth>} />
            <Route path="/teacher/create-mcq" element={<RequireAuth allowedRoles={["teacher"]}><CreateMCQ /></RequireAuth>} />
            <Route path="/teacher/create-tf" element={<RequireAuth allowedRoles={["teacher"]}><CreateTF /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
