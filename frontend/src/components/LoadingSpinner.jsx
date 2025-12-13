import React from 'react';

function LoadingSpinner({ size = 'medium', message = '', className = '' }) {
  const sizes = { small: 16, medium: 32, large: 56 };
  const dim = sizes[size] || sizes.medium;

  return (
    <div
      className={`loading-spinner ${className}`}
      role="status"
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#e6e6e6"
          strokeWidth="4"
        />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="#667eea"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {message ? (
        <span style={{ color: '#444', fontSize: 14 }}>{message}</span>
      ) : null}
    </div>
  );
}

export default LoadingSpinner;
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