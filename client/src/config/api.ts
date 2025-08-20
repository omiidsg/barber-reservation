// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  // Customer endpoints
  TODAY: '/api/today',
  AVAILABLE_SLOTS: '/api/available-slots',
  RESERVATIONS: '/api/reservations',
  
  // Admin endpoints
  ADMIN_LOGIN: '/api/admin/login',
  ADMIN_RESERVATIONS: '/api/admin/reservations',
  ADMIN_HOLIDAYS: '/api/admin/holidays',
  ADMIN_WORKING_HOURS: '/api/admin/working-hours',
  ADMIN_DISABLED_SLOTS: '/api/admin/disabled-slots',
  ADMIN_STATISTICS: '/api/admin/statistics',
  
  // Health check
  HEALTH: '/api/health'
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
