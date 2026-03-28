// src/context/ThemeContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    bg: string;
    card: string;
    text: string;
    textSec: string;
    border: string;
    inputBg: string;
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to system preference or light
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("app_theme");
    return (saved as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    // Update body background immediately
    document.body.style.backgroundColor = theme === "dark" ? "#111" : "#f3f4f6";
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Centralized colors for consistency
  const colors = {
    bg: theme === "dark" ? "#1a1a1a" : "#f3f4f6",
    card: theme === "dark" ? "#2a2a2a" : "#ffffff",
    text: theme === "dark" ? "#ffffff" : "#111827",
    textSec: theme === "dark" ? "#9ca3af" : "#4b5563",
    border: theme === "dark" ? "#404040" : "#e5e7eb",
    inputBg: theme === "dark" ? "#1f1f1f" : "#ffffff",
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
