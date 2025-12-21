// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { RequireAuth } from "../auth/RequireAuth";
import ExamRunner from "../pages/ExamRunner";

import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
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

            {/* Route για την Εξέταση */}
            <Route path="/exam" element={<ExamRunner />} /> 

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}