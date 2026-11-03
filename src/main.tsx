import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './presentation/context/AuthContext';
import { BookProvider } from './presentation/context/BookContext';
import { ThemeProvider } from './presentation/context/ThemeContext';
import './styles/index.css';

// Register PWA service worker if supported
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline fallback silent catch
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BookProvider>
          <App />
        </BookProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
