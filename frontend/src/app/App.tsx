// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext"; // Check path if needed (might be ../auth/AuthContext)
import { ThemeProvider } from "../context/ThemeContext";
import { RequireAuth } from "../auth/RequireAuth"; // Check path
import TeacherDashboard from "../pages/TeacherDashboard";
// Pages
import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";
import ExamRunner from "../pages/ExamRunner";

// --- IMPORT THE NEW PAGE ---
import CreateTestPage from "../pages/CreateTestPage"; 

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            <Route
              path="/tests"
              element={
                <RequireAuth>
                  <AvailableTestsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/run-test"
              element={
                <RequireAuth>
                  <RunTestPage />
                </RequireAuth>
              }
            />

            {/* Route for Exam */}
            <Route path="/exam" element={<ExamRunner />} /> 

            {/* --- NEW TEACHER ROUTE --- */}
            <Route 
              path="/teacher/create-test" 
              element={
                <RequireAuth allowedRoles={['teacher']}>
                  <CreateTestPage />
                </RequireAuth>
              } 
            />

            <Route 
              path="/teacher/dashboard" 
              element={
                <RequireAuth allowedRoles={['teacher']}>
                <TeacherDashboard />
        </RequireAuth>
  } 
/>

            {/* Catch-all: If route not found, go Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}