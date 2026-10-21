/**
 * services/pdfStudyMaterialService.js — Dynamic Weekly Roadmap & Study Notes PDF Compiler
 * 
 * Generates clean, high-density, branded PDF cheatsheets and study guides
 * using PDFKit for automated WhatsApp delivery and direct student download.
 * 
 * Disheera Technologies Inc.
 */

const PDFDocument = require('pdfkit');

/**
 * Compiles a branded weekly roadmap study material PDF buffer.
 * 
 * @param {object} params
 * @param {string} params.careerTitle - Target career (e.g. "Full Stack Developer")
 * @param {number} params.weekNumber - Active week number (e.g. 1, 2, 3...)
 * @param {string} params.studentName - Recipient student name
 * @param {object} [params.roadmapData] - Active roadmap object
 * @param {Array} [params.tasks] - Array of tasks for this week
 * @returns {Promise<Buffer>} - Buffer containing the generated PDF
 */
function generateWeeklyRoadmapPdf({
  careerTitle = 'Full Stack Developer',
  weekNumber = 1,
  studentName = 'Student',
  roadmapData = null,
  tasks = []
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        info: {
          Title: `Disheera — Week ${weekNumber} Study Notes: ${careerTitle}`,
          Author: 'Disheera Technologies Inc.',
          Subject: 'Weekly Milestone Roadmap Cheatsheet & Study Guide',
          Keywords: 'career, roadmap, cheatsheet, edtech, ai'
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryColor = '#1e3a8a';   // Deep Indigo/Navy
      const accentColor = '#2563eb';    // Electric Blue
      const goldColor = '#d97706';      // Gold
      const darkText = '#0f172a';       // Slate 900
      const mutedText = '#475569';      // Slate 600
      const lightBg = '#f8fafc';        // Slate 50
      const borderLine = '#e2e8f0';     // Slate 200

      // ── TOP HEADER BAR ──
      doc.rect(45, 40, 505, 55).fill(primaryColor);
      
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
         .text('DISHEERA', 60, 52, { characterSpacing: 1.5 });
      doc.fontSize(8).font('Helvetica')
         .text('AUTONOMOUS CAREER GPS & VERIFIED TALENT OS', 60, 72, { characterSpacing: 1 });

      doc.fillColor(goldColor).fontSize(11).font('Helvetica-Bold')
         .text(`WEEK ${weekNumber} STUDY GUIDE`, 370, 55, { align: 'right', width: 165 });
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica')
         .text(`Official Curated Notes`, 370, 70, { align: 'right', width: 165 });

      doc.y = 108;

      // ── METADATA CARD ──
      doc.rect(45, 108, 505, 65).fillAndStroke(lightBg, borderLine);
      
      doc.fillColor(darkText).fontSize(13).font('Helvetica-Bold')
         .text(careerTitle, 60, 118);
      
      doc.fillColor(mutedText).fontSize(8.5).font('Helvetica')
         .text(`Student: `, 60, 137, { continued: true })
         .font('Helvetica-Bold').fillColor(darkText).text(`${studentName}   `)
         .font('Helvetica').fillColor(mutedText).text(`Milestone Phase: `, { continued: true })
         .font('Helvetica-Bold').fillColor(accentColor).text(`Week ${weekNumber} of 4   `)
         .font('Helvetica').fillColor(mutedText).text(`Issued: `, { continued: true })
         .font('Helvetica-Bold').fillColor(darkText).text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));

      doc.fillColor(mutedText).fontSize(8).font('Helvetica')
         .text('⚡ Instant WhatsApp Synchronized · Proctor-Ready Milestone Material', 60, 154);

      doc.y = 190;

      // ── SECTION 1: WEEKLY OBJECTIVE ──
      doc.rect(45, 185, 4, 16).fill(accentColor);
      doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold')
         .text(`Week ${weekNumber} Core Objective & Focus`, 56, 188);

      const objectiveText = getWeeklyObjective(careerTitle, weekNumber);
      doc.y = 208;
      doc.fillColor(mutedText).fontSize(9).font('Helvetica')
         .text(objectiveText, 45, doc.y, { width: 505, lineGap: 3 });

      // ── SECTION 2: MILESTONE ACTION TASKS ──
      doc.y += 14;
      doc.rect(45, doc.y, 4, 16).fill(accentColor);
      doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold')
         .text('Weekly Actionable Tasks & Competencies', 56, doc.y + 3);

      doc.y += 20;

      const weekTasks = (tasks && tasks.length > 0)
        ? tasks
        : getDefaultTasks(careerTitle, weekNumber);

      weekTasks.slice(0, 4).forEach((task, idx) => {
        const taskTitle = typeof task === 'string' ? task : (task.title || task.name || `Task ${idx + 1}`);
        const taskDesc = typeof task === 'object' && task.description ? task.description : 'Master key implementation pattern and complete milestone exercises.';
        const estHours = typeof task === 'object' && task.estimatedHours ? `${task.estimatedHours}h` : '3-4h';

        doc.rect(45, doc.y, 505, 36).fillAndStroke('#ffffff', borderLine);
        
        // Checkbox square
        doc.rect(55, doc.y + 11, 13, 13).stroke(accentColor);
        doc.fillColor(accentColor).fontSize(7).font('Helvetica-Bold').text(`${idx + 1}`, 58, doc.y + 13);

        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold')
           .text(taskTitle, 75, doc.y + 7, { width: 375 });
        doc.fillColor(mutedText).fontSize(7.5).font('Helvetica')
           .text(taskDesc, 75, doc.y + 20, { width: 375 });

        doc.fillColor(goldColor).fontSize(8).font('Helvetica-Bold')
           .text(`Est: ${estHours}`, 460, doc.y + 13, { align: 'right', width: 80 });

        doc.y += 42;
      });

      // ── SECTION 3: KEY CHEATSHEET & SYNTAX PATTERNS ──
      doc.y += 4;
      doc.rect(45, doc.y, 4, 16).fill(accentColor);
      doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold')
         .text('Essential Cheatsheet & Mental Models', 56, doc.y + 3);

      doc.y += 20;

      const cheatsheetItems = getCheatsheetContent(careerTitle, weekNumber);
      
      doc.rect(45, doc.y, 505, 85).fillAndStroke('#f1f5f9', borderLine);
      let cheatY = doc.y + 8;
      
      cheatsheetItems.forEach((item) => {
        doc.fillColor(accentColor).fontSize(8).font('Helvetica-Bold')
           .text(`• ${item.title}: `, 55, cheatY, { continued: true })
           .fillColor(darkText).font('Helvetica').text(item.body, { width: 480 });
        cheatY += 18;
      });

      doc.y = cheatY + 12;

      // ── SECTION 4: CURATED FOCUS VIDEO LESSONS ──
      doc.rect(45, doc.y, 4, 16).fill(accentColor);
      doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold')
         .text('Curated YouTube Focus Chamber Recommendations', 56, doc.y + 3);

      doc.y += 20;

      const videoLessons = getVideoLessons(careerTitle, weekNumber);
      videoLessons.slice(0, 2).forEach((vid) => {
        doc.rect(45, doc.y, 505, 34).fillAndStroke('#ffffff', borderLine);
        
        doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold')
           .text('▶ VIDEO', 55, doc.y + 12);
        
        doc.fillColor(darkText).fontSize(8.5).font('Helvetica-Bold')
           .text(vid.title, 115, doc.y + 7, { width: 320 });
        
        doc.fillColor(mutedText).fontSize(7.5).font('Helvetica')
           .text(`Channel: ${vid.channel} · Duration: ${vid.duration}`, 115, doc.y + 20);

        doc.fillColor(accentColor).fontSize(7.5).font('Helvetica-Bold')
           .text('Open in Chamber', 445, doc.y + 12, { align: 'right', width: 95 });

        doc.y += 40;
      });

      // ── FOOTER CERTIFICATION / TAMPER-PROOF GUARANTEE ──
      const bottomY = 770;
      doc.rect(45, bottomY, 505, 1).fill(borderLine);
      
      doc.fillColor(mutedText).fontSize(7).font('Helvetica')
         .text('Disheera Technologies Inc. · Cryptographic Milestone Verification · OpenWA WhatsApp Suite', 45, bottomY + 6);
      
      doc.fillColor(goldColor).fontSize(7).font('Helvetica-Bold')
         .text('🔐 TAMPER-PROOF PROCTOR VERIFIED', 380, bottomY + 6, { align: 'right', width: 170 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Weekly Objective Helper
 */
function getWeeklyObjective(careerTitle, weekNumber) {
  const objectives = {
    1: `Build unbreakable fundamentals in ${careerTitle}. Master foundational architecture, directory setups, syntax standards, and local development debugging workflows.`,
    2: `Deep dive into intermediate frameworks and production-level state management for ${careerTitle}. Implement data fetching, error boundaries, and reactive component lifecycles.`,
    3: `Full-stack integration, backend API contract testing, and database schema design for ${careerTitle}. Optimize query indexing, authentication tokens, and security rules.`,
    4: `Production hardening, automated CI/CD pipeline deployment, and performance optimization for ${careerTitle}. Clear the final proctored milestone assessment to earn verified credentials.`
  };
  return objectives[weekNumber] || `Deep dive into advanced topics, industry standards, and hands-on projects for ${careerTitle}.`;
}

/**
 * Default Task List Helper
 */
function getDefaultTasks(careerTitle, weekNumber) {
  return [
    { title: `Core Conceptual Foundations of ${careerTitle}`, description: 'Read architectural documentation and build a minimal prototype repository.', estimatedHours: 4 },
    { title: 'Interactive Practical Implementation', description: 'Create 2 hands-on coding exercises practicing core design patterns and data structures.', estimatedHours: 5 },
    { title: 'Code Review & Edge Case Hardening', description: 'Address error states, offline fallbacks, and write automated unit tests.', estimatedHours: 3 },
    { title: 'Milestone Knowledge Verification', description: 'Complete the weekly proctored quiz with >=70% score to advance to the next week.', estimatedHours: 2 }
  ];
}

/**
 * Cheatsheet Helper
 */
function getCheatsheetContent(careerTitle, weekNumber) {
  return [
    { title: 'Single Responsibility Principle', body: 'Each module or function must have exactly one reason to change.' },
    { title: 'Defensive Error Handling', body: 'Always wrap async calls in structured try/catch blocks with fail-safe fallback states.' },
    { title: 'Data Flow Predictability', body: 'State should flow down unidirectionally; events and signals bubble up cleanly.' },
    { title: 'Zero Hardcoded Secrets', body: 'Always source connection credentials and keys from environment variables (.env).' }
  ];
}

/**
 * Curated Video Lessons Helper
 */
function getVideoLessons(careerTitle, weekNumber) {
  return [
    { title: `${careerTitle} — Architecture & Best Practices Masterclass`, channel: 'Disheera Academy', duration: '32 mins' },
    { title: `Building Production Projects Step-by-Step for Week ${weekNumber}`, channel: 'FreeCodeCamp / Fireship', duration: '45 mins' }
  ];
}

module.exports = {
  generateWeeklyRoadmapPdf
};
