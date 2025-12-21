// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
// import TestsPage from "../pages/TestsPage";
import LoginPage from "../pages/LoginPage";
//import ResultsPage from "../pages/ResultsPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";

import { RequireAuth } from "../auth/RequireAuth";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<LoginPage />} />

      {/* ΛΙΣΤΑ διαθέσιμων tests */}
      <Route
        path="/tests"
        element={
          <RequireAuth>
            <AvailableTestsPage />
          </RequireAuth>
        }
      />

      {/* Τρέξιμο συγκεκριμένου test */}
      <Route
        path="/run-test"
        element={
          <RequireAuth>
            <RunTestPage />
          </RequireAuth>
        }
      />

      {/* Αποτελέσματα, αν τα έχεις */}
    </Routes>
  );
}
