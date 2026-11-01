/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * systemView.js — Real-Time Telemetry & Distributed Infrastructure Inspector (Plan 45 Phase 4)
 *
 * Displays multi-cloud topology, Vercel & Render traffic routing split,
 * database latency, process memory stats, uptime, and high-level service metrics.
 * Strictly sanitized: No credentials, environment secrets, or stack traces are ever exposed.
 */

async function loadInfrastructureTelemetry() {
  const syncTimeEl = document.getElementById('clusterSyncTime');
  const t1Badge = document.getElementById('tier1StatusBadge');
  const t1Ping = document.getElementById('tier1Ping');
  const t1Reqs = document.getElementById('tier1Requests');
  const t1Runtime = document.getElementById('tier1Runtime');
  const t1Role = document.getElementById('tier1Role');

  const t2Badge = document.getElementById('tier2StatusBadge');
  const t2Ping = document.getElementById('tier2Ping');
  const t2Uptime = document.getElementById('tier2Uptime');
  const t2Runtime = document.getElementById('tier2Runtime');
  const t2Role = document.getElementById('tier2Role');

  const t3Badge = document.getElementById('tier3StatusBadge');
  const t3Ping = document.getElementById('tier3Ping');
  const t3Engine = document.getElementById('tier3Engine');

  const vPctEl = document.getElementById('trafficVercelPct');
  const rPctEl = document.getElementById('trafficRenderPct');
  const vReqsEl = document.getElementById('trafficVercelReqs');
  const rReqsEl = document.getElementById('trafficRenderReqs');
  const vBarEl = document.getElementById('trafficBarVercel');
  const rBarEl = document.getElementById('trafficBarRender');

  try {
    const res = await adminFetch('/api/admin/system/infrastructure');
    if (!res.success || !res.telemetry) return;

    const t = res.telemetry;
    const now = new Date();
    if (syncTimeEl) {
      syncTimeEl.innerHTML = `<i class="bi bi-clock-history"></i> ${now.toLocaleTimeString()}`;
    }

    // Traffic Split Meter
    if (t.trafficSplit) {
      const vPct = t.trafficSplit.vercelPct;
      const rPct = t.trafficSplit.renderPct;
      const vReqs = t.trafficSplit.vercelRequests;
      const rReqs = t.trafficSplit.renderRequests;

      if (vPctEl) vPctEl.textContent = `${vPct}%`;
      if (rPctEl) rPctEl.textContent = `${rPct}%`;
      if (vReqsEl) vReqsEl.textContent = `${vReqs.toLocaleString()} reqs`;
      if (rReqsEl) rReqsEl.textContent = `${rReqs.toLocaleString()} reqs`;
      if (vBarEl) vBarEl.style.width = `${vPct}%`;
      if (rBarEl) rBarEl.style.width = `${rPct}%`;
    }

    // Tier 1: Vercel Serverless
    if (t.tiers && t.tiers.tier1_vercel) {
      const t1 = t.tiers.tier1_vercel;
      if (t1Badge) {
        if (t1.status === 'healthy') {
          t1Badge.className = 'badge badge-emerald';
          t1Badge.innerHTML = '<i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> Active (200 OK)';
        } else if (t1.status === 'degraded') {
          t1Badge.className = 'badge badge-amber';
          t1Badge.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> Degraded';
        } else {
          t1Badge.className = 'badge badge-rose';
          t1Badge.innerHTML = '<i class="bi bi-x-circle-fill"></i> Unreachable';
        }
      }
      if (t1Ping) t1Ping.textContent = `${t1.latencyMs} ms`;
      if (t1Reqs) t1Reqs.textContent = (t1.requestsHandled || 0).toLocaleString();
      if (t1Runtime) t1Runtime.textContent = t1.runtime || 'Vercel Serverless';
      if (t1Role) t1Role.textContent = t1.role || 'request-driven-api';
    }

    // Tier 2: Render Dedicated Worker
    if (t.tiers && t.tiers.tier2_render) {
      const t2 = t.tiers.tier2_render;
      if (t2Badge) {
        if (t2.status === 'healthy') {
          t2Badge.className = 'badge badge-emerald';
          t2Badge.innerHTML = '<i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> Active (200 OK)';
        } else if (t2.status === 'degraded') {
          t2Badge.className = 'badge badge-amber';
          t2Badge.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> Degraded';
        } else {
          t2Badge.className = 'badge badge-rose';
          t2Badge.innerHTML = '<i class="bi bi-x-circle-fill"></i> Unreachable';
        }
      }
      if (t2Ping) t2Ping.textContent = `${t2.latencyMs} ms`;
      if (t2Uptime) {
        const s = t2.uptimeSeconds || 0;
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        t2Uptime.textContent = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m (${s}s)`;
      }
      if (t2Runtime) t2Runtime.textContent = t2.runtime || 'Persistent Worker';
      if (t2Role) t2Role.textContent = t2.role || 'realtime-worker';
    }

    // Tier 3: Supabase PostgreSQL
    if (t.tiers && t.tiers.tier3_database) {
      const t3 = t.tiers.tier3_database;
      if (t3Badge) {
        if (t3.status === 'healthy') {
          t3Badge.className = 'badge badge-emerald';
          t3Badge.innerHTML = '<i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> Connected (200 OK)';
        } else {
          t3Badge.className = 'badge badge-rose';
          t3Badge.innerHTML = '<i class="bi bi-x-circle-fill"></i> Disconnected';
        }
      }
      if (t3Ping) t3Ping.textContent = `${t3.latencyMs} ms`;
      if (t3Engine) t3Engine.textContent = t3.engine || 'PostgreSQL 16';
    }
  } catch (err) {
    console.warn('Failed to probe infrastructure telemetry:', err);
    if (syncTimeEl) syncTimeEl.innerHTML = '<span style="color: var(--accent-rose);"><i class="bi bi-exclamation-triangle"></i> Probe Failed</span>';
  }
}

async function loadSystemHealth() {
  const statusBadge = document.getElementById('sysOverallStatusBadge');
  const dbLatencyEl = document.getElementById('sysDbLatency');
  const dbStatusEl = document.getElementById('sysDbStatus');
  const uptimeEl = document.getElementById('sysUptime');
  const heapUsedEl = document.getElementById('sysHeapUsed');
  const heapBar = document.getElementById('sysHeapBar');
  const rssEl = document.getElementById('sysRss');
  const envEl = document.getElementById('sysEnvironment');
  const nodeVerEl = document.getElementById('sysNodeVersion');

  try {
    // Run infrastructure probe and maintenance sync in parallel with standard health & metrics
    const [healthRes, metricsRes] = await Promise.all([
      adminFetch('/api/admin/system/health'),
      adminFetch('/api/admin/system/metrics'),
      loadInfrastructureTelemetry(),
      loadMaintenanceSettings()
    ]);

    if (healthRes.success && healthRes.health) {
      const h = healthRes.health;

      // Overall Status
      if (statusBadge) {
        if (h.status === 'healthy') {
          statusBadge.className = 'badge badge-emerald';
          statusBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i> System Optimal';
        } else if (h.status === 'degraded') {
          statusBadge.className = 'badge badge-amber';
          statusBadge.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> Performance Degraded';
        } else {
          statusBadge.className = 'badge badge-rose';
          statusBadge.innerHTML = '<i class="bi bi-x-circle-fill"></i> Service Unhealthy';
        }
      }

      // Database latency & status
      if (dbLatencyEl) {
        dbLatencyEl.textContent = `${h.database.latencyMs} ms`;
        if (h.database.latencyMs < 150) {
          dbLatencyEl.style.color = 'var(--accent-emerald)';
        } else if (h.database.latencyMs < 500) {
          dbLatencyEl.style.color = 'var(--accent-amber)';
        } else {
          dbLatencyEl.style.color = 'var(--accent-rose)';
        }
      }

      if (dbStatusEl) {
        dbStatusEl.textContent = `${h.database.engine} (${h.database.status})`;
      }

      // Uptime
      if (uptimeEl) {
        const secs = h.process.uptimeSeconds;
        const days = Math.floor(secs / 86400);
        const hours = Math.floor((secs % 86400) / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        uptimeEl.textContent = `${days}d ${hours}h ${mins}m (${secs}s)`;
      }

      // Memory Heap
      if (heapUsedEl && h.memory) {
        heapUsedEl.textContent = `${h.memory.heapUsedMb} MB / ${h.memory.heapTotalMb} MB`;
        if (heapBar && h.memory.heapTotalMb > 0) {
          const pct = Math.min(100, Math.round((h.memory.heapUsedMb / h.memory.heapTotalMb) * 100));
          heapBar.style.width = `${pct}%`;
        }
      }

      // RSS
      if (rssEl && h.memory) {
        rssEl.textContent = `${h.memory.rssMb} MB`;
      }

      // Environment & Node
      if (envEl) envEl.textContent = h.process.environment;
      if (nodeVerEl) nodeVerEl.textContent = `${h.process.nodeVersion} (${h.process.platform} ${h.process.arch})`;
    }

    if (metricsRes.success && metricsRes.metrics) {
      const m = metricsRes.metrics;
      const elUsers = document.getElementById('sysMetricUsers');
      const elRoadmaps = document.getElementById('sysMetricRoadmaps');
      const elRecruiters = document.getElementById('sysMetricRecruiters');
      const elSessions = document.getElementById('sysMetricSessions');
      const elAudit = document.getElementById('sysMetricAudit');

      if (elUsers) elUsers.textContent = m.totalUsers;
      if (elRoadmaps) elRoadmaps.textContent = m.activeRoadmaps;
      if (elRecruiters) elRecruiters.textContent = m.pendingRecruiters;
      if (elSessions) elSessions.textContent = m.activeAdminSessions;
      if (elAudit) elAudit.textContent = m.totalAuditLogs;
    }
  } catch (err) {
    console.error('Failed to load system health:', err);
    if (statusBadge) {
      statusBadge.className = 'badge badge-rose';
      statusBadge.innerHTML = '<i class="bi bi-dash-circle-fill"></i> Telemetry Offline';
    }
  }
}

window.loadSystemHealth = loadSystemHealth;
window.loadInfrastructureTelemetry = loadInfrastructureTelemetry;


// ── Maintenance Mode Client Logic ─────────────────────────────────
let maintCurrentConfig = {
  enabled: false,
  title: 'Scheduled System Maintenance',
  message: 'We are currently performing routine upgrades, performance tuning, and bug fixing. We will be back online shortly.',
  startTime: '',
  endTime: '',
  expectedDuration: 'Approx. 1-2 hours',
  updatedAt: null,
  updatedBy: 'System'
};

async function loadMaintenanceSettings() {
  const badgeEl = document.getElementById('maintStatusBadge');
  const titleEl = document.getElementById('maintTitleInput');
  const msgEl = document.getElementById('maintMessageInput');
  const startEl = document.getElementById('maintStartTimeInput');
  const endEl = document.getElementById('maintEndTimeInput');
  const durEl = document.getElementById('maintDurationInput');
  const stateBox = document.getElementById('maintCockpitStateBox');
  const iconEl = document.getElementById('maintCockpitIcon');
  const boxTitleEl = document.getElementById('maintCockpitTitle');
  const boxDescEl = document.getElementById('maintCockpitDesc');
  const btnToggle = document.getElementById('btnToggleMaintenanceMaster');
  const toggleHint = document.getElementById('maintToggleHint');
  const updatedMetaEl = document.getElementById('maintUpdatedMeta');

  try {
    const res = await adminFetch('/api/admin/system/maintenance');
    if (res.success && res.maintenance) {
      maintCurrentConfig = res.maintenance;

      // Populate input fields if user is not actively editing
      if (titleEl && (!document.activeElement || document.activeElement !== titleEl)) {
        titleEl.value = maintCurrentConfig.title || '';
      }
      if (msgEl && (!document.activeElement || document.activeElement !== msgEl)) {
        msgEl.value = maintCurrentConfig.message || '';
        updateMaintCharCounter();
      }
      if (startEl && (!document.activeElement || document.activeElement !== startEl)) {
        startEl.value = maintCurrentConfig.startTime || '';
      }
      if (endEl && (!document.activeElement || document.activeElement !== endEl)) {
        endEl.value = maintCurrentConfig.endTime || '';
      }
      if (durEl && (!document.activeElement || document.activeElement !== durEl)) {
        durEl.value = maintCurrentConfig.expectedDuration || '';
      }

      const isEnabled = Boolean(maintCurrentConfig.enabled);

      // Top Status Badge
      if (badgeEl) {
        if (isEnabled) {
          badgeEl.className = 'badge badge-amber';
          badgeEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> Maintenance Active (Public Down)';
        } else {
          badgeEl.className = 'badge badge-emerald';
          badgeEl.innerHTML = '<i class="bi bi-check-circle-fill"></i> Public Site Live';
        }
      }

      // Cockpit State Box
      if (stateBox) {
        if (isEnabled) {
          stateBox.style.border = '2px solid #f59e0b';
          stateBox.style.background = '#fffbeb';
          if (iconEl) iconEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="color: #d97706; font-size: 2rem;"></i>';
          if (boxTitleEl) {
            boxTitleEl.textContent = 'Maintenance Mode ACTIVE';
            boxTitleEl.style.color = '#92400e';
          }
          if (boxDescEl) {
            boxDescEl.textContent = 'Public visitors see the downtime page. Public APIs return 503.';
            boxDescEl.style.color = '#b45309';
          }
          if (btnToggle) {
            btnToggle.className = 'btn-danger';
            btnToggle.style.background = '#dc2626';
            btnToggle.style.borderColor = '#dc2626';
            btnToggle.innerHTML = '<i class="bi bi-power"></i> <span>Deactivate Maintenance (Restore Site)</span>';
          }
          if (toggleHint) {
            toggleHint.textContent = 'Click to bring Disheera back online immediately.';
          }
        } else {
          stateBox.style.border = '2px solid #22c55e';
          stateBox.style.background = '#ffffff';
          if (iconEl) iconEl.innerHTML = '<i class="bi bi-check-circle-fill" style="color: #16a34a; font-size: 2rem;"></i>';
          if (boxTitleEl) {
            boxTitleEl.textContent = 'Public Site is LIVE';
            boxTitleEl.style.color = '#0f172a';
          }
          if (boxDescEl) {
            boxDescEl.textContent = 'All visitors, students, and recruiters can access Disheera normally.';
            boxDescEl.style.color = '#64748b';
          }
          if (btnToggle) {
            btnToggle.className = 'btn-primary';
            btnToggle.style.background = '#2563eb';
            btnToggle.style.borderColor = '#2563eb';
            btnToggle.innerHTML = '<i class="bi bi-power"></i> <span>Activate Maintenance Mode</span>';
          }
          if (toggleHint) {
            toggleHint.textContent = 'Clicking will ask for confirmation before switching downtime.';
          }
        }
      }

      // Metadata
      if (updatedMetaEl && maintCurrentConfig.updatedAt) {
        const d = new Date(maintCurrentConfig.updatedAt);
        updatedMetaEl.innerHTML = `<i class="bi bi-clock-history"></i> Updated: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${escapeHtml(maintCurrentConfig.updatedBy || 'Admin')}`;
      }
    }
  } catch (err) {
    console.warn('Failed to load maintenance settings:', err);
  }
}

function updateMaintCharCounter() {
  const msgEl = document.getElementById('maintMessageInput');
  const counterEl = document.getElementById('maintCharCounter');
  if (msgEl && counterEl) {
    const len = msgEl.value.length;
    counterEl.textContent = `${len} / 500`;
    counterEl.style.color = len > 450 ? '#dc2626' : '#64748b';
  }
}

function applyMaintenancePreset(type) {
  const titleEl = document.getElementById('maintTitleInput');
  const msgEl = document.getElementById('maintMessageInput');
  const startEl = document.getElementById('maintStartTimeInput');
  const endEl = document.getElementById('maintEndTimeInput');
  const durEl = document.getElementById('maintDurationInput');

  const now = new Date();
  const formatTime = (d) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST';
  };

  const startTimeStr = formatTime(now);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursLater = new Date(now.getTime() + 120 * 60 * 1000);

  if (type === 'patch') {
    if (titleEl) titleEl.value = 'Routine Bug Fixing & Performance Patch';
    if (msgEl) {
      msgEl.value = 'Our engineering team is deploying performance optimizations, bug fixes, and stability patches to ensure maximum platform reliability. Student data and progress remain 100% secure. We will be back online shortly.';
    }
    if (startEl && !startEl.value) startEl.value = startTimeStr;
    if (endEl && !endEl.value) endEl.value = formatTime(oneHourLater);
    if (durEl) durEl.value = 'Approx. 30-45 minutes';
  } else if (type === 'upgrade') {
    if (titleEl) titleEl.value = 'Disheera Core Engine & Feature Upgrade';
    if (msgEl) {
      msgEl.value = 'We are upgrading the Disheera platform with new AI diagnostic modules and user interface enhancements. All coursework progress and certificates are safely preserved. We will resume service shortly.';
    }
    if (startEl && !startEl.value) startEl.value = startTimeStr;
    if (endEl && !endEl.value) endEl.value = formatTime(twoHoursLater);
    if (durEl) durEl.value = 'Approx. 1-2 hours';
  } else if (type === 'database') {
    if (titleEl) titleEl.value = 'Database Optimization & Security Maintenance';
    if (msgEl) {
      msgEl.value = 'We are currently conducting scheduled database indexing and security audits to ensure peak system performance. Public access is temporarily paused. Thank you for your patience.';
    }
    if (startEl && !startEl.value) startEl.value = startTimeStr;
    if (endEl && !endEl.value) endEl.value = formatTime(oneHourLater);
    if (durEl) durEl.value = 'Approx. 1 hour';
  }

  updateMaintCharCounter();
  if (typeof showToast === 'function') {
    showToast('Applied announcement template.', 'info');
  }
}

async function handleMaintenanceMasterToggle() {
  const isCurrentlyActive = Boolean(maintCurrentConfig.enabled);

  if (isCurrentlyActive) {
    const confirmed = confirm(
      'Restore Public Website?\n\n' +
      'This will turn OFF maintenance mode and immediately restore full public access for all students, visitors, and recruiters.'
    );
    if (!confirmed) return;
    await executeSaveMaintenance({ enabled: false });
  } else {
    const confirmed = confirm(
      'Activate Platform Maintenance Mode?\n\n' +
      '⚠️ ATTENTION: This will take the public website down and show the maintenance downtime screen to all visitors.\n\n' +
      '• Public APIs will return 503 Service Unavailable.\n' +
      '• This Admin Portal (admin.disheera.site) will remain 100% online and accessible.\n\n' +
      'Do you want to proceed?'
    );
    if (!confirmed) return;
    await executeSaveMaintenance({ enabled: true });
  }
}

async function saveMaintenanceSettingsOnly() {
  await executeSaveMaintenance({});
}

async function executeSaveMaintenance(overrides = {}) {
  const titleEl = document.getElementById('maintTitleInput');
  const msgEl = document.getElementById('maintMessageInput');
  const startEl = document.getElementById('maintStartTimeInput');
  const endEl = document.getElementById('maintEndTimeInput');
  const durEl = document.getElementById('maintDurationInput');

  const payload = {
    title: titleEl ? titleEl.value.trim() : maintCurrentConfig.title,
    message: msgEl ? msgEl.value.trim() : maintCurrentConfig.message,
    startTime: startEl ? startEl.value.trim() : maintCurrentConfig.startTime,
    endTime: endEl ? endEl.value.trim() : maintCurrentConfig.endTime,
    expectedDuration: durEl ? durEl.value.trim() : maintCurrentConfig.expectedDuration
  };

  if (typeof overrides.enabled === 'boolean') {
    payload.enabled = overrides.enabled;
  } else {
    payload.enabled = Boolean(maintCurrentConfig.enabled);
  }

  try {
    const res = await adminFetch('/api/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      if (typeof showToast === 'function') {
        const msg = payload.enabled 
          ? 'Platform Maintenance Mode is now ACTIVE! Public site is offline.' 
          : 'Public website restored to LIVE service!';
        showToast(msg, payload.enabled ? 'warning' : 'success');
      }
      await loadMaintenanceSettings();
    } else {
      if (typeof showToast === 'function') {
        showToast(res.message || 'Failed to update maintenance settings.', 'error');
      }
    }
  } catch (err) {
    console.error('Error saving maintenance settings:', err);
    if (typeof showToast === 'function') {
      showToast(err.message || 'Network error updating maintenance state.', 'error');
    }
  }
}

function openMaintenancePreview() {
  const titleEl = document.getElementById('maintTitleInput');
  const msgEl = document.getElementById('maintMessageInput');
  const startEl = document.getElementById('maintStartTimeInput');
  const endEl = document.getElementById('maintEndTimeInput');
  const durEl = document.getElementById('maintDurationInput');

  const pTitle = document.getElementById('prevMaintTitle');
  const pMsg = document.getElementById('prevMaintMessage');
  const pWindow = document.getElementById('prevMaintTimeWindow');
  const pDur = document.getElementById('prevMaintDuration');
  const pScheduleBox = document.getElementById('prevMaintScheduleBox');

  const title = (titleEl && titleEl.value.trim()) || maintCurrentConfig.title || 'Platform Scheduled Maintenance';
  const msg = (msgEl && msgEl.value.trim()) || maintCurrentConfig.message || 'We are currently performing routine upgrades, performance tuning, and bug fixing. We will be back online shortly.';
  const start = (startEl && startEl.value.trim()) || maintCurrentConfig.startTime || '';
  const end = (endEl && endEl.value.trim()) || maintCurrentConfig.endTime || '';
  const dur = (durEl && durEl.value.trim()) || maintCurrentConfig.expectedDuration || '';

  if (pTitle) pTitle.textContent = title;
  if (pMsg) pMsg.textContent = msg;

  if (pWindow) {
    if (start && end) {
      pWindow.textContent = `${start} - ${end}`;
    } else if (start) {
      pWindow.textContent = `Starts: ${start}`;
    } else if (end) {
      pWindow.textContent = `Ends: ${end}`;
    } else {
      pWindow.textContent = 'In Progress';
    }
  }

  if (pDur) {
    pDur.textContent = dur || 'Approx. 1-2 hours';
  }

  if (typeof openModal === 'function') {
    openModal('maintenancePreviewModal');
  }
}

window.loadMaintenanceSettings = loadMaintenanceSettings;
window.applyMaintenancePreset = applyMaintenancePreset;
window.updateMaintCharCounter = updateMaintCharCounter;
window.handleMaintenanceMasterToggle = handleMaintenanceMasterToggle;
window.saveMaintenanceSettingsOnly = saveMaintenanceSettingsOnly;
window.openMaintenancePreview = openMaintenancePreview;
