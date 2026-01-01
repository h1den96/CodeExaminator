// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { RequireAuth } from "../auth/RequireAuth";

// Pages
import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";
import ExamRunner from "../pages/ExamRunner";
import TeacherDashboard from "../pages/TeacherDashboard";
import CreateTestPage from "../pages/CreateTestPage";
import TestDetailsPage from "../pages/TestDetailsPage"; // <--- 1. Don't forget this import

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* Student Routes */}
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
            <Route path="/exam" element={<ExamRunner />} /> 

            {/* Teacher Routes */}
            <Route 
              path="/teacher/dashboard" 
              element={
                <RequireAuth allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </RequireAuth>
              } 
            />
            
            <Route 
              path="/teacher/create-test" 
              element={
                <RequireAuth allowedRoles={['teacher']}>
                  <CreateTestPage />
                </RequireAuth>
              } 
            />

            {/* 👇 ADDED SECURE ROUTE HERE 👇 */}
            <Route 
              path="/teacher/test/:testId" 
              element={
                <RequireAuth allowedRoles={['teacher']}>
                  <TestDetailsPage />
                </RequireAuth>
              } 
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}