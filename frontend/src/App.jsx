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

// ============================================================

// src/main.jsx - Application Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1>⚠️ Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            We're sorry for the inconvenience. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);