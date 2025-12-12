// ============================================================

// src/components/LoadingSpinner.jsx - Reusable Loading Component
import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div className="loading-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      gap: '16px'
    }}>
      <div 
        className="spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '4px solid rgba(102, 126, 234, 0.1)',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {message && (
        <p style={{
          color: '#666',
          fontSize: '14px',
          fontWeight: '500',
          margin: 0
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;