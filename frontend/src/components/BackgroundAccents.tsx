// src/components/BackgroundAccents.tsx
// A soft, slowly drifting glow (a couple of large blurred color blobs) used to
// keep otherwise-empty branded pages (login, signup, dashboard) from feeling
// stark. Purely decorative: absolutely positioned, non-interactive, sits behind
// content, works with the existing dot-grid (richBackground).
import { useTheme } from "../context/ThemeContext";

export default function BackgroundAccents() {
  const { colors } = useTheme();

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
      <style>{`
        @keyframes glowDriftA {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-6%, 8%) scale(1.08); }
        }
        @keyframes glowDriftB {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(7%, -6%) scale(1.06); }
        }
      `}</style>

      {/* top-right glow */}
      <div
        style={{
          position: "absolute",
          top: "-18%",
          right: "-12%",
          width: "55vw",
          height: "55vw",
          maxWidth: "700px",
          maxHeight: "700px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
          opacity: 0.12,
          filter: "blur(60px)",
          animation: "glowDriftA 24s ease-in-out infinite",
        }}
      />

      {/* bottom-left glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-14%",
          width: "50vw",
          height: "50vw",
          maxWidth: "620px",
          maxHeight: "620px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
          opacity: 0.1,
          filter: "blur(60px)",
          animation: "glowDriftB 28s ease-in-out infinite",
        }}
      />
    </div>
  );
}