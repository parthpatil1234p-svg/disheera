/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '../client/assessment.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const expectedIds = [
  "mainNav",
  "authNavActions",
  "notchMobileMenu",
  "notchMobileAuthActions",
  "alertContainer",
  "loadingSpinner",
  "stepIndicatorMobile",
  "mobileStepLabel",
  "mobileStepPercent",
  "mobileProgressBar",
  "stepIndicator",
  "navStep0",
  "navStep1",
  "navStep2",
  "navStep3",
  "navStep4",
  "assessmentForm",
  "profileLoadedBanner",
  "profileLoadedDetails",
  "btnJumpToAcademics",
  "stepPanel0",
  "streamCardsGrid",
  "streamSelectedHint",
  "selectedStreamLabel",
  "streamBadge",
  "step0ContinueBtn",
  "stepPanel1",
  "fullName",
  "course",
  "branch",
  "year",
  "college",
  "step1BackBtn",
  "step1ContinueBtn",
  "stepPanel2",
  "interestChipsWrapper",
  "interestCount",
  "step2BackBtn",
  "step2ContinueBtn",
  "stepPanel3",
  "btnAutoDetectGitHubSkills",
  "btnAutoDetectGitHubText",
  "btnChangeGitHubAccount",
  "skillSearchInput",
  "skillCategoryFilter",
  "topSelectedSkillsBox",
  "selectedSkillsCount",
  "realtimeSyncIndicator",
  "topQuizStatusHint",
  "clearAllSkillsBtn",
  "selectedSkillsSummary",
  "skillsGrid",
  "customSkillName",
  "btnAddCustomSkill",
  "customSkillFeedback",
  "proveSkillsPanel",
  "proveSkillsSubtitle",
  "proveSkillsBadge",
  "proveSkillsBadgeText",
  "proveSkillsProgressFill",
  "proveSkillsList",
  "step3BackBtn",
  "step3ContinueBtn",
  "stepPanel4",
  "careerGoals",
  "step4BackBtn",
  "submitAssessmentBtn",
  "skillCheckModal",
  "modalSkillBadge",
  "skillCheckModalTitle",
  "modalProviderBadge",
  "modalStrikesBadge",
  "modalStrikesCount",
  "modalDifficultyPill",
  "modalCloseBtn",
  "modalQuizBody",
  "modalLoadingState",
  "modalQuestionState",
  "modalStepText",
  "modalQuizTimerBadge",
  "modalQuizTimerSeconds",
  "modalQuizTimerProgressBar",
  "modalStepper",
  "modalProctorAlert",
  "modalProctorAlertText",
  "modalQuestionPrompt",
  "modalCodeSnippet",
  "modalOptionsList",
  "modalFeedbackBox",
  "modalFeedbackIcon",
  "modalFeedbackHeadline",
  "modalFeedbackText",
  "modalCancelBtn",
  "modalRestartBtn",
  "modalSubmitBtn",
  "modalNextBtn",
  "modalVerdictState",
  "modalVerdictHeadline",
  "modalVerdictSub",
  "modalVerdictSelfClaimed",
  "modalVerdictVerifiedLevel",
  "modalVerdictIntegrityBadge",
  "modalVerdictUnconfirmedNotice",
  "modalVerdictUnconfirmedNoticeText",
  "modalVerdictExplanation",
  "modalVerdictGapsWrap",
  "modalVerdictGaps",
  "modalVerdictRetestBtn",
  "modalVerdictDoneBtn",
  "modalStrikeOverlay",
  "strikeView1",
  "strikeReasonText1",
  "modalStrike1AckBtn",
  "strikeView2",
  "strikeReasonText2",
  "modalStrike2AckBtn",
  "strikeView3",
  "modalDisqualifiedDoneBtn"
];

let missing = [];
for (const id of expectedIds) {
  // Regex to find id="<id>" or id='<id>'
  const re = new RegExp(`id=["']${id}["']`);
  if (!re.test(content)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error(`FAILED: ${missing.length} missing IDs in assessment.html:`, missing);
  process.exit(1);
} else {
  console.log(`SUCCESS: All ${expectedIds.length} expected DOM IDs verified in assessment.html!`);
}

// Check Light Theme constraints
assert(!content.includes('bg-[#0f172a]'), 'Dark background #0f172a detected');
assert(!content.includes('bg-[#0b1120]'), 'Dark background #0b1120 detected');
assert(!content.includes('bg-[#111827]'), 'Dark background #111827 detected');

console.log('SUCCESS: Light Theme constraints verified!');
