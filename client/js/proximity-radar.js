/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * proximity-radar.js - Pan-India Industrial Proximity Radar (Background Live Location)
 * Dynamically computes Haversine distance to 60+ verified employers across India
 * with zero heavy map canvas overhead.
 *
 * Disheera - Enterprise Industrial Platform
 */

(function () {
  // Flagship default reference coordinates (Jalgaon, Khandesh, Maharashtra)
  const DEFAULT_LAT = 21.0077;
  const DEFAULT_LNG = 75.5626;

  let userLat = null;
  let userLng = null;
  let hasGpsLocation = false;
  let activeRadius = 'all';
  let cachedCompanies = [];

  document.addEventListener('DOMContentLoaded', () => {
    initProximityRadar();
  });

  function initProximityRadar() {
    const radarTab = document.getElementById('tabRadar');
    const refreshGpsBtn = document.getElementById('btnRefreshGps');
    const clusterSelect = document.getElementById('filterRadarCluster');
    const searchInput = document.getElementById('radarSearchInput');
    const clearSearchBtn = document.getElementById('btnClearRadarSearch');
    const fresherOnlyCheck = document.getElementById('filterRadarFresherOnly');
    const verifiedOnlyCheck = document.getElementById('filterRadarVerifiedOnly');
    const radiusGroup = document.getElementById('radarRadiusFilterGroup');
    const resetRadiusBtn = document.getElementById('btnResetRadarFilters');

    // Radius Filter Buttons
    if (radiusGroup) {
      radiusGroup.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          radiusGroup.querySelectorAll('button').forEach((b) => b.classList.remove('active', 'btn-teal', 'text-white'));
          btn.classList.add('active', 'btn-teal', 'text-white');
          activeRadius = btn.getAttribute('data-radius');
          fetchAndRenderRadarCompanies();
        });
      });
    }

    if (resetRadiusBtn) {
      resetRadiusBtn.addEventListener('click', () => {
        window.resetRadarFilters();
      });
    }

    window.resetRadarFilters = function () {
      activeRadius = 'all';
      if (radiusGroup) {
        radiusGroup.querySelectorAll('button').forEach((b) => {
          if (b.getAttribute('data-radius') === 'all') {
            b.classList.add('active');
          } else {
            b.classList.remove('active', 'btn-teal', 'text-white');
          }
        });
      }
      if (clusterSelect) clusterSelect.value = 'all';
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      fetchAndRenderRadarCompanies();
    };

    if (clusterSelect) {
      clusterSelect.addEventListener('change', () => {
        fetchAndRenderRadarCompanies();
      });
    }

    if (fresherOnlyCheck) {
      fresherOnlyCheck.addEventListener('change', () => {
        fetchAndRenderRadarCompanies();
      });
    }

    if (verifiedOnlyCheck) {
      verifiedOnlyCheck.addEventListener('change', () => {
        fetchAndRenderRadarCompanies();
      });
    }

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
        }
        debounce = setTimeout(() => {
          fetchAndRenderRadarCompanies();
        }, 180);
      });
    }

    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        fetchAndRenderRadarCompanies();
        searchInput.focus();
      });
    }

    if (refreshGpsBtn) {
      refreshGpsBtn.addEventListener('click', () => {
        requestLiveGeolocation(true);
      });
    }

    // Auto-detect location silently in the background
    requestLiveGeolocation(false);

    // If tab is clicked, ensure data is fresh
    if (radarTab) {
      radarTab.addEventListener('shown.bs.tab', () => {
        if (cachedCompanies.length === 0) {
          fetchAndRenderRadarCompanies();
        }
      });
    }
  }

  /**
   * Multi-tier Geolocation Request:
   * Tier 1: Real-time browser GPS (accurate to meters)
   * Tier 2: Vercel Edge IP Geolocation (instant city-level detection, zero prompts)
   * Tier 3: Reference Hub (Khandesh & MIDC Jalgaon)
   */
  function requestLiveGeolocation(isUserTriggered = false) {
    const statusEl = document.getElementById('radarTelemetryStatus');
    const btnGpsText = document.getElementById('btnGpsText');

    if (isUserTriggered && btnGpsText) {
      btnGpsText.textContent = 'Acquiring GPS...';
    }

    if (!('geolocation' in navigator)) {
      fallbackToIpOrHub(isUserTriggered ? 'Browser Geolocation API unavailable.' : null);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: isUserTriggered,
      timeout: isUserTriggered ? 10000 : 7000,
      maximumAge: 120000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        hasGpsLocation = true;

        if (statusEl) {
          statusEl.innerHTML = `
            <span class="text-success fw-semibold">📡 Background Live GPS Connected:</span>
            Lat ${userLat.toFixed(2)}°N, Lng ${userLng.toFixed(2)}°E · Haversine sorting active across India.
          `;
        }
        if (btnGpsText) btnGpsText.textContent = 'GPS Active (Locked)';
        fetchAndRenderRadarCompanies();
      },
      (err) => {
        // If high accuracy failed when user clicked, retry once with low accuracy (fast Wi-Fi/cellular triangulation)
        if (isUserTriggered && geoOptions.enableHighAccuracy) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              userLat = pos.coords.latitude;
              userLng = pos.coords.longitude;
              hasGpsLocation = true;

              if (statusEl) {
                statusEl.innerHTML = `
                  <span class="text-success fw-semibold">📡 Live Location Connected:</span>
                  Lat ${userLat.toFixed(2)}°N, Lng ${userLng.toFixed(2)}°E · Haversine sorting active across India.
                `;
              }
              if (btnGpsText) btnGpsText.textContent = 'GPS Active (Locked)';
              fetchAndRenderRadarCompanies();
            },
            () => {
              fallbackToIpOrHub(isUserTriggered ? 'Location permission was dismissed or unavailable.' : null);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
          );
          return;
        }

        fallbackToIpOrHub(isUserTriggered ? 'Location permission was dismissed or unavailable.' : null);
      },
      geoOptions
    );
  }

  /**
   * Tier 2 / 3 Fallback: Try Vercel Edge IP Geolocation, then Reference Hub
   */
  async function fallbackToIpOrHub(noticeMessage = null) {
    const statusEl = document.getElementById('radarTelemetryStatus');
    const btnGpsText = document.getElementById('btnGpsText');

    try {
      const baseUrl = window.CONFIG?.API_BASE_URL || (window.location.origin.includes('5500') ? 'http://localhost:5000/api' : 'https://api.disheera.site/api');
      const res = await fetch(`${baseUrl}/careers/regional/detect-location`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.lat && json.data.lng) {
          if (json.source === 'vercel-edge-ip') {
            userLat = json.data.lat;
            userLng = json.data.lng;
            hasGpsLocation = false;

            const cityName = json.data.city || 'Regional Hub';
            if (statusEl) {
              statusEl.innerHTML = `
                <span class="text-teal fw-semibold">🌐 Vercel Edge Location:</span>
                ${escapeHtml(cityName)} (${userLat.toFixed(2)}°N, ${userLng.toFixed(2)}°E) · Distance calibrated.
                <span class="text-secondary opacity-75">Click "Detect Live GPS" for meter precision.</span>
              `;
            }
            if (btnGpsText) btnGpsText.textContent = 'Detect Live GPS';
            fetchAndRenderRadarCompanies();
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[ProximityRadar] Vercel IP location detection fallback unavailable:', e);
    }

    // Tier 3: Reference Hub
    applyFallbackLocation(noticeMessage);
  }

  function applyFallbackLocation(noticeMessage = null) {
    userLat = DEFAULT_LAT;
    userLng = DEFAULT_LNG;
    hasGpsLocation = false;

    const statusEl = document.getElementById('radarTelemetryStatus');
    const btnGpsText = document.getElementById('btnGpsText');

    if (statusEl) {
      statusEl.innerHTML = `
        <span class="text-teal fw-semibold">📍 Reference Hub:</span>
        Khandesh &amp; MIDC Jalgaon (21.00°N, 75.56°E).
        <span class="text-secondary opacity-75">${noticeMessage ? noticeMessage + ' ' : ''}Click "Detect Live GPS" to calibrate distance.</span>
      `;
    }
    if (btnGpsText) btnGpsText.textContent = 'Detect Live GPS';
    fetchAndRenderRadarCompanies();
  }

  /**
   * Fetch sorted companies from backend API
   */
  async function fetchAndRenderRadarCompanies() {
    const spinner = document.getElementById('radarSpinner');
    const emptyState = document.getElementById('emptyRadarCompanies');
    const grid = document.getElementById('radarCompaniesGrid');
    const clusterSelect = document.getElementById('filterRadarCluster');
    const searchInput = document.getElementById('radarSearchInput');
    const fresherOnlyCheck = document.getElementById('filterRadarFresherOnly');
    const verifiedOnlyCheck = document.getElementById('filterRadarVerifiedOnly');
    const badgeRadarCount = document.getElementById('badgeRadarCount');

    if (!grid) return;

    if (spinner) spinner.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');
    grid.classList.add('d-none');

    const params = new URLSearchParams();
    if (userLat != null && userLng != null) {
      params.append('lat', userLat);
      params.append('lng', userLng);
    }
    if (activeRadius && activeRadius !== 'all') {
      params.append('maxDistanceKm', activeRadius);
    }
    if (clusterSelect && clusterSelect.value && clusterSelect.value !== 'all') {
      params.append('cluster', clusterSelect.value);
    }
    if (fresherOnlyCheck && fresherOnlyCheck.checked) {
      params.append('hiringFresher', 'true');
    }
    if (verifiedOnlyCheck && verifiedOnlyCheck.checked) {
      params.append('verifiedOnly', 'true');
    }
    if (searchInput && searchInput.value.trim()) {
      params.append('search', searchInput.value.trim());
    }

    try {
      let json;
      if (window.API?.get) {
        json = await window.API.get(`/careers/regional/companies?${params.toString()}`);
      } else {
        const baseUrl = window.CONFIG?.API_BASE_URL || (window.location.origin.includes('5500') ? 'http://localhost:5000/api' : 'https://api.disheera.site/api');
        const res = await fetch(`${baseUrl}/careers/regional/companies?${params.toString()}`);
        json = await res.json();
      }

      if (spinner) spinner.classList.add('d-none');

      if (json.success && Array.isArray(json.data?.companies) && json.data.companies.length > 0) {
        cachedCompanies = json.data.companies;
        if (badgeRadarCount) badgeRadarCount.textContent = `${json.data.companies.length}+`;
        renderRadarGrid(cachedCompanies);
        grid.classList.remove('d-none');
      } else {
        cachedCompanies = [];
        if (badgeRadarCount) badgeRadarCount.textContent = '0';
        if (emptyState) emptyState.classList.remove('d-none');
      }
    } catch (err) {
      console.warn('[ProximityRadar] Network fetch failed:', err);
      if (spinner) spinner.classList.add('d-none');
      if (emptyState) emptyState.classList.remove('d-none');
    }
  }

  /**
   * Render company cards
   */
  function renderRadarGrid(companies) {
    const grid = document.getElementById('radarCompaniesGrid');
    if (!grid) return;

    const userSkills = getUserSkillSet();

    grid.innerHTML = companies.map((c) => {
      // Distance Badge Styling
      let distBadgeClass = 'bg-secondary-subtle text-secondary border-secondary-subtle';
      let distIcon = 'bi-geo-alt';
      let distCategory = 'Regional';

      if (c.distanceKm <= 15) {
        distBadgeClass = 'bg-success-subtle text-success border-success-subtle';
        distIcon = 'bi-crosshair';
        distCategory = 'Local Walk / Bike';
      } else if (c.distanceKm <= 50) {
        distBadgeClass = 'bg-teal-subtle text-teal border-teal-subtle';
        distIcon = 'bi-car-front';
        distCategory = 'District Commute';
      } else if (c.distanceKm <= 150) {
        distBadgeClass = 'bg-primary-subtle text-primary border-primary-subtle';
        distIcon = 'bi-train-front';
        distCategory = 'Regional Corridor';
      }

      // Check skill matches
      const renderedSkills = (c.requiredSkills || []).map((skill) => {
        const isMatched = userSkills.some((s) => s.toLowerCase() === skill.toLowerCase() || skill.toLowerCase().includes(s.toLowerCase()));
        if (isMatched) {
          return `<span class="badge bg-success-subtle text-success border border-success-subtle py-1 px-2 font-mono" style="font-size:0.73rem;"><i class="bi bi-patch-check-fill me-1"></i>${escapeHtml(skill)}</span>`;
        }
        return `<span class="badge bg-light text-secondary border border-line py-1 px-2" style="font-size:0.73rem;">${escapeHtml(skill)}</span>`;
      }).join(' ');

      const renderedRoles = (c.topRoles || []).slice(0, 3).map((r) =>
        `<span class="badge bg-white text-ink border border-line py-1 px-2.5 rounded-pill shadow-xs" style="font-size:0.74rem;">${escapeHtml(r)}</span>`
      ).join(' ');

      const firstRole = (c.topRoles && c.topRoles[0]) ? c.topRoles[0] : 'Graduate Engineer Trainee';

      return `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="card h-100 border border-line rounded-4 shadow-sm p-3 p-md-3.5 radar-company-card">
            <!-- Header: Distance & Verification -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <span class="badge ${distBadgeClass} border font-mono small rounded-pill px-2.5 py-1">
                <i class="bi ${distIcon} me-1"></i>${c.distanceKm} km · ${distCategory}
              </span>
              ${c.verifiedPartner ? `
                <span class="badge bg-success text-white font-mono small rounded-pill px-2 py-0.5" style="font-size:0.68rem;">
                  <i class="bi bi-shield-check me-1"></i>VERIFIED PARTNER
                </span>
              ` : ''}
            </div>

            <!-- Title & Cluster -->
            <h3 class="h6 fw-bold text-ink mb-1 d-flex align-items-start justify-content-between gap-2">
              <span>${escapeHtml(c.name)}</span>
              <a href="${escapeHtml(c.website)}" target="_blank" rel="noopener noreferrer" class="text-muted hover-teal fs-6" title="Visit official portal">
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
            </h3>

            <div class="text-teal small fw-semibold mb-2">
              <i class="bi bi-building me-1"></i>${escapeHtml(c.cluster)}
            </div>

            <p class="text-muted small mb-2.5" style="font-size:0.83rem; line-height:1.45;">
              ${escapeHtml(c.industry)}
            </p>

            <!-- Roles -->
            <div class="mb-2.5">
              <div class="text-secondary small fw-bold font-mono text-uppercase mb-1" style="font-size:0.7rem;">Active Hiring Roles:</div>
              <div class="d-flex flex-wrap gap-1">
                ${renderedRoles}
              </div>
            </div>

            <!-- Required Skills -->
            <div class="mb-3 flex-grow-1">
              <div class="text-secondary small fw-bold font-mono text-uppercase mb-1" style="font-size:0.7rem;">Verified Skills Required:</div>
              <div class="d-flex flex-wrap gap-1">
                ${renderedSkills}
              </div>
            </div>

            <!-- Card Footer Badges & Action -->
            <div class="pt-2.5 border-top border-line d-flex align-items-center justify-content-between flex-wrap gap-2 mt-auto">
              <div class="d-flex align-items-center gap-1.5 flex-wrap">
                ${c.hiringFresher ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size:0.7rem;">Freshers Welcome</span>` : ''}
                ${c.internshipOffered ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style="font-size:0.7rem;">Internships</span>` : ''}
                ${c.campusDriveActive ? `<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:0.7rem;">Campus Drive</span>` : ''}
              </div>

              <button
                type="button"
                class="btn btn-outline-teal btn-sm rounded-pill px-3 py-1 fw-bold font-mono btn-radar-apply"
                data-company-id="${escapeHtml(c.id)}"
                data-role="${escapeHtml(firstRole)}"
                data-company-name="${escapeHtml(c.name)}"
                style="font-size:0.78rem;"
              >
                <i class="bi bi-send-fill me-1"></i>Apply Now
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Delegated click handler for radar company apply buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-radar-apply');
    if (btn) {
      const companyId = btn.getAttribute('data-company-id');
      const roleTitle = btn.getAttribute('data-role');
      const companyName = btn.getAttribute('data-company-name');
      window.triggerRadarCompanyApply(companyId, roleTitle, companyName);
    }
  });

  /**
   * Helper to invoke the 1-click apply modal with prefilled company and role
   */
  window.triggerRadarCompanyApply = function (companyId, roleTitle, companyName) {
    if (typeof window.openJobApplyModal === 'function') {
      window.openJobApplyModal(companyId, roleTitle, companyName, 92);
    } else {
      alert(`Connecting to ${companyName} for "${roleTitle}". Please log in to complete your verified submission.`);
    }
  };

  function getUserSkillSet() {
    try {
      const user = window.Auth?.getCurrentUser();
      if (user && Array.isArray(user.skills)) {
        return user.skills.map((s) => (typeof s === 'string' ? s : s.name || ''));
      }
      const stored = localStorage.getItem('userSkills');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore
    }
    return ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'PLC Programming'];
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
