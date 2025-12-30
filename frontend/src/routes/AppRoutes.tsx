import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import AvailableTestsPage from "../pages/AvailableTestsPage";
import RunTestPage from "../pages/RunTestPage";
import CreateTestPage from "../pages/CreateTestPage"; // keeping the import for later

import { RequireAuth } from "../auth/RequireAuth";

export default function AppRoutes() {
  return (
    <Routes>
      {/* --- DEBUG: PUT THIS FIRST --- */}
      {/* If you see "IT WORKS", the router is fine. */}
      <Route 
        path="/teacher/create-test" 
        element={<h1 style={{color: 'red', fontSize: '50px', textAlign: 'center', marginTop: '50px'}}>IT WORKS</h1>} 
      />

      {/* --- STANDARD ROUTES --- */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      {/* STUDENT ROUTES */}
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
    </Routes>
  );
}