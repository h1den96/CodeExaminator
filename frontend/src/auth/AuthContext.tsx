import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type AuthContextType = {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Συγχρονισμός με το localStorage κατά το load της σελίδας
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    // 1. Έλεγχος Token: Αποφυγή τιμών "null" ή "undefined" ως strings
    if (savedToken && savedToken !== "undefined" && savedToken !== "null") {
      setToken(savedToken);
    }

    // 2. Έλεγχος User: Ασφαλές parsing για αποφυγή SyntaxError
    if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("AuthContext: Failed to parse user data from localStorage", error);
        // Αν τα δεδομένα είναι κατεστραμμένα, τα καθαρίζουμε
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  }, []);

  const login = (newToken: string, userData: any) => {
    // Ενημέρωση State
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    // Καθαρισμός State
    setToken(null);
    setUser(null);

    // Καθαρισμός LocalStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Προαιρετικά καθαρίζουμε και παλιά κλειδιά αν υπάρχουν
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
  };

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}