/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../admin-client/index.html');
const content = fs.readFileSync(filePath, 'utf8');

const requiredIds = [
  "view-system",
  "btnToggleMaintenanceMaster",
  "clusterSyncTime",
  "maintCharCounter",
  "maintCockpitDesc",
  "maintCockpitIcon",
  "maintCockpitStateBox",
  "maintCockpitTitle",
  "maintDurationInput",
  "maintEndTimeInput",
  "maintMessageInput",
  "maintStartTimeInput",
  "maintStatusBadge",
  "maintTitleInput",
  "maintToggleBtnText",
  "maintToggleHint",
  "maintUpdatedMeta",
  "sysDbLatency",
  "sysDbStatus",
  "sysEnvironment",
  "sysHeapBar",
  "sysHeapUsed",
  "sysMetricAudit",
  "sysMetricRecruiters",
  "sysMetricRoadmaps",
  "sysMetricSessions",
  "sysMetricUsers",
  "sysNodeVersion",
  "sysOverallStatusBadge",
  "sysRss",
  "sysUptime",
  "tier1Ping",
  "tier1Requests",
  "tier1Role",
  "tier1Runtime",
  "tier1StatusBadge",
  "tier2Ping",
  "tier2Role",
  "tier2Runtime",
  "tier2StatusBadge",
  "tier2Uptime",
  "tier3Engine",
  "tier3Ping",
  "tier3StatusBadge",
  "trafficBarRender",
  "trafficBarVercel",
  "trafficRenderPct",
  "trafficRenderReqs",
  "trafficVercelPct",
  "trafficVercelReqs"
];

let missing = [];
for (const id of requiredIds) {
  const re = new RegExp(`id=["']${id}["']`);
  if (!re.test(content)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('FAIL: Missing required admin system DOM IDs:', missing);
  process.exit(1);
} else {
  console.log(`SUCCESS: All ${requiredIds.length} expected admin system DOM IDs verified!`);
}

// Check Stitch enhancements
const stitchChecks = [
  { name: 'Telemetry & Maintenance Title', pattern: /Telemetry &amp; Maintenance Cockpit|System Telemetry & Maintenance Cockpit/i },
  { name: 'Operational Cluster Badge', pattern: /Operational Cluster/i },
  { name: 'Distributed Workload Telemetry', pattern: /Distributed Workload Telemetry|Distributed Cloud Topology/i },
  { name: 'Live Cluster Node Heartbeats', pattern: /Node Heartbeats|Cluster Node Heartbeats/i },
  { name: 'Security Audit Ledger', pattern: /Security &amp; Audit Ledger|Security & Audit Ledger/i }
];

for (const check of stitchChecks) {
  if (!check.pattern.test(content)) {
    console.error(`FAIL: Missing Stitch feature '${check.name}'`);
    process.exit(1);
  }
}
console.log('SUCCESS: All Google Stitch admin telemetry & maintenance features verified!');

// Check theme compliance (Light Theme only)
if (content.includes('bg-[#0b1120]') || content.includes('bg-[#0f172a]')) {
  console.error('FAIL: Dark theme background found! Only Light Theme is permitted.');
  process.exit(1);
}
console.log('SUCCESS: Light Theme verified across Admin Telemetry & Mission Control!');
