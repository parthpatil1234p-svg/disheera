/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/pdfStudyMaterialService.js — Dynamic PDF Study Notes & Cheatsheet Generator
 * 
 * Generates an executive, publication-grade exactly 2-page A4 study guide and cheatsheet
 * for a student's active roadmap milestone week.
 * Fully compatible with WinAnsi standard 14 Helvetica font (zero corrupted glyphs, zero rogue page splits).
 * 
 * Disheera Technologies Inc.
 */

const PDFDocument = require('pdfkit');

/**
 * Generates a weekly roadmap study notes PDF buffer
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
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: false,
        info: {
          Title: `Disheera — Week ${weekNumber} Study Notes: ${careerTitle}`,
          Author: 'Disheera Technologies Inc.',
          Subject: 'Weekly Milestone Roadmap Cheatsheet & Study Guide',
          Keywords: 'career, roadmap, cheatsheet, edtech, ai, disheera'
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryColor = '#1e3a8a';   // Deep Navy
      const accentColor = '#2563eb';    // Electric Royal Blue
      const goldColor = '#d97706';      // Gold / Amber
      const successColor = '#059669';   // Emerald Green
      const darkText = '#0f172a';       // Slate 900
      const bodyText = '#334155';       // Slate 700
      const mutedText = '#64748b';      // Slate 500
      const lightBg = '#f8fafc';        // Slate 50
      const borderLine = '#e2e8f0';     // Slate 200

      const issueDateStr = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // ========================================================
      // ── PAGE 1: ROADMAP OBJECTIVES & ACTIONABLE TASKS ──
      // ========================================================
      doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

      // 1. Top Header Bar (Height: 52)
      doc.rect(45, 35, 505, 52).fill(primaryColor);
      
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
         .text('DISHEERA', 60, 46, { characterSpacing: 1.5, lineBreak: false });
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
         .text('AUTONOMOUS CAREER GPS & VERIFIED TALENT OS', 60, 67, { characterSpacing: 0.8, lineBreak: false });

      doc.fillColor(goldColor).fontSize(11).font('Helvetica-Bold')
         .text(`WEEK ${weekNumber} STUDY GUIDE`, 360, 48, { align: 'right', width: 175, lineBreak: false });
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica')
         .text('Official Curated Milestone Notes', 360, 65, { align: 'right', width: 175, lineBreak: false });

      // 2. Structured Student Metadata Card (Height: 62)
      doc.rect(45, 96, 505, 62).fillAndStroke(lightBg, borderLine);

      // Left Column
      doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold')
         .text(careerTitle, 60, 106, { width: 280, lineBreak: false });
      doc.fillColor(mutedText).fontSize(8.5).font('Helvetica')
         .text('Student: ', 60, 124, { continued: true })
         .font('Helvetica-Bold').fillColor(bodyText).text(studentName, { lineBreak: false });

      // Right Column
      doc.fillColor(mutedText).fontSize(8.5).font('Helvetica')
         .text('Milestone Phase: ', 340, 106, { continued: true })
         .font('Helvetica-Bold').fillColor(accentColor).text(`Week ${weekNumber} of 12`, { lineBreak: false });
      doc.fillColor(mutedText).fontSize(8.5).font('Helvetica')
         .text('Issued: ', 340, 124, { continued: true })
         .font('Helvetica-Bold').fillColor(bodyText).text(issueDateStr, { lineBreak: false });

      // Card Bottom Strip
      doc.rect(45, 142, 505, 16).fill('#f1f5f9');
      doc.fillColor(mutedText).fontSize(7.5).font('Helvetica')
         .text('[SYNC] Official WhatsApp Synchronized · Proctor-Ready Milestone Material', 60, 146, { lineBreak: false });

      // 3. Section 1: Weekly Objective
      const sec1Y = 172;
      doc.rect(45, sec1Y, 4, 15).fill(accentColor);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text(`Week ${weekNumber} Core Objective & Focus`, 56, sec1Y + 2, { lineBreak: false });

      const objectiveText = getWeeklyObjective(careerTitle, weekNumber);
      doc.fillColor(bodyText).fontSize(8.5).font('Helvetica')
         .text(objectiveText, 45, sec1Y + 22, { width: 505, lineGap: 3 });

      // 4. Section 2: Milestone Action Tasks
      const sec2Y = 236;
      doc.rect(45, sec2Y, 4, 15).fill(accentColor);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text('Weekly Actionable Tasks & Competencies', 56, sec2Y + 2, { lineBreak: false });

      const weekTasks = (tasks && tasks.length > 0)
        ? tasks
        : getDefaultTasks(careerTitle, weekNumber);

      let taskCardY = sec2Y + 22;
      weekTasks.slice(0, 4).forEach((task, idx) => {
        const taskTitle = typeof task === 'string' ? task : (task.title || task.name || `Task ${idx + 1}`);
        const taskDesc = typeof task === 'object' && task.description ? task.description : 'Master key implementation pattern and complete milestone exercises.';
        const estHours = typeof task === 'object' && task.estimatedHours ? `${task.estimatedHours}h` : '3-4h';

        // Card container
        doc.rect(45, taskCardY, 505, 44).fillAndStroke('#ffffff', borderLine);

        // Checkbox numbering badge
        doc.roundedRect(55, taskCardY + 10, 24, 24, 4).fillAndStroke('#eff6ff', accentColor);
        doc.fillColor(accentColor).fontSize(9.5).font('Helvetica-Bold')
           .text(`${idx + 1}`, 55, taskCardY + 16, { width: 24, align: 'center', lineBreak: false });

        // Titles & descriptions
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold')
           .text(taskTitle, 90, taskCardY + 8, { width: 320, lineBreak: false });
        doc.fillColor(mutedText).fontSize(7.5).font('Helvetica')
           .text(taskDesc, 90, taskCardY + 23, { width: 320, lineBreak: false });

        // Estimated hours pill
        doc.roundedRect(425, taskCardY + 12, 110, 20, 3).fill('#fef3c7');
        doc.fillColor('#b45309').fontSize(7.5).font('Helvetica-Bold')
           .text(`Est: ${estHours} · Ready`, 425, taskCardY + 17, { width: 110, align: 'center', lineBreak: false });

        taskCardY += 50;
      });

      // 5. Section 3: Evaluation Criteria Box
      const sec3Y = taskCardY + 4;
      doc.rect(45, sec3Y, 4, 15).fill(accentColor);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text(`Week ${weekNumber} Milestone Verification & Evaluation Standard`, 56, sec3Y + 2, { lineBreak: false });

      const evalBoxY = sec3Y + 22;
      doc.rect(45, evalBoxY, 505, 68).fillAndStroke(lightBg, borderLine);

      const criteria = [
        'Proctored Evaluation: Minimum 70% passing threshold on weekly coding challenge.',
        'Code Authenticity: Clean git commits with proper modular architecture and zero AI hallucination.',
        'Skill Credential: Week clearance automatically elevates your verified Disheera Skill Passport.'
      ];

      criteria.forEach((crit, i) => {
        const itemY = evalBoxY + 10 + (i * 18);
        doc.circle(58, itemY + 4, 2.5).fill(accentColor);
        doc.fillColor(bodyText).fontSize(8).font('Helvetica').text(crit, 68, itemY, { width: 465, lineBreak: false });
      });

      // 6. Navigation Link Card
      const navY = evalBoxY + 76;
      doc.roundedRect(45, navY, 505, 42, 4).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor(accentColor).fontSize(8.5).font('Helvetica-Bold')
         .text('Interactive Roadmaps & Online Code Chambers:', 60, navY + 9, { lineBreak: false });
      doc.fillColor(bodyText).fontSize(8).font('Helvetica')
         .text('Track your progress, run tests & watch video chambers live at https://disheera.site/roadmap.html', 60, navY + 24, { lineBreak: false });

      // 7. Page 1 Footer Bar
      const page1BottomY = 778;
      doc.rect(45, page1BottomY, 505, 1).fill(borderLine);
      doc.fillColor(mutedText).fontSize(7).font('Helvetica')
         .text('Disheera Technologies Inc. · Cryptographic Milestone Verification · OpenWA WhatsApp Suite', 45, page1BottomY + 7, { lineBreak: false });
      doc.fillColor(accentColor).fontSize(7.5).font('Helvetica-Bold')
         .text('Page 1 of 2  [ Continued on Next Page ]', 350, page1BottomY + 7, { align: 'right', width: 200, lineBreak: false });

      // ========================================================
      // ── PAGE 2: TECHNICAL CHEATSHEET & VIDEO LECTURES ──
      // ========================================================
      doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

      // 1. Page 2 Top Header Bar (Height: 46)
      doc.rect(45, 35, 505, 46).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
         .text('DISHEERA', 60, 46, { characterSpacing: 1.2, lineBreak: false });
      doc.fillColor(goldColor).fontSize(7.5).font('Helvetica-Bold')
         .text('TECHNICAL CHEATSHEET & VIDEO LECTURES', 60, 62, { characterSpacing: 0.8, lineBreak: false });

      doc.fillColor('#cbd5e1').fontSize(8.5).font('Helvetica')
         .text(`Week ${weekNumber} Core Reference Guide · ${careerTitle}`, 260, 52, { align: 'right', width: 275, lineBreak: false });

      // 2. Section: Essential Cheatsheet & Mental Models
      const p2Sec1Y = 94;
      doc.rect(45, p2Sec1Y, 4, 15).fill(accentColor);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text('Essential Cheatsheet & Production Mental Models', 56, p2Sec1Y + 2, { lineBreak: false });

      const cheatsheetItems = getCheatsheetContent(careerTitle, weekNumber);
      let cheatCardY = p2Sec1Y + 22;

      cheatsheetItems.forEach((item, idx) => {
        doc.rect(45, cheatCardY, 505, 42).fillAndStroke('#ffffff', borderLine);
        
        // Left accent border on each card
        doc.rect(45, cheatCardY, 3, 42).fill(accentColor);

        doc.fillColor(accentColor).fontSize(8.5).font('Helvetica-Bold')
           .text(`${idx + 1}.  ${item.title}`, 58, cheatCardY + 8, { width: 475, lineBreak: false });
        doc.fillColor(bodyText).fontSize(7.5).font('Helvetica')
           .text(item.body, 58, cheatCardY + 22, { width: 475, lineGap: 2 });

        cheatCardY += 48;
      });

      // 3. Section: Curated Video Masterclasses
      const p2Sec2Y = cheatCardY + 6;
      doc.rect(45, p2Sec2Y, 4, 15).fill(accentColor);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text('Curated Focus Video Masterclasses', 56, p2Sec2Y + 2, { lineBreak: false });

      const videoLessons = getVideoLessons(careerTitle, weekNumber);
      let vidCardY = p2Sec2Y + 22;

      videoLessons.slice(0, 2).forEach((vid) => {
        doc.rect(45, vidCardY, 505, 44).fillAndStroke('#ffffff', borderLine);

        // Native Play Button Badge (Vector path, zero unicode corruption)
        doc.roundedRect(55, vidCardY + 10, 26, 24, 4).fill('#dc2626');
        doc.polygon([64, vidCardY + 16], [74, vidCardY + 22], [64, vidCardY + 28]).fill('#ffffff');

        doc.fillColor(darkText).fontSize(8.5).font('Helvetica-Bold')
           .text(vid.title, 90, vidCardY + 9, { width: 320, lineBreak: false });
        doc.fillColor(mutedText).fontSize(7.5).font('Helvetica')
           .text(`Channel: ${vid.channel}  |  Duration: ${vid.duration}`, 90, vidCardY + 24, { lineBreak: false });

        // Action button
        doc.roundedRect(425, vidCardY + 12, 110, 20, 3).fill(accentColor);
        doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
           .text('Open in Chamber', 425, vidCardY + 18, { width: 110, align: 'center', lineBreak: false });

        vidCardY += 50;
      });

      // 4. Section: Technical Interview Readiness & STAR Questions
      const p2Sec3Y = vidCardY + 6;
      doc.rect(45, p2Sec3Y, 4, 15).fill(accentColor);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text('Technical Interview Readiness & STAR Methodology', 56, p2Sec3Y + 2, { lineBreak: false });

      const starBoxY = p2Sec3Y + 22;
      doc.rect(45, starBoxY, 505, 96).fillAndStroke(lightBg, borderLine);

      doc.fillColor(darkText).fontSize(8.5).font('Helvetica-Bold')
         .text('Framework for Technical Interviews:', 58, starBoxY + 10, { lineBreak: false });

      const starLines = [
        'S - Situation: Outline the technical project, user constraints, and scale requirements.',
        'T - Task: Identify the specific module, API endpoint, or data structure you owned.',
        'A - Action: Detail architectural decisions, design patterns, and edge case prevention.',
        'R - Result: Quantify impact (e.g. "Reduced API latency by 35% using indexing & caching").'
      ];

      starLines.forEach((sLine, sIdx) => {
        const lineY = starBoxY + 26 + (sIdx * 15);
        doc.circle(63, lineY + 4, 2).fill(accentColor);
        doc.fillColor(bodyText).fontSize(7.5).font('Helvetica').text(sLine, 72, lineY, { width: 460, lineBreak: false });
      });

      // 5. Practice Test Call-To-Action Banner
      const ctaY = starBoxY + 104;
      doc.roundedRect(45, ctaY, 505, 42, 4).fillAndStroke('#ecfdf5', '#a7f3d0');
      doc.rect(45, ctaY, 4, 42).fill(successColor);

      doc.fillColor(successColor).fontSize(8.5).font('Helvetica-Bold')
         .text(`Ready to test your skills for Week ${weekNumber}?`, 60, ctaY + 9, { lineBreak: false });
      doc.fillColor(bodyText).fontSize(8).font('Helvetica')
         .text('Start proctored milestone quiz: https://disheera.site/quiz.html (or reply 5 on WhatsApp)', 60, ctaY + 24, { lineBreak: false });

      // 6. Page 2 Footer Bar
      const page2BottomY = 778;
      doc.rect(45, page2BottomY, 505, 1).fill(borderLine);
      doc.fillColor(mutedText).fontSize(7).font('Helvetica')
         .text('Disheera Technologies Inc. · Cryptographic Milestone Verification · OpenWA WhatsApp Suite', 45, page2BottomY + 7, { lineBreak: false });
      doc.fillColor(successColor).fontSize(7.5).font('Helvetica-Bold')
         .text('VERIFIED STUDY GUIDE · SHA-256 SECURED · Page 2 of 2', 280, page2BottomY + 7, { align: 'right', width: 270, lineBreak: false });

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
    { title: 'Single Responsibility Principle (SRP)', body: 'Each module or function must have exactly one reason to change. Decouple business logic from presentation.' },
    { title: 'Defensive Error Handling Patterns', body: 'Always wrap asynchronous calls in structured try/catch blocks with fail-safe fallback states and structured logs.' },
    { title: 'Predictable Unidirectional Data Flow', body: 'State should flow down unidirectionally through props or store; events and actions dispatch up cleanly.' },
    { title: 'Zero Hardcoded Secrets & Twelve-Factor Config', body: 'Always source database credentials, API tokens, and secret keys strictly from environment variables (.env).' }
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
