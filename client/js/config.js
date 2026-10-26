/**
 * config.js — Frontend Global Configuration
 *
 * Provides centralized API endpoint and runtime settings for Disheera.
 * Automatically switches between local development and production Render backend.
 *
 * ⚠️ PRODUCTION DEPLOYMENT NOTE:
 * When deploying the frontend to Vercel and backend to Render:
 * 1. Replace "YOUR-RENDER-SERVICE" below with your actual deployed Render service slug.
 *    Example: "https://disheera-api.onrender.com/api"
 * 2. Do not include a trailing slash after "/api".
 */

(function () {
  // Detect environment
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  const isVercel =
    window.location.hostname.endsWith('vercel.app') ||
    window.location.hostname === 'disheera.vercel.app';

  const isCustomDomain =
    window.location.hostname === 'disheera.site' ||
    window.location.hostname === 'www.disheera.site' ||
    window.location.hostname.endsWith('disheera.site') ||
    window.location.hostname === 'disheera.site' ||
    window.location.hostname === 'www.disheera.site' ||
    window.location.hostname.endsWith('.is-local.org');

  // Local development backend URL
  const LOCAL_API_URL = 'http://localhost:5000/api';
  const LOCAL_REALTIME_URL = 'http://localhost:5000';

  // Production Persistent Real-Time & WebSockets (Render 24/7 worker on api.disheera.site)
  const PRODUCTION_REALTIME_URL = 'https://api.disheera.site';

  // Production Request-Driven API: Same-origin Vercel Gateway (/api) eliminates CORS preflight latency
  // Routes short-lived APIs to Vercel Serverless and heavy compute to Render via vercel.json rewrites
  // Primary Production API endpoint: Direct to high-performance verified cloud cluster
  const PRODUCTION_REST_API = 'https://api.disheera.site/api';

  const CONFIG = {
    // Stateless REST API (Vercel Serverless / Same-Origin in Prod, localhost:5000 in dev)
    API_BASE_URL: isLocal ? LOCAL_API_URL : PRODUCTION_REST_API,

    // Dedicated Heavy Compute & Background Operations Endpoint
    HEAVY_API_BASE_URL: isLocal ? LOCAL_API_URL : 'https://api.disheera.site/api',

    // Persistent Real-Time & WebSockets (Render in Prod, localhost:5000 in dev)
    REALTIME_BASE_URL: isLocal ? LOCAL_REALTIME_URL : PRODUCTION_REALTIME_URL,
    SOCKET_URL: isLocal ? LOCAL_REALTIME_URL : PRODUCTION_REALTIME_URL,

    // Canonical Domain
    CANONICAL_URL: isLocal ? 'http://localhost:5500' : 'https://disheera.site',

    // Storage keys in localStorage
    TOKEN_KEY: 'careerpath_token',
    USER_KEY: 'careerpath_user',

    // Google OAuth 2.0 Web Client ID
    GOOGLE_CLIENT_ID: '775964648976-uch5uo5ho5185b4sqsuaknkpc2r64g27.apps.googleusercontent.com',

    // GitHub OAuth 2.0 Web Client ID
    GITHUB_CLIENT_ID: 'Ov23liphgi9YF1lbYiUa',

    // App Metadata
    APP_NAME: 'Disheera',
    TAGLINE: 'Autonomous Career GPS & Verified Talent Operating System',
    PLATFORM_NAME: 'Disheera',
    COMPANY_NAME: 'Disheera Technologies Inc.',
    TEAM_NAME: 'Disheera Technologies Inc.',
    EDITION: 'Enterprise Edition 2026',
    VERSION: '2.5.0',
  };

    // Expose to window for vanilla JS scripts
    window.CONFIG = CONFIG;

    // Vercel Web Analytics (@vercel/analytics) Universal Queue & Event Tracker
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.trackVercelEvent = function (name, data) {
      try {
        if (typeof window !== 'undefined' && window.va) {
          window.va('event', { name, data: data || {} });
        }
      } catch (err) {
        console.debug('[Vercel Analytics]', err);
      }
    };

    // Universal Notch Navbar Scroll Elevation
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const notch = document.querySelector('.cp-navbar-notch');
        if (notch) {
          if (window.scrollY > 25) {
            notch.classList.add('scrolled');
          } else {
            notch.classList.remove('scrolled');
          }
        }
      }, { passive: true });
    }
  })();

