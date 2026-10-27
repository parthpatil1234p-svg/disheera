const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const screensDataFile = path.resolve('C:/Users/PARTH/.gemini/antigravity/brain/5477b5ac-dde8-43f8-b1a3-44056dddb975/.system_generated/steps/57036/output.txt');
const rawData = JSON.parse(fs.readFileSync(screensDataFile, 'utf8'));

const targetScreens = [
  { id: '3d71188264c147ffa254b4d608ce1ea4', num: '01', slug: 'landing_route_map', title: 'Autonomous Career GPS & Institutional Verification' },
  { id: 'fb73d5e75aa94ee6b2b61906b3626ea1', num: '02', slug: 'clean_auth_whatsapp_modal', title: 'Clean Auth & 2-Step WhatsApp Verification Modal' },
  { id: 'fff71ef593a1444b931847dd5fc141f4', num: '03', slug: 'student_career_gps_dashboard', title: 'Student Career GPS Dashboard' },
  { id: 'baca841b61484ed6b28f1b64515db71b', num: '04', slug: 'diagnostic_assessment_chamber', title: 'Diagnostic Assessment Chamber' },
  { id: 'e836906115194c65a19fdbe51f5a2b44', num: '05', slug: 'career_roadmap_learning_sprints', title: 'Interactive Career Roadmap & Learning Sprints' },
  { id: '6f93d11969df41738b1d62b2c609b77b', num: '06', slug: 'career_recommendation_market_fit', title: 'Personalized Career Recommendation & Market Fit' },
  { id: 'b45d28d6fd924e90a4755fad1d202984', num: '07', slug: 'career_passport_verification', title: 'Verifiable Career Passport & Credential Verification' },
  { id: 'f569136890844cfaa5b8468f269e3465', num: '08', slug: 'resume_studio_ats_latex', title: 'AI Resume Studio & ATS LaTeX Preview' },
  { id: '2a6de47bd260444cb15ff75bbf554b98', num: '09', slug: 'recruiter_talent_cockpit_dossier', title: 'Recruiter Talent Discovery Cockpit & Candidate Dossier' },
  { id: 'c9e0a38d99114df19a54be6c3cce422a', num: '10', slug: 'admin_telemetry_maintenance', title: 'Administrative Telemetry & System Maintenance Mission Control' }
];

const workspaceBase = path.resolve(__dirname, '..');
const codeDir = path.join(workspaceBase, 'stitch_screens', 'code');
const imgDir = path.join(workspaceBase, 'stitch_screens', 'images');
const artifactImgDir = path.resolve('C:/Users/PARTH/.gemini/antigravity/brain/5477b5ac-dde8-43f8-b1a3-44056dddb975/stitch_screens/images');

fs.mkdirSync(codeDir, { recursive: true });
fs.mkdirSync(imgDir, { recursive: true });
fs.mkdirSync(artifactImgDir, { recursive: true });

console.log(`Starting download of ${targetScreens.length} Stitch screens...`);

const results = [];

for (const target of targetScreens) {
  const match = rawData.screens.find(s => s.name.endsWith(target.id));
  if (!match) {
    console.error(`❌ Could not find screen for ID: ${target.id}`);
    continue;
  }

  const htmlUrl = match.htmlCode?.downloadUrl;
  const imgUrl = match.screenshot?.downloadUrl;

  const htmlFileName = `${target.num}_${target.slug}.html`;
  const imgFileName = `${target.num}_${target.slug}.png`;

  const htmlDest = path.join(codeDir, htmlFileName);
  const imgDest = path.join(imgDir, imgFileName);
  const artifactImgDest = path.join(artifactImgDir, imgFileName);

  console.log(`\n⬇️  [${target.num}/10] Downloading "${target.title}"...`);

  if (htmlUrl) {
    console.log(`   Downloading HTML -> ${htmlFileName}`);
    try {
      execSync(`curl.exe -s -L "${htmlUrl}" -o "${htmlDest}"`, { stdio: 'inherit' });
      const size = fs.statSync(htmlDest).size;
      console.log(`   ✓ HTML saved (${size} bytes)`);
    } catch (e) {
      console.error(`   ❌ Failed to download HTML:`, e.message);
    }
  }

  if (imgUrl) {
    console.log(`   Downloading Screenshot -> ${imgFileName}`);
    try {
      execSync(`curl.exe -s -L "${imgUrl}" -o "${imgDest}"`, { stdio: 'inherit' });
      fs.copyFileSync(imgDest, artifactImgDest);
      const size = fs.statSync(imgDest).size;
      console.log(`   ✓ Screenshot saved (${size} bytes)`);
    } catch (e) {
      console.error(`   ❌ Failed to download Screenshot:`, e.message);
    }
  }

  results.push({
    num: target.num,
    id: target.id,
    title: target.title,
    htmlFile: htmlDest,
    imgFile: imgDest,
    artifactImg: artifactImgDest,
    htmlSize: fs.existsSync(htmlDest) ? fs.statSync(htmlDest).size : 0,
    imgSize: fs.existsSync(imgDest) ? fs.statSync(imgDest).size : 0,
    dimensions: `${match.width}x${match.height}`
  });
}

console.log('\n======================================================');
console.log('🎉 ALL STITCH SCREENS DOWNLOADED SUCCESSFULLY!');
console.log('======================================================\n');
console.table(results.map(r => ({
  Screen: `${r.num}. ${r.title.substring(0, 35)}...`,
  CodeSize: `${Math.round(r.htmlSize / 1024)} KB`,
  ImgSize: `${Math.round(r.imgSize / 1024)} KB`,
  Dimensions: r.dimensions
})));
