import React, { useEffect, useState } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
      fontWeight: 500,
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease',
      maxWidth: '400px',
      minWidth: '300px',
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: 'rgba(40, 167, 69, 0.9)',
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      case 'error':
        return {
          ...baseStyles,
          background: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      case 'warning':
        return {
          ...baseStyles,
          background: 'rgba(255, 193, 7, 0.9)',
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      case 'info':
        return {
          ...baseStyles,
          background: 'rgba(102, 126, 234, 0.9)',
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div style={getStyles()}>
      <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0',
          opacity: 0.7,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        ×
      </button>
    </div>
  );
};

export default Notification; 