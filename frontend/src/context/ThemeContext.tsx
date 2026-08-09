// src/context/ThemeContext.tsx
import React, {
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
    textMuted: string;
    border: string;
    inputBg: string;

    // brand accent (teal)
    accent: string;
    accentHover: string;
    accentSubtle: string;
    accentText: string;

    // semantic status colors
    successBg: string;
    successText: string;
    successBorder: string;

    dangerBg: string;
    dangerText: string;
    dangerBorder: string;

    warningBg: string;
    warningText: string;
    warningBorder: string;

    neutralBg: string;
    neutralText: string;

    codeBg: string;
    codeText: string;
    codeBorder: string;

    // background texture tokens
    gridDot: string;
    gridDotSubtle: string;
    washTint: string;
  };
  fontMono: string;
  /** Ready-to-spread background style: dot grid + soft top wash + use with <BackgroundAccents />.
   *  Use on login/signup/dashboard-style pages. */
  richBackground: React.CSSProperties;
  /** Ready-to-spread background style: faint dot grid only, no wash, no accents.
   *  Use on exam/results/report pages so it's not a stark flat block but stays calm. */
  subtleBackground: React.CSSProperties;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const fontMono =
  "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("app_theme");
    return (saved as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    document.body.style.backgroundColor = theme === "dark" ? "#0f1115" : "#f3f4f6";
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const light = {
    bg: "#f3f4f6",
    card: "#ffffff",
    text: "#111827",
    textSec: "#4b5563",
    textMuted: "#9ca3af",
    border: "#e5e7eb",
    inputBg: "#ffffff",

    accent: "#0f6e56",
    accentHover: "#0b5744",
    accentSubtle: "#e1f5ee",
    accentText: "#085041",

    successBg: "#dcfce7",
    successText: "#166534",
    successBorder: "#86efac",

    dangerBg: "#fee2e2",
    dangerText: "#991b1b",
    dangerBorder: "#fecaca",

    warningBg: "#fef3c7",
    warningText: "#92400e",
    warningBorder: "#fde68a",

    neutralBg: "#f3f4f6",
    neutralText: "#4b5563",

    codeBg: "#1e293b",
    codeText: "#f8fafc",
    codeBorder: "#334155",

    gridDot: "rgba(15, 23, 42, 0.14)",
    gridDotSubtle: "rgba(15, 23, 42, 0.08)",
    washTint: "rgba(15, 110, 86, 0.07)",
  };

  const dark = {
    bg: "#0f1115",
    card: "#1a1d23",
    text: "#f3f4f6",
    textSec: "#9ca3af",
    textMuted: "#6b7280",
    border: "#2d3139",
    inputBg: "#15171c",

    accent: "#5dcaa5",
    accentHover: "#9fe1cb",
    accentSubtle: "#0c2a23",
    accentText: "#5dcaa5",

    successBg: "#122a1a",
    successText: "#4ade80",
    successBorder: "#166534",

    dangerBg: "#2e1518",
    dangerText: "#f87171",
    dangerBorder: "#7f1d1d",

    warningBg: "#2b2210",
    warningText: "#fbbf24",
    warningBorder: "#92400e",

    neutralBg: "#20242c",
    neutralText: "#9ca3af",

    codeBg: "#0c0e12",
    codeText: "#e5e7eb",
    codeBorder: "#2d3139",

    gridDot: "rgba(255, 255, 255, 0.12)",
    gridDotSubtle: "rgba(255, 255, 255, 0.06)",
    washTint: "rgba(93, 202, 165, 0.06)",
  };

  const colors = theme === "dark" ? dark : light;

  const richBackground: React.CSSProperties = {
    backgroundColor: colors.bg,
    backgroundImage: `linear-gradient(to bottom, ${colors.washTint}, transparent 280px), radial-gradient(${colors.gridDot} 1.3px, transparent 1.3px)`,
    backgroundSize: "auto, 22px 22px",
    backgroundRepeat: "no-repeat, repeat",
  };

  const subtleBackground: React.CSSProperties = {
    backgroundColor: colors.bg,
    backgroundImage: `radial-gradient(${colors.gridDotSubtle} 1.2px, transparent 1.2px)`,
    backgroundSize: "24px 24px",
    backgroundRepeat: "repeat",
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, colors, fontMono, richBackground, subtleBackground }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}