import React from 'react';

interface DarkModeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isDarkMode, onToggle }) => {
  return (
    <div className="toggle-switch-container">
      <button
        onClick={onToggle}
        className={`toggle-switch ${isDarkMode ? 'active' : ''}`}
        title={isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
      >
        <div className="toggle-slider">
          <div className="toggle-icon">
            {isDarkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

export default DarkModeToggle; 