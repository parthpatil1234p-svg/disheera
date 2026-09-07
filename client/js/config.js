/**
 * config.js — Frontend Global Configuration
 *
 * Provides central API endpoint configuration.
 * Automatically adapts to localhost in development and can be overridden
 * for staging / production deployments.
 */

const CONFIG = {
  // Backend API base URL
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://careerpath-ai-backend.onrender.com/api', // Render fallback for production

  // Storage keys in localStorage
  TOKEN_KEY: 'careerpath_token',
  USER_KEY: 'careerpath_user',

  // App Metadata
  APP_NAME: 'CareerPath AI',
  TEAM_NAME: '404 Brain Not Found',
  HACKATHON: 'Hack2Ignite 2026–27',
};

// Export to window for vanilla JS browser usage
window.CONFIG = CONFIG;
