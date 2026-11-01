/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * three-roadmap-path.js — Deprecated 3D Canvas shim
 * Replaced by roadmap-route-map.js (Student-Explainable Interactive Route Map).
 * This shim ensures 100% backward compatibility with any legacy callers.
 */

(function () {
  'use strict';
  if (typeof window.renderStudentRouteMap === 'function') {
    window.initRoadmapPath = window.renderStudentRouteMap;
  }
})();
