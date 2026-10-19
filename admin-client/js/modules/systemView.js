/**
 * systemView.js — Real-Time Telemetry & System Health Inspector (Plan 45 Phase 4)
 *
 * Displays database latency, process memory stats, uptime, and high-level service metrics.
 * Strictly sanitized: No credentials, environment secrets, or stack traces are ever exposed.
 */

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
    const [healthRes, metricsRes] = await Promise.all([
      adminFetch('/api/admin/system/health'),
      adminFetch('/api/admin/system/metrics')
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
