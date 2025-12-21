// src/main.tsx
/*import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '../auth/AuthContext';
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage';
import AvailableTestsPage from '../pages/AvailableTestsPage';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing in index.html');
}

const root = createRoot(container);

root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />


        <Route path="/" element={<Home />} />

        <Route path="/tests" element={<AvailableTestsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
*/

// src/main.tsx
import { createRoot } from 'react-dom/client';
import App from './App'; // Import the main App component
import './index.css';    // Keep your styles if you have them

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing in index.html');
}

const root = createRoot(container);

// Render ONLY the App component
root.render(<App />);