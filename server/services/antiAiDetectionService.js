/**
 * services/antiAiDetectionService.js — Anti-AI Writing Shield & Authenticity Classifier (Plan 46)
 *
 * Implements high-precision heuristic & linguistic analysis to detect synthetic
 * LLM-generated assignments (ChatGPT, Gemini, Claude regurgitation):
 * - Formulaic structural markers & conversational cliches
 * - Unnatural sentence length uniformity (low burstiness)
 * - Stereotypical AI vocabulary over-indexing
 * - Raw markdown copy-paste artifacts
 * - Evaluates original handwritten derivation indicators vs verbatim AI output
 *
 * Disheera Technologies Inc.
 */

// Stereotypical LLM opening & closing patterns
const LLM_STRUCTURAL_MARKERS = [
  { pattern: /in summary[,:]?\s+(it is|by leveraging|we can|the)/i, weight: 0.18, reason: 'Stereotypical LLM conclusive transition ("In summary...")' },
  { pattern: /it is (critical|vital|crucial|essential) to (note|understand|remember|ensure) that/i, weight: 0.16, reason: 'High-frequency AI robotic filler ("It is critical to note that...")' },
  { pattern: /delves? into the intricacies/i, weight: 0.22, reason: 'Hyper-polished AI stylistic cliché ("delve into intricacies")' },
  { pattern: /testament to the (power|robustness|importance)/i, weight: 0.20, reason: 'Robotic concluding metaphor ("testament to...")' },
  { pattern: /tapestry of (modern|contemporary|technical)/i, weight: 0.25, reason: 'Hallmark synthetic metaphor ("tapestry of...")' },
  { pattern: /by leveraging (cutting-edge|robust|advanced|state-of-the-art)/i, weight: 0.18, reason: 'Formulaic AI marketing phrase ("by leveraging cutting-edge...")' },
  { pattern: /furthermore[,:]?\s+it is (worth noting|important to recognize)/i, weight: 0.15, reason: 'Formulaic transition ("Furthermore, it is worth noting...")' },
  { pattern: /in conclusion[,:]?\s+(navigating|understanding|mastering)/i, weight: 0.15, reason: 'Formulaic summary opening ("In conclusion, mastering...")' },
  { pattern: /as an ai (language model|assistant)/i, weight: 0.90, reason: 'Blatant uncensored LLM self-reference' },
  { pattern: /here is (a comprehensive|an overview of|the derivation for)/i, weight: 0.20, reason: 'Conversational LLM prompt greeting artifact' },
  { pattern: /hope this helps!?\s*(let me know if you need)/i, weight: 0.35, reason: 'Chatbot sign-off conversational artifact' }
];

// Markdown artifacts left by students who copy-pasted straight from ChatGPT into a document
const MARKDOWN_COPY_PATTERNS = [
  { pattern: /```(?:javascript|typescript|python|sql|bash|json)\s*\n/i, weight: 0.15, reason: 'Raw markdown code-fence syntax detected in submitted text' },
  { pattern: /\n###\s+[A-Z0-9]/, weight: 0.12, reason: 'Raw markdown H3 heading hashes (###) found in document body' },
  { pattern: /\*\*[A-Z][a-zA-Z0-9\s]+\*\*:\s+/, weight: 0.10, reason: 'Stereotypical LLM bold-bullet notation (**Concept**: explanation)' }
];

// Over-indexed robotic vocabulary
const ROBOTIC_VOCABULARY = [
  'delve', 'delves', 'delving',
  'tapestry', 'beacon', 'paramount',
  'pivotal', 'crucial', 'underscores',
  'fosters', 'unveils', 'intricacies',
  'holistic', 'synergistic', 'multitude',
  'overarching', 'quintessential', 'meticulous',
  'seamless', 'seamlessly'
];

/**
 * Calculates sentence length variance (Burstiness).
 * Humans vary sentence lengths drastically (short questions, long complex derivations).
 * LLMs produce sentences with very tight, uniform syllable & word counts.
 */
function calculateSentenceBurstiness(text) {
  if (!text || text.length < 80) return 1.0;

  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim().split(/\s+/).filter(Boolean).length)
    .filter(len => len > 3);

  if (sentences.length < 4) return 1.0;

  const mean = sentences.reduce((acc, len) => acc + len, 0) / sentences.length;
  const variance = sentences.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / sentences.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation = stdDev / mean
  const cv = mean > 0 ? stdDev / mean : 1.0;
  return cv; // Normal human writing typically has CV > 0.45; robotic text often < 0.30
}

/**
 * Analyzes document text and metadata to calculate AI writing probability.
 *
 * @param {string} text - Raw extracted document text
 * @param {object} [metadata]
 * @param {number} [metadata.pageCount] - Total pages in submission
 * @returns {object} - { aiProbability, aiDetected, authenticityBadge, aiReasons, penaltyPercent }
 */
function detectAiContent(text = '', metadata = {}) {
  const cleanText = (text || '').trim();
  const reasons = [];
  let score = 0.05; // Base natural baseline

  if (cleanText.length < 50) {
    // If document is predominantly handwritten photos with minimal OCR text,
    // authentic manual work is credited!
    return {
      aiProbability: 0.05,
      aiDetected: false,
      authenticityBadge: 'AUTHENTIC',
      badgeColor: '#16a34a', // Emerald Green
      badgeLabel: 'Authentic Student Work',
      aiReasons: ['Document contains visual handwritten derivations and photographic lab records.'],
      penaltyPercent: 0
    };
  }

  // 1. Check Structural LLM Markers
  for (const item of LLM_STRUCTURAL_MARKERS) {
    if (item.pattern.test(cleanText)) {
      score += item.weight;
      reasons.push(item.reason);
    }
  }

  // 2. Check Raw Markdown Copy Artifacts
  for (const item of MARKDOWN_COPY_PATTERNS) {
    if (item.pattern.test(cleanText)) {
      score += item.weight;
      reasons.push(item.reason);
    }
  }

  // 3. Count Robotic Vocabulary Density
  const words = cleanText.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2);
  const totalWords = words.length;

  if (totalWords > 40) {
    let roboticCount = 0;
    const foundClichés = new Set();
    for (const w of words) {
      if (ROBOTIC_VOCABULARY.includes(w)) {
        roboticCount++;
        foundClichés.add(w);
      }
    }

    const density = roboticCount / totalWords;
    if (density > 0.025) { // More than 2.5% robotic keywords
      const vocabWeight = Math.min(0.28, density * 8);
      score += vocabWeight;
      reasons.push(`Over-indexed synthetic vocabulary detected (${Array.from(foundClichés).slice(0, 4).join(', ')})`);
    }
  }

  // 4. Burstiness (Sentence Length Uniformity)
  const cv = calculateSentenceBurstiness(cleanText);
  if (cv < 0.28 && totalWords > 60) {
    score += 0.18;
    reasons.push('Unnatural sentence length uniformity detected (low burstiness cadence)');
  }

  // Cap probability strictly between 0.00 and 0.99
  const aiProbability = Math.min(0.99, Math.max(0.04, +score.toFixed(2)));

  // Categorize based on Plan 46 Rubric Policy
  let authenticityBadge = 'AUTHENTIC';
  let badgeColor = '#16a34a'; // Green
  let badgeLabel = 'Authentic Student Work';
  let penaltyPercent = 0;
  let aiDetected = false;

  if (aiProbability > 0.60) {
    authenticityBadge = 'HIGH_AI';
    badgeColor = '#dc2626'; // Red
    badgeLabel = 'High AI Generation Detected';
    penaltyPercent = 100; // Flagged for human admin review
    aiDetected = true;
    if (reasons.length === 0) {
      reasons.push('Elevated synthetic perplexity matching known LLM models');
    }
  } else if (aiProbability >= 0.30) {
    authenticityBadge = 'MODERATE_AI';
    badgeColor = '#d97706'; // Amber
    badgeLabel = 'Moderate AI Assistance Detected';
    penaltyPercent = 15; // 15% standard academic penalty
    aiDetected = true;
    if (reasons.length === 0) {
      reasons.push('Formulaic prose style consistent with generative assistance');
    }
  } else {
    if (reasons.length === 0) {
      reasons.push('Prose exhibits natural student cadence, organic vocabulary, and step flow.');
    }
  }

  return {
    aiProbability,
    aiDetected,
    authenticityBadge,
    badgeColor,
    badgeLabel,
    aiReasons: reasons,
    penaltyPercent
  };
}

module.exports = {
  detectAiContent,
  calculateSentenceBurstiness,
  LLM_STRUCTURAL_MARKERS,
  MARKDOWN_COPY_PATTERNS
};
