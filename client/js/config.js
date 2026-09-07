/**
 * config.js — Frontend Global Configuration
 *
 * Provides centralized API endpoint and runtime settings for CareerPath AI.
 * Automatically switches between local development and production Render backend.
 *
 * ⚠️ PRODUCTION DEPLOYMENT NOTE:
 * When deploying the frontend to Vercel and backend to Render:
 * 1. Replace "YOUR-RENDER-SERVICE" below with your actual deployed Render service slug.
 *    Example: "https://careerpath-ai-api.onrender.com/api"
 * 2. Do not include a trailing slash after "/api".
 */

(function () {
  // Detect local environment based on browser hostname
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  // Local development backend URL
  const LOCAL_API_URL = 'http://localhost:5000/api';

  // Production Render backend URL placeholder
  // TODO: Replace "YOUR-RENDER-SERVICE" with your real Render Web Service name upon deployment!
  const PRODUCTION_API_URL = 'https://YOUR-RENDER-SERVICE.onrender.com/api';

  const CONFIG = {
    // Active API Base URL
    API_BASE_URL: isLocal ? LOCAL_API_URL : PRODUCTION_API_URL,

    // Storage keys in localStorage
    TOKEN_KEY: 'careerpath_token',
    USER_KEY: 'careerpath_user',

    // App & Hackathon Metadata
    APP_NAME: 'CareerPath AI',
    TAGLINE: 'Discover Your Career. Build Your Skills.',
    TEAM_NAME: '404 Brain Not Found',
    HACKATHON: 'Hack2Ignite 2026–27 (Round 1)',
    VERSION: '1.0.0',
  };

  // Expose to window for vanilla JS scripts
  window.CONFIG = CONFIG;
})();
