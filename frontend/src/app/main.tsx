// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App"; // Import the main App component
import "./index.css"; // Keep your styles if you have them

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container missing in index.html");
}

const root = createRoot(container);

// Render ONLY the App component
root.render(<App />);
