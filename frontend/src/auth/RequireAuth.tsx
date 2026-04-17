import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const location = useLocation();

  // 1. Παίρνουμε τα δεδομένα από το LocalStorage (ΠΡΟΣΟΧΗ στο όνομα: "token")
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // 2. Έλεγχος αν το token είναι κενό, "undefined" ή "null"
  if (!token || token === "undefined" || token === "null") {
    console.warn("❌ No valid token found. Redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Έλεγχος Roles αν υπάρχουν περιορισμοί (π.χ. ["teacher"])
  if (allowedRoles && allowedRoles.length > 0) {
    let userRole = null;

    try {
      // ΒΗΜΑ Α: Δοκιμάζουμε να πάρουμε το ρόλο κατευθείαν από το user object (πιο γρήγορο/ασφαλές)
      if (userStr) {
        const user = JSON.parse(userStr);
        userRole = user.role;
      }

      // ΒΗΜΑ Β: Fallback. Αν δεν υπάρχει το user object, κάνουμε decode το JWT
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

      // ΒΗΜΑ Γ: Έλεγχος αν ο ρόλος επιτρέπεται
      if (!allowedRoles.includes(userRole)) {
        console.warn(`🚫 Access Denied: Role '${userRole}' not allowed here.`);
        
        // Έξυπνο Redirect: Στείλε τον χρήστη εκεί που ανήκει αντί για λευκή οθόνη
        if (userRole === "teacher") {
          return <Navigate to="/teacher/dashboard" replace />;
        } else {
          return <Navigate to="/tests" replace />;
        }
      }
      
      console.log("✅ Role authorized.");
    } catch (error) {
      console.error("⚠️ Role check failed / Token decoding error:", error);
      
      // Αν σκάσει η αποκρυπτογράφηση, το token είναι μάλλον χαλασμένο. 
      // Τα σβήνουμε όλα και τον στέλνουμε για καθαρό Login.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/login?expired=true" replace />;
    }
  }

  // 4. Όλα τέλεια! Δείξε του τη σελίδα.
  console.log("✅ Auth successful. Rendering content.");
  return <>{children}</>;
}