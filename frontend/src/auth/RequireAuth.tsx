// 1. Import React to fix the "Namespace JSX" error
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
  // 2. Use React.ReactNode instead of JSX.Element (it is more robust)
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const location = useLocation();

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const payload = JSON.parse(jsonPayload);
      const userRole = payload.role;

      if (!allowedRoles.includes(userRole)) {
        console.warn(
          `Access Denied: Role '${userRole}' is not in [${allowedRoles}]`,
        );
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      console.error("Failed to decode token", error);
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
