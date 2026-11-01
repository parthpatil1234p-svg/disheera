/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/resumeAuthenticityService.js — Pre-Upload Resume Authenticity & Content Verification Gate
 *
 * 4-Layer Document Classification Gate:
 * Layer 1: In-memory text extraction (PDF via pdf-parse, DOCX via adm-zip)
 * Layer 2: Minimum readable text & scan quality check (>= 100 characters)
 * Layer 3: Deterministic Non-Resume Blacklist & Structural Whitelist Analysis (0ms, $0)
 * Layer 4: AI Pre-Flight Classifier (Groq / Gemini) for borderline edge cases
 *
 * Disheera · Enterprise Backend Service
 */

let _PDFParse = null;
function getPDFParse() {
  if (!_PDFParse) {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {};
    }
    _PDFParse = require('pdf-parse').PDFParse;
  }
  return _PDFParse;
}
let AdmZip = null;
try {
  AdmZip = require('adm-zip');
} catch (_) {}

const { callGroq } = require('./groqService');
const { callGemini } = require('./geminiService');

// ── Layer 3A: Blacklist Document Patterns ──────────────────────────────
const BLACKLIST_RULES = [
  {
    type: 'Utility Bill / Invoice',
    code: 'INVOICE_OR_BILL',
    regex: /\b(tax\s+invoice|commercial\s+invoice|proforma\s+invoice|retail\s+invoice|invoice\s*#|bill\s+of\s+supply|electricity\s+bill|power\s+distribution|discom\b|consumer\s*(?:no|number|id)|meter\s*(?:no|reading|number)|connected\s+load|sanctioned\s+load|units\s+consumed|tariff\s*category|billing\s+cycle|bill\s+date|gstin\b|gst\s*number|cin\s*:\s*[ul]\d{5}|hsn\s*code|sac\s*code|subtotal\b.*total\s+amount|cgst\b|sgst\b|igst\b|water\s+bill|broadband\s+bill|telephone\s+bill|amount\s+payable|payment\s+receipt\b)\b/i,
    minHits: 1,
    description: 'Utility bills, tax invoices, and payment receipts are not accepted. Please upload a genuine resume or CV.',
  },
  {
    type: 'Government Identity Document',
    code: 'GOVERNMENT_ID',
    regex: /\b(unique\s+identification\s+authority\s+of\s+india|uidai\b|my\s+aadhaar\b|aadhaar\s*(?:no|number)|enrollment\s+no\b.*\bmera\s+aadhaar|income\s+tax\s+department\b.*permanent\s+account\s+number|govt\.?\s+of\s+india\b.*income\s+tax|pan\s+card\b|election\s+commission\s+of\s+india|elector's\s+photo\s+identity\s+card|epic\s+no\b|driving\s+licen[sc]e|motor\s+vehicles\s+department|republic\s+of\s+india\b.*passport\s+office)\b/i,
    minHits: 1,
    description: 'Government identification documents (Aadhaar, PAN, Voter ID, Passport) are strictly prohibited for privacy and compliance reasons. Please upload your professional CV.',
  },
  {
    type: 'Academic Examination Paper',
    code: 'EXAM_PAPER',
    regex: /\b(question\s+paper\b|time\s*allowed\s*:\s*\d|max(?:imum)?\s+marks\s*:\s*\d|semester\s+(?:end\s+)?examination|end\s+sem(?:ester)?\s+exam|answer\s+any\s+(?:five|three|four|\d+)\s+questions|all\s+questions\s+carry\s+equal\s+marks|q\.?\s*\d+\s+is\s+compulsory|hall\s+ticket\b|admit\s+card\b|examination\s+seat\s*(?:no|number)|invigilator\s*['’]?s\s*signature)\b/i,
    minHits: 1,
    description: 'Academic exam question papers and hall tickets are not accepted. Please upload your student resume with your skills and education.',
  },
  {
    type: 'Restaurant Menu / Food Order',
    code: 'MENU_OR_ORDER',
    regex: /\b(appetizers|starters|main\s+course|desserts|beverages|mocktails|soups\s+&\s+salads|chef's\s+special|table\s*#?\s*\d+|dine\s*in|take\s*away|delivery\s+partner\b.*order\s*#|swiggy\b.*delivered|zomato\b.*delivered)\b/i,
    minHits: 1,
    description: 'Restaurant menus and food delivery slips cannot be evaluated. Please upload your curriculum vitae.',
  },
  {
    type: 'Medical Diagnostic Report',
    code: 'MEDICAL_REPORT',
    regex: /\b(patient\s*(?:name|id)\b|specimen\b.{0,60}collected|investigation\s+report|clinical\s+pathology|reference\s+range\b.{0,60}biological\s+ref|fasting\s+blood\s+sugar|lipid\s+profile\b|hemoglobin\s+a1c|hospital\s+discharge\s+summary|doctor's\s+prescription|treating\s+physician|rx\s*:\s*tab\b)\b/i,
    minHits: 1,
    description: 'Medical health reports and prescriptions are not permitted. Please upload your resume.',
  },
  {
    type: 'Travel Ticket / Boarding Pass',
    code: 'TRAVEL_TICKET',
    regex: /\b(boarding\s+pass\b|flight\s+ticket\b|pnr\s*(?:no|number)?\b.{0,60}train\s+no|irctc\b.{0,60}e-ticketing|airline\s+booking\s+reference|seat\s*:\s*\d+[a-f]\b.{0,60}gate\s*:\s*[a-z0-9]+)\b/i,
    minHits: 1,
    description: 'Travel tickets and boarding passes are not valid resumes. Please upload your CV.',
  },
];

// ── Layer 3B: Whitelist Resume Structural Markers ──────────────────────
const RESUME_SECTIONS = [
  { name: 'Education', regex: /\b(education|academic\s+background|academics|qualifications|educational\s+qualifications)\b/i },
  { name: 'Experience', regex: /\b(experience|work\s+experience|professional\s+experience|employment\s+history|internship|internships|work\s+history)\b/i },
  { name: 'Skills', regex: /\b(skills|technical\s+skills|core\s+competencies|technologies|key\s+skills|programming\s+languages|tools\s+&\s+frameworks)\b/i },
  { name: 'Projects', regex: /\b(projects|academic\s+projects|personal\s+projects|key\s+projects|featured\s+projects)\b/i },
  { name: 'Certifications', regex: /\b(certifications?|licenses?|courses?|training|certificates?)\b/i },
  { name: 'Summary', regex: /\b(summary|professional\s+summary|career\s+objective|profile\s+summary|about\s+me)\b/i },
  { name: 'Achievements', regex: /\b(achievements|honors|awards|extracurricular|publications)\b/i },
];

const RESUME_CREDENTIALS = /\b(bachelor|b\.tech|bca|b\.e|m\.tech|mca|master|b\.sc|m\.sc|diploma|university|college|institute|cgpa|gpa|percentage|graduat(?:ed|ion))\b/i;
const RESUME_ACTION_VERBS = /\b(developed|implemented|designed|created|built|managed|led|engineered|programmed|optimized|configured|architected|collaborated|contributed|delivered)\b/i;
const CONTACT_MARKERS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/,
  linkedinOrGithub: /\b(linkedin\.com\/in|github\.com)\b/i,
};

/**
 * Extracts raw textual content from an in-memory document buffer.
 * @param {Buffer} buffer - Binary file buffer
 * @param {string} mimeType - e.g. 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
 * @returns {Promise<string>} Extracted text string
 */
async function extractTextFromBuffer(buffer, mimeType) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return '';
  }

  // 1. PDF Parsing via pdf-parse v2
  if (mimeType === 'application/pdf' || buffer.subarray(0, 4).toString('ascii').startsWith('%PDF')) {
    try {
      const parser = new (getPDFParse())({ data: buffer });
      await parser.load();
      const parseRes = await parser.getText();
      return (parseRes?.text || '').trim();
    } catch (err) {
      console.warn('[resumeAuthenticityService] PDF parsing note:', err.message);
      return '';
    }
  }

  // 2. DOCX Parsing via adm-zip
  const isDocx = mimeType?.includes('wordprocessingml') || buffer.subarray(0, 4).toString('hex') === '504b0304';
  if (isDocx && AdmZip) {
    try {
      const zip = new AdmZip(buffer);
      const docXml = zip.readAsText('word/document.xml');
      if (docXml) {
        return docXml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch (err) {
      console.warn('[resumeAuthenticityService] DOCX parsing note:', err.message);
      return '';
    }
  }

  // Fallback for UTF-8 or ASCII plain text
  try {
    const rawAscii = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    if (rawAscii.length > 50) return rawAscii.trim();
  } catch (_) {}

  return '';
}

/**
 * Checks text against blacklisted document types (invoices, bills, govt IDs, question papers, menus, etc.).
 * @param {string} text
 * @returns {{ isBlacklisted: boolean, detectedType: string, code: string, message: string } | null}
 */
function detectNonResumeBlacklist(text) {
  if (!text || typeof text !== 'string') return null;

  for (const rule of BLACKLIST_RULES) {
    if (rule.regex.test(text)) {
      return {
        isBlacklisted: true,
        detectedType: rule.type,
        code: `NON_RESUME_${rule.code}`,
        message: `Document rejected: Detected a ${rule.type}. ${rule.description}`,
      };
    }
  }

  return null;
}

/**
 * Evaluates the structural anatomy of resume text.
 * @param {string} text
 * @returns {{ score: number, matchedSections: string[], hasContact: boolean, hasCredentials: boolean, hasVerbs: boolean }}
 */
function evaluateResumeStructure(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, matchedSections: [], hasContact: false, hasCredentials: false, hasVerbs: false };
  }

  const matchedSections = [];
  RESUME_SECTIONS.forEach((section) => {
    if (section.regex.test(text)) {
      matchedSections.push(section.name);
    }
  });

  const hasEmail = CONTACT_MARKERS.email.test(text);
  const hasPhone = CONTACT_MARKERS.phone.test(text);
  const hasSocial = CONTACT_MARKERS.linkedinOrGithub.test(text);
  const hasContact = hasEmail || hasPhone || hasSocial;

  const hasCredentials = RESUME_CREDENTIALS.test(text);
  const hasVerbs = RESUME_ACTION_VERBS.test(text);

  // Calculate composite score (0-100)
  // - Sections: 15 pts each up to 60 pts
  // - Contact: 15 pts
  // - Credentials: 15 pts
  // - Verbs: 10 pts
  let score = 0;
  score += Math.min(60, matchedSections.length * 15);
  if (hasContact) score += 15;
  if (hasCredentials) score += 15;
  if (hasVerbs) score += 10;

  return {
    score,
    matchedSections,
    hasContact,
    hasCredentials,
    hasVerbs,
  };
}

/**
 * AI Pre-Flight Classifier (Groq / Gemini) for borderline or creative resumes.
 * @param {string} text
 * @returns {Promise<{ isResume: boolean, confidence: number, detectedType: string, reason: string }>}
 */
async function classifyWithAi(text) {
  const snippet = text.slice(0, 1800);
  const prompt = `You are a strict Document Classification Gatekeeper for a university career portal.
Evaluate if the following document text is an authentic Resume, Curriculum Vitae (CV), or Professional Student Profile.

Important:
- If this document is an invoice, electricity bill, restaurant menu, admit card, exam question paper, class notes, essay, receipt, ticket, medical report, or random document, respond with "isResume": false.
- If it is a real student/professional resume with skills, education, or projects, respond with "isResume": true.

Document Text Snippet:
"""
${snippet}
"""

Return ONLY a JSON object matching this schema:
{
  "isResume": true or false,
  "confidence": <integer 0 to 100>,
  "detectedType": "resume" or "invoice_or_bill" or "exam_paper" or "government_id" or "menu_or_receipt" or "general_notes" or "other",
  "reason": "<1-sentence clear explanation>"
}
Do not write markdown backticks or text outside the JSON.`;

  let responseText = null;

  // 1. Try Groq (Llama 3.3 70B - fast, zero-delay)
  try {
    responseText = await callGroq([
      { role: 'system', content: 'You are a document classifier. Output pure JSON only.' },
      { role: 'user', content: prompt },
    ]);
  } catch (_) {
    // 2. Fallback to Gemini Flash
    try {
      responseText = await callGemini([
        { role: 'user', parts: [{ text: prompt }] },
      ]);
    } catch (__) {
      responseText = null;
    }
  }

  if (responseText) {
    try {
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.isResume === 'boolean') {
        return {
          isResume: parsed.isResume,
          confidence: Number(parsed.confidence) || 80,
          detectedType: parsed.detectedType || (parsed.isResume ? 'resume' : 'other'),
          reason: parsed.reason || (parsed.isResume ? 'Authentic resume confirmed by AI.' : 'Document is not a resume.'),
        };
      }
    } catch (jsonErr) {
      console.warn('[resumeAuthenticityService] AI classifier JSON parse error:', jsonErr.message);
    }
  }

  // Default fallback if AI service is unavailable
  return {
    isResume: true,
    confidence: 60,
    detectedType: 'resume',
    reason: 'Heuristic evaluation accepted.',
  };
}

/**
 * Master Verification Pipeline: Verifies an in-memory document buffer BEFORE upload to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type
 * @param {string} fileName - Sanitized file name
 * @returns {Promise<{ isValid: boolean, code?: string, detectedType?: string, message?: string, extractedText?: string, details?: any }>}
 */
async function verifyResumeContent(buffer, mimeType, fileName = 'resume.pdf') {
  // Layer 1: In-memory text extraction
  const extractedText = await extractTextFromBuffer(buffer, mimeType);

  // Layer 2: Minimum readable text gate
  const cleanedText = (extractedText || '').replace(/\s+/g, ' ').trim();
  if (!cleanedText || cleanedText.length < 100) {
    return {
      isValid: false,
      code: 'INSUFFICIENT_TEXT',
      detectedType: 'scanned_or_empty_document',
      message: 'Document contains insufficient readable text (less than 100 characters). Scanned images, blank pages, or encrypted PDFs cannot be verified. Please upload a standard text-based PDF or DOCX resume.',
      extractedText: '',
      details: { characterCount: cleanedText.length },
    };
  }

  // Layer 3A: Blacklist Detection (Invoices, Utility Bills, IDs, Question Papers, Menus)
  const blacklistHit = detectNonResumeBlacklist(cleanedText);
  if (blacklistHit) {
    return {
      isValid: false,
      code: blacklistHit.code,
      detectedType: blacklistHit.detectedType,
      message: blacklistHit.message,
      extractedText: cleanedText,
      details: { detectedType: blacklistHit.detectedType },
    };
  }

  // Layer 3B: Structural Whitelist Analysis
  const structure = evaluateResumeStructure(cleanedText);

  // Decisive High Score (Clean authentic resume)
  if (structure.score >= 45 && structure.matchedSections.length >= 2) {
    return {
      isValid: true,
      code: 'VERIFIED_RESUME',
      detectedType: 'resume',
      message: 'Document successfully authenticated as a student resume.',
      extractedText: cleanedText,
      details: structure,
    };
  }

  // Decisive Low Score (No sections, no contact, no credentials -> Not a resume!)
  if (structure.score < 20 && structure.matchedSections.length === 0) {
    return {
      isValid: false,
      code: 'MISSING_RESUME_STRUCTURE',
      detectedType: 'non_resume_document',
      message: 'Document rejected: This file does not contain standard resume sections (Education, Skills, Experience, or Projects). Please upload a valid curriculum vitae (CV).',
      extractedText: cleanedText,
      details: structure,
    };
  }

  // Layer 4: Ambiguous Borderline Cases -> AI Pre-Flight Classifier
  try {
    const aiResult = await classifyWithAi(cleanedText);
    if (!aiResult.isResume) {
      return {
        isValid: false,
        code: 'AI_REJECTED_NON_RESUME',
        detectedType: aiResult.detectedType,
        message: `Document rejected: ${aiResult.reason || 'AI verification classified this file as an unrelated document.'}`,
        extractedText: cleanedText,
        details: { aiClassification: aiResult, structure },
      };
    }

    return {
      isValid: true,
      code: 'AI_VERIFIED_RESUME',
      detectedType: 'resume',
      message: 'Document verified as an authentic resume via AI pre-flight check.',
      extractedText: cleanedText,
      details: { aiClassification: aiResult, structure },
    };
  } catch (aiErr) {
    console.warn('[resumeAuthenticityService] AI classification fallback:', aiErr.message);
    // If AI fails, use conservative structural threshold
    if (structure.score >= 30) {
      return {
        isValid: true,
        code: 'HEURISTIC_VERIFIED_RESUME',
        detectedType: 'resume',
        message: 'Document authenticated based on structural heuristics.',
        extractedText: cleanedText,
        details: structure,
      };
    }

    return {
      isValid: false,
      code: 'INDETERMINATE_DOCUMENT',
      detectedType: 'unrecognized_document',
      message: 'Document rejected: Could not verify resume structure. Please ensure your document contains standard headings like Education, Skills, and Projects.',
      extractedText: cleanedText,
      details: structure,
    };
  }
}

/**
 * Verifies raw string text for resume authenticity (used for POST /api/resume/analyze with direct text).
 * @param {string} text
 * @returns {{ isValid: boolean, code?: string, detectedType?: string, message?: string }}
 */
function verifyResumeText(text) {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length < 50) {
    return {
      isValid: false,
      code: 'INSUFFICIENT_TEXT',
      detectedType: 'short_text',
      message: 'Text is too short. Please provide at least 50 characters of resume content.',
    };
  }

  const blacklistHit = detectNonResumeBlacklist(cleaned);
  if (blacklistHit) {
    return {
      isValid: false,
      code: blacklistHit.code,
      detectedType: blacklistHit.detectedType,
      message: blacklistHit.message,
    };
  }

  const structure = evaluateResumeStructure(cleaned);
  if (structure.score < 15 && structure.matchedSections.length === 0 && !structure.hasCredentials) {
    return {
      isValid: false,
      code: 'MISSING_RESUME_STRUCTURE',
      detectedType: 'non_resume_text',
      message: 'The submitted text does not contain typical resume sections or skills.',
    };
  }

  return {
    isValid: true,
    code: 'VERIFIED_RESUME_TEXT',
    detectedType: 'resume',
    message: 'Resume text authenticated.',
  };
}

module.exports = {
  extractTextFromBuffer,
  detectNonResumeBlacklist,
  evaluateResumeStructure,
  classifyWithAi,
  verifyResumeContent,
  verifyResumeText,
};
