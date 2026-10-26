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
    // Run infrastructure probe in parallel with standard health & metrics
    const [healthRes, metricsRes] = await Promise.all([
      adminFetch('/api/admin/system/health'),
      adminFetch('/api/admin/system/metrics'),
      loadInfrastructureTelemetry()
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
