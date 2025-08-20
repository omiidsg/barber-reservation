import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#667eea',
  text = 'در حال بارگذاری...'
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      default:
        return 36;
    }
  };

  const spinnerSize = getSize();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem',
    }}>
      <div style={{
        position: 'relative',
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
      }}>
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: `3px solid rgba(102, 126, 234, 0.2)`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
      {text && (
        <p style={{
          margin: 0,
          color: '#666',
          fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 500,
        }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 