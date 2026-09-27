import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || token === "undefined" || token === "null") {
    console.warn("❌ No valid token found. Redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    let userRole = null;

    try {

      if (userStr) {
        const user = JSON.parse(userStr);
        userRole = user.role;
      }

      if (!userRole) {
        const base64Url = token.split(".")[1];
        if (!base64Url) throw new Error("Invalid JWT format");

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        userRole = payload.role;
      }

      console.log("Decoded User Role:", userRole);
      console.log("Allowed Roles for this path:", allowedRoles);

      if (!allowedRoles.includes(userRole)) {
        console.warn(`🚫 Access Denied: Role '${userRole}' not allowed here.`);

        if (userRole === "teacher") {
          return <Navigate to="/teacher/dashboard" replace />;
        } else {
          return <Navigate to="/tests" replace />;
        }
      }

      console.log("✅ Role authorized.");
    } catch (error) {
      console.error("⚠️ Role check failed / Token decoding error:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/login?expired=true" replace />;
    }
  }

  console.log("✅ Auth successful. Rendering content.");
  return <>{children}</>;
}