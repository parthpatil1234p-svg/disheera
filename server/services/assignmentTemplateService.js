/**
 * services/assignmentTemplateService.js — Standardized Assignment Cover PDF Generator (Plan 46)
 *
 * Generates an official 1-page standardized Disheera Assignment Cover Sheet (Part A)
 * using PDFKit. Students download this personalized cover sheet, sign the honor pledge,
 * and attach their assignment work/photos (Part B) before submission.
 *
 * Disheera Technologies Inc.
 */

const PDFDocument = require('pdfkit');

/**
 * Generates an official 1-page Assignment Cover Sheet PDF Buffer.
 *
 * @param {object} params
 * @param {string} [params.studentName]
 * @param {string} [params.email]
 * @param {string} [params.rollNumber]
 * @param {string} [params.college]
 * @param {string} [params.department]
 * @param {string} [params.careerTitle]
 * @param {number} [params.weekNumber]
 * @param {string} [params.assignmentTitle]
 * @param {string} [params.submissionDate]
 * @returns {Promise<Buffer>}
 */
function generateCoverPagePdf({
  studentName = 'Student Name',
  email = 'student@example.com',
  rollNumber = 'Pending / Not Specified',
  college = 'University / Institute of Technology',
  department = 'Computer Science & Engineering',
  careerTitle = 'Full Stack Web Developer',
  weekNumber = 1,
  assignmentTitle = 'Weekly Practical Milestone & Technical Derivations',
  submissionDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
} = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 40, right: 40 },
        info: {
          Title: `Disheera Cover Sheet - Week ${weekNumber} - ${careerTitle}`,
          Author: 'Disheera Technologies Inc.',
          Subject: 'Collegiate Weekly Assignment Cover Sheet (Part A)',
          Keywords: 'disheera, assignment, cover sheet, engineering, edtech'
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const navy = '#0f172a';       // Slate 900
      const indigo = '#1e3a8a';     // Indigo 900
      const electric = '#2563eb';   // Blue 600
      const gold = '#d97706';       // Amber 600
      const slateText = '#334155';  // Slate 700
      const borderCol = '#cbd5e1';  // Slate 300
      const cardBg = '#f8fafc';     // Slate 50

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 32;

      // ── OUTER DECORATIVE BORDER ──
      doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2))
         .lineWidth(1.5)
         .stroke(indigo);

      doc.rect(margin + 3, margin + 3, pageWidth - (margin * 2) - 6, pageHeight - (margin * 2) - 6)
         .lineWidth(0.5)
         .stroke(borderCol);

      // ── TOP INSTITUTIONAL BANNER ──
      const bannerX = margin + 8;
      const bannerY = margin + 8;
      const bannerW = pageWidth - ((margin + 8) * 2);
      const bannerH = 72;

      doc.rect(bannerX, bannerY, bannerW, bannerH)
         .fill(indigo);

      // Disheera Logo & Header
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
         .text('DISHEERA', bannerX + 16, bannerY + 14, { characterSpacing: 2 });

      doc.fontSize(8.5).font('Helvetica')
         .text('AUTONOMOUS CAREER GPS & VERIFIED TALENT OS', bannerX + 16, bannerY + 36, { characterSpacing: 1 });

      doc.fillColor('#93c5fd').fontSize(7.5).font('Helvetica')
         .text('Accredited Milestone Evaluation · Collegiate Assessment Framework', bannerX + 16, bannerY + 50);

      // Right-aligned header badge
      doc.fillColor(gold).fontSize(11).font('Helvetica-Bold')
         .text(`WEEK ${weekNumber} ASSIGNMENT`, bannerX + bannerW - 210, bannerY + 16, { align: 'right', width: 195 });

      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica')
         .text('Part A: Official Submission Dossier', bannerX + bannerW - 210, bannerY + 32, { align: 'right', width: 195 });

      doc.fillColor('#cbd5e1').fontSize(7.5).font('Helvetica')
         .text('Maximum Marks: 10.0', bannerX + bannerW - 210, bannerY + 48, { align: 'right', width: 195 });

      // ── ASSIGNMENT SUBJECT STRIP ──
      const stripY = bannerY + bannerH + 12;
      doc.rect(bannerX, stripY, bannerW, 46)
         .fillAndStroke(cardBg, borderCol);

      doc.fillColor(indigo).fontSize(8).font('Helvetica-Bold')
         .text('CAREER TRACK & ASSIGNMENT TOPIC', bannerX + 14, stripY + 9);

      doc.fillColor(navy).fontSize(11).font('Helvetica-Bold')
         .text(`${careerTitle} · ${assignmentTitle}`, bannerX + 14, stripY + 22, {
           width: bannerW - 28,
           ellipsis: true
         });

      // ── STUDENT METADATA DOSSIER (GRID) ──
      const metaY = stripY + 56;
      const metaH = 180;
      doc.rect(bannerX, metaY, bannerW, metaH)
         .fillAndStroke('#ffffff', borderCol);

      // Subheader
      doc.rect(bannerX, metaY, bannerW, 26)
         .fill('#f1f5f9');
      doc.fillColor(indigo).fontSize(9).font('Helvetica-Bold')
         .text('CANDIDATE IDENTIFICATION & COLLEGE DOSSIER', bannerX + 14, metaY + 8);

      const colW = (bannerW - 32) / 2;
      const row1Y = metaY + 38;
      const row2Y = metaY + 84;
      const row3Y = metaY + 130;

      // Col 1 - Student Name
      doc.fillColor(slateText).fontSize(8).font('Helvetica-Bold').text('STUDENT FULL NAME:', bannerX + 16, row1Y);
      doc.fillColor(navy).fontSize(10).font('Helvetica').text(studentName, bannerX + 16, row1Y + 12, { width: colW - 10 });

      // Col 2 - Email & Student ID
      doc.fillColor(slateText).fontSize(8).font('Helvetica-Bold').text('REGISTERED EMAIL / USER ID:', bannerX + 16 + colW, row1Y);
      doc.fillColor(navy).fontSize(9.5).font('Helvetica').text(email, bannerX + 16 + colW, row1Y + 12, { width: colW - 10 });

      // Col 1 - College / Institution
      doc.fillColor(slateText).fontSize(8).font('Helvetica-Bold').text('COLLEGE / INSTITUTE NAME:', bannerX + 16, row2Y);
      doc.fillColor(navy).fontSize(9.5).font('Helvetica').text(college, bannerX + 16, row2Y + 12, { width: colW - 10 });

      // Col 2 - Roll / Enrollment Number
      doc.fillColor(slateText).fontSize(8).font('Helvetica-Bold').text('COLLEGE ROLL / ENROLLMENT NO:', bannerX + 16 + colW, row2Y);
      doc.fillColor(navy).fontSize(10).font('Helvetica').text(rollNumber, bannerX + 16 + colW, row2Y + 12, { width: colW - 10 });

      // Col 1 - Department / Branch
      doc.fillColor(slateText).fontSize(8).font('Helvetica-Bold').text('DEPARTMENT & BRANCH:', bannerX + 16, row3Y);
      doc.fillColor(navy).fontSize(9.5).font('Helvetica').text(department, bannerX + 16, row3Y + 12, { width: colW - 10 });

      // Col 2 - Submission Date
      doc.fillColor(slateText).fontSize(8).font('Helvetica-Bold').text('OFFICIAL SUBMISSION DATE:', bannerX + 16 + colW, row3Y);
      doc.fillColor(navy).fontSize(10).font('Helvetica').text(submissionDate, bannerX + 16 + colW, row3Y + 12, { width: colW - 10 });

      // ── PART B ATTACHMENT INSTRUCTIONS & EVALUATION RUBRIC GUIDE ──
      const instrY = metaY + metaH + 12;
      const instrH = 135;
      doc.rect(bannerX, instrY, bannerW, instrH)
         .fillAndStroke(cardBg, borderCol);

      doc.fillColor(indigo).fontSize(9).font('Helvetica-Bold')
         .text('PART B: ATTACHMENT GUIDELINES & 4-DIMENSIONAL EVALUATION RUBRIC', bannerX + 14, instrY + 10);

      const bulletY = instrY + 28;
      const instructions = [
        '1. Standard Submission Sequence: This Cover Sheet MUST be Page 1. Attach your handwritten solution sheets, code outputs, architectural schematics, or photos directly behind this sheet (Pages 2-10).',
        '2. Multi-Modal Vision Ingestion: Ensure photographs/scans are high-resolution, well-lit, and upright. The AI auto-grader evaluates handwritten derivations and visual diagrams.',
        '3. 4D Rubric Weightage (10 Marks): Problem Solving & Accuracy (4.0 pts) · Methodological Rigour & Formulas (3.0 pts) · Clarity & Step-by-Step Flow (3.0 pts).',
        '4. Anti-AI Writing Shield: Raw copy-pasting from generative LLMs is flagged with synthetic perplexity heuristics. Authentic handwritten derivations receive full authentic merit credits.'
      ];

      doc.fillColor(slateText).fontSize(8).font('Helvetica');
      let currY = bulletY;
      instructions.forEach((line) => {
        doc.text(line, bannerX + 16, currY, { width: bannerW - 32, lineGap: 3 });
        currY += 24;
      });

      // ── ACADEMIC HONESTY & HONOR CODE PLEDGE ──
      const pledgeY = instrY + instrH + 12;
      const pledgeH = 145;
      doc.rect(bannerX, pledgeY, bannerW, pledgeH)
         .fillAndStroke('#ffffff', indigo);

      // Pledge banner
      doc.rect(bannerX, pledgeY, bannerW, 24).fill(indigo);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
         .text('ACADEMIC INTEGRITY & STUDENT HONOR PLEDGE', bannerX + 14, pledgeY + 7);

      const pledgeText =
        'I hereby affirm upon my personal honor that the work presented in this assignment dossier is my own original, authentic intellectual effort. I have not engaged in plagiarism, automated copy-pasting from generative AI systems, or unauthorized collusion. I acknowledge that Disheera uses dual-layer multimodal AI evaluation and human administrative review to calculate my Cumulative Merit Score (CMS) and national leaderboard rank.';

      doc.fillColor(slateText).fontSize(8).font('Helvetica')
         .text(pledgeText, bannerX + 14, pledgeY + 34, {
           width: bannerW - 28,
           lineGap: 3,
           align: 'justify'
         });

      // Signature & Date lines
      const sigLineY = pledgeY + 115;
      const sigColW = (bannerW - 40) / 2;

      // Student Signature
      doc.moveTo(bannerX + 14, sigLineY).lineTo(bannerX + 14 + sigColW, sigLineY).lineWidth(0.8).stroke(slateText);
      doc.fillColor(navy).fontSize(8).font('Helvetica-Bold')
         .text('STUDENT HANDWRITTEN / DIGITAL SIGNATURE', bannerX + 14, sigLineY + 6);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica')
         .text(`Candidate: ${studentName}`, bannerX + 14, sigLineY + 16);

      // Date & Verification
      doc.moveTo(bannerX + 26 + sigColW, sigLineY).lineTo(bannerX + bannerW - 14, sigLineY).lineWidth(0.8).stroke(slateText);
      doc.fillColor(navy).fontSize(8).font('Helvetica-Bold')
         .text('DATE OF SIGNING & SUBMISSION', bannerX + 26 + sigColW, sigLineY + 6);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica')
         .text(`Recorded: ${submissionDate}`, bannerX + 26 + sigColW, sigLineY + 16);

      // ── FOOTER BAR ──
      const footerY = pageHeight - margin - 24;
      doc.rect(bannerX, footerY, bannerW, 16).fill('#f1f5f9');
      
      const docRef = `REF: DSH-W${weekNumber}-${Buffer.from(email).toString('hex').slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      doc.fillColor('#64748b').fontSize(7).font('Helvetica')
         .text('Disheera Technologies Inc. · Official Collegiate Document Standard Part A · ISO 9001/27001 Aligned', bannerX + 8, footerY + 5);
      
      doc.fillColor(indigo).fontSize(7).font('Helvetica-Bold')
         .text(docRef, bannerX + bannerW - 180, footerY + 5, { align: 'right', width: 172 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCoverPagePdf
};
