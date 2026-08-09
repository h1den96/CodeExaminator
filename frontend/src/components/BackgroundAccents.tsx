// src/components/BackgroundAccents.tsx
// Large, very faint corner accents (curly braces + a code-tag mark) used to keep
// otherwise-empty branded pages (login, signup, dashboard) from feeling stark.
// Purely decorative: absolutely positioned, non-interactive, sits behind content.
import { useTheme } from "../context/ThemeContext";

export default function BackgroundAccents() {
  const { colors, fontMono } = useTheme();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "-70px",
          right: "-10px",
          fontSize: "280px",
          lineHeight: 1,
          fontFamily: fontMono,
          fontWeight: 700,
          color: colors.accent,
          opacity: 0.05,
          transform: "rotate(-4deg)",
          userSelect: "none",
        }}
      >
        {"}"}
      </span>
      <span
        style={{
          position: "absolute",
          bottom: "-90px",
          left: "-20px",
          fontSize: "240px",
          lineHeight: 1,
          fontFamily: fontMono,
          fontWeight: 700,
          color: colors.accent,
          opacity: 0.05,
          transform: "rotate(3deg)",
          userSelect: "none",
        }}
      >
        {"{"}
      </span>
      <span
        style={{
          position: "absolute",
          bottom: "40px",
          right: "6%",
          fontSize: "64px",
          lineHeight: 1,
          fontFamily: fontMono,
          fontWeight: 700,
          color: colors.accent,
          opacity: 0.06,
          userSelect: "none",
        }}
      >
        {"</>"}
      </span>
    </div>
  );
}