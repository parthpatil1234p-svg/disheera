const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '../client/resume-builder.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const expectedIds = [
  "mainNavbar",
  "saveStatus",
  "saveStatusText",
  "tplStudentBtn",
  "tplModernBtn",
  "tplProfBtn",
  "tplAtsBtn",
  "btnClearResume",
  "btnJobMatchModal",
  "btnSaveDraft",
  "btnDownloadPdf",
  "btnPrintResume",
  "btnZoomOut",
  "zoomLevelDisplay",
  "btnZoomIn",
  "btnClearResumeQuick",
  "btnAutoSyncProfile",
  "btnImportGithubRepos",
  "secPersonalInfo",
  "inpFullName",
  "inpHeadline",
  "inpEmail",
  "inpPhone",
  "inpLocation",
  "inpGitHub",
  "inpLinkedIn",
  "inpPortfolio",
  "secSummary",
  "btnImproveSummary",
  "inpSummary",
  "summaryWordCount",
  "secEducation",
  "educationListContainer",
  "btnAddEducation",
  "secSkills",
  "skillsListContainer",
  "btnAddSkill",
  "secProjects",
  "projectsListContainer",
  "btnAddProject",
  "secExperience",
  "experienceListContainer",
  "btnAddExperience",
  "secCertifications",
  "certificationsListContainer",
  "btnAddCertification",
  "secAdditional",
  "inpLanguages",
  "inpAchievements",
  "inpHobbies",
  "previewScrollWrapper",
  "resumePaper",
  "aiImproveModal",
  "aiImproveModalLabel",
  "aiOriginalTextDisplay",
  "aiLoadingSpinner",
  "aiSuggestionsContainer",
  "jobMatchModal",
  "jobMatchModalLabel",
  "inpJobDescription",
  "btnRunJobMatch",
  "jobMatchResultsArea",
  "matchScoreDisplay",
  "matchVerdictDisplay",
  "matchedCountBadge",
  "missingCountBadge",
  "matchedSkillsTags",
  "missingSkillsTags",
  "tailoringAdviceList"
];

let missing = [];
for (const id of expectedIds) {
  const re = new RegExp(`id=["']${id}["']`);
  if (!re.test(content)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error(`FAILED: ${missing.length} missing IDs in resume-builder.html:`, missing);
  process.exit(1);
} else {
  console.log(`SUCCESS: All ${expectedIds.length} expected DOM IDs verified in resume-builder.html!`);
}

// Light theme verification
assert(!content.includes('bg-[#0f172a]'), 'Dark background #0f172a detected');
assert(!content.includes('bg-[#0b1120]'), 'Dark background #0b1120 detected');
assert(!content.includes('bg-[#111827]'), 'Dark background #111827 detected');

console.log('SUCCESS: Light Theme constraints verified in resume-builder.html!');
