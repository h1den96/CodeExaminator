import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";
import StudentHistoryPage from "../pages/StudentHistoryPage";
import ResultsPage from "../pages/Results";
import TeacherDashboard from "../pages/TeacherDashboard";
import CreateTestPage from "../pages/CreateTestPage";

import { RequireAuth } from "../auth/RequireAuth";

export default function AppRoutes() {
  return (
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
      <Route
        path="/history"
        element={
          <RequireAuth>
            <StudentHistoryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/results/:id"
        element={
          <RequireAuth>
            <ResultsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/teacher"
        element={
          <RequireAuth>
            <TeacherDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/teacher/create-test"
        element={
          <RequireAuth allowedRoles={["teacher"]}>
            <CreateTestPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}