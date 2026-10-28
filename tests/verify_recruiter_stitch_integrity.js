const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/recruiter-dashboard.html');
const content = fs.readFileSync(filePath, 'utf8');

// Expected existing DOM IDs from client/recruiter-dashboard.html
const requiredIds = [
  "applicantRadarModal",
  "applicantRadarModalLabel",
  "btnModeCorporate",
  "btnModeTpo",
  "btnRecruiterLogout",
  "btnRefreshJobs",
  "btnSubmitJob",
  "careerSlugSelect",
  "companyDomainBadge",
  "companyInitialBox",
  "companyNameText",
  "companySubtitle",
  "corporateRadarView",
  "createJobForm",
  "deadlinePresetSelect",
  "emptyJobsPlaceholder",
  "emptyRadarPlaceholder",
  "experienceLevelSelect",
  "jobDeadlineInput",
  "jobDescInput",
  "jobTitleInput",
  "jobsLoadingSpinner",
  "jobsTableBody",
  "jobsTableContainer",
  "kpiActiveOpenings",
  "kpiShortlisted",
  "kpiTotalApplicants",
  "kpiTrustScore",
  "locationInput",
  "mainNavbar",
  "mandateVerifiedCheck",
  "modalAlertContainer",
  "modalRecruiterPlanDetails",
  "modalRecruiterPlanDetailsLabel",
  "modalUnlocksProgressText",
  "naacEmployabilityScore",
  "naacPowQuotient",
  "naacProjectedPlacement",
  "naacVdiAvg",
  "navCompanyName",
  "postJobModal",
  "postJobModalLabel",
  "radarApplicantsList",
  "radarJobTitle",
  "radarLoadingSpinner",
  "radarTotalCount",
  "recruiterAlertContainer",
  "recruiterGreeting",
  "recruiterMobileMenu",
  "recruiterNavActions",
  "recruiterUnlocksCount",
  "salaryMaxInput",
  "salaryMinInput",
  "skillPresetChips",
  "skillsInput",
  "tpoBatchFilterSelect",
  "tpoBatchYearDisplay",
  "tpoCockpitView",
  "tpoCollegeNameDisplay",
  "tpoHeatmapBody",
  "tpoInterventionTriggersList",
  "tpoMarketRadarChart",
  "tpoStudentsMonitoredCount",
  "workplaceSelect"
];

let missing = [];
for (const id of requiredIds) {
  const re = new RegExp(`id=["']${id}["']`);
  if (!re.test(content)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('FAIL: Missing required recruiter DOM IDs:', missing);
  process.exit(1);
} else {
  console.log(`SUCCESS: All ${requiredIds.length} expected recruiter DOM IDs verified!`);
}

// Check Stitch enhancements
const stitchChecks = [
  { name: 'Candidate Dossier Modal', pattern: /id=["']candidate-dossier-modal["']/ },
  { name: '4D Empirical Rubric Matrix', pattern: /4D Empirical Rubric Matrix/i },
  { name: 'Collegiate Oracle / Ledger Sync', pattern: /Ledger Sync/i },
  { name: 'Verified WhatsApp Pill', pattern: /Verified Identity|\+91/i }
];

for (const check of stitchChecks) {
  if (!check.pattern.test(content)) {
    console.error(`FAIL: Missing Stitch feature '${check.name}'`);
    process.exit(1);
  }
}
console.log('SUCCESS: All Google Stitch candidate cockpit features verified!');

// Check theme compliance (Light Theme only)
if (content.includes('bg-slate-950') || content.includes('bg-[#0b1120]') || content.includes('bg-[#0f172a]')) {
  console.error('FAIL: Dark theme background found! Only Light Theme is permitted.');
  process.exit(1);
}
console.log('SUCCESS: Light Theme verified across Recruiter Talent Cockpit!');
