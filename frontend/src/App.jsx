// src/App.jsx - Main Application Router
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from './pages/Home';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load Admin to keep main bundle small
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />
          
          {/* Admin Route (Lazy Loaded) */}
          <Route
            path="/admin-secret-dashboard"
            element={
              <Suspense fallback={<LoadingSpinner message="Loading Admin Panel..." size="large" />}>
                <Admin />
              </Suspense>
            }
          />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '100vh',
                textAlign: 'center',
                padding: '20px'
              }}>
                <h1 style={{ fontSize: '72px', margin: '0' }}>404</h1>
                <p style={{ fontSize: '18px', color: '#666' }}>Page not found</p>
                <a href="/" style={{ 
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px'
                }}>
                  Go Home
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
