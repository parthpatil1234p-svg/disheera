/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * search-engine.js — BM25 + Typo-Tolerant Hybrid Search Relevance Engine
 * 
 * Implements:
 * - BM25 (Okapi) Lexical Scoring with Field Length Normalization
 * - Domain-Tuned Synonym & Acronym Expansion (e.g. fe -> frontend, ml -> ai/ml)
 * - Damerau-Levenshtein Edit-Distance Typo Tolerance (max edit distance: 2)
 * - Multi-Field Weight Boosting (Title: 5x, Skills: 3x, Category: 2x, Text: 1x)
 * 
 * Disheera · Enterprise Search & Discovery Engine
 */

(function (window) {
  'use strict';

  // ── 1. Tech & Domain Synonym Expansion Dictionary ───────────
  const SYNONYM_MAP = {
    // Frontend
    'fe': ['frontend', 'front-end', 'react', 'javascript', 'ui'],
    'frontend': ['front-end', 'react', 'vue', 'angular', 'nextjs', 'javascript', 'html', 'css'],
    'front-end': ['frontend', 'react', 'vue', 'angular', 'nextjs', 'javascript', 'html', 'css'],
    'react': ['frontend', 'reactjs', 'javascript', 'typescript', 'nextjs'],
    'vue': ['frontend', 'vuejs', 'javascript', 'typescript'],
    'angular': ['frontend', 'typescript', 'javascript'],
    'nextjs': ['react', 'frontend', 'fullstack', 'ssr'],

    // Backend
    'be': ['backend', 'back-end', 'node', 'api', 'server'],
    'backend': ['back-end', 'node', 'nodejs', 'express', 'django', 'fastapi', 'spring', 'golang', 'api'],
    'back-end': ['backend', 'node', 'nodejs', 'express', 'django', 'fastapi', 'spring', 'golang', 'api'],
    'node': ['nodejs', 'express', 'backend', 'javascript', 'typescript'],
    'nodejs': ['node', 'express', 'backend', 'javascript', 'typescript'],
    'python': ['django', 'fastapi', 'ai', 'data science', 'backend'],
    'golang': ['go', 'backend', 'microservices', 'cloud'],
    'java': ['spring', 'springboot', 'backend', 'enterprise'],

    // Full Stack
    'fs': ['fullstack', 'full-stack', 'mern'],
    'fullstack': ['full-stack', 'mern', 'react', 'node', 'javascript'],
    'full-stack': ['fullstack', 'mern', 'react', 'node', 'javascript'],
    'mern': ['mongodb', 'express', 'react', 'node', 'fullstack'],

    // AI & Data
    'ai': ['artificial intelligence', 'ml', 'machine learning', 'deep learning', 'nlp', 'llm', 'genai'],
    'ml': ['machine learning', 'ai', 'deep learning', 'data science', 'pytorch', 'tensorflow'],
    'dl': ['deep learning', 'neural networks', 'pytorch', 'tensorflow', 'ai'],
    'ds': ['data scientist', 'data science', 'analytics', 'pandas', 'sql'],
    'genai': ['generative ai', 'llm', 'ai', 'prompt engineering'],
    'nlp': ['natural language processing', 'ai', 'llm'],

    // Cloud & DevOps
    'devops': ['sre', 'ci/cd', 'docker', 'kubernetes', 'terraform', 'cloud'],
    'sre': ['site reliability', 'devops', 'kubernetes', 'cloud'],
    'cloud': ['aws', 'azure', 'gcp', 'cloud architect', 'serverless'],
    'aws': ['cloud', 'amazon web services', 'cloud architect', 'lambda', 'ec2'],
    'docker': ['container', 'devops', 'kubernetes', 'ci/cd'],
    'k8s': ['kubernetes', 'devops', 'container', 'orchestration'],

    // Cybersecurity
    'security': ['cybersecurity', 'infosec', 'penetration testing', 'soc', 'ethical hacking'],
    'cyber': ['cybersecurity', 'security', 'infosec', 'firewall'],

    // Design
    'ui': ['user interface', 'ux', 'ui/ux', 'design', 'figma'],
    'ux': ['user experience', 'ui', 'ui/ux', 'user research', 'figma'],
    'design': ['ui/ux', 'product design', 'figma'],

    // Product & Agile
    'pm': ['product manager', 'product management', 'agile', 'scrum'],
    'agile': ['scrum', 'jira', 'product management', 'sprint'],

    // Mobile
    'mobile': ['ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
    'android': ['kotlin', 'mobile', 'java'],
    'ios': ['swift', 'mobile', 'apple'],

    // Web3 / Blockchain
    'web3': ['blockchain', 'solidity', 'crypto', 'smart contract', 'ethereum'],
    'crypto': ['blockchain', 'web3', 'cryptocurrency', 'defi'],

    // Finance & Business
    'finance': ['financial modeling', 'dcf', 'valuation', 'equity research', 'investment'],
    'fin': ['finance', 'financial analyst', 'valuation'],

    // Marketing
    'marketing': ['digital marketing', 'growth', 'seo', 'sem', 'social media', 'content'],
    'seo': ['search engine optimization', 'aeo', 'organic search', 'marketing'],
    'aeo': ['answer engine optimization', 'ai search', 'llms', 'seo']
  };

  // ── 2. Damerau-Levenshtein Edit Distance (Typo-Tolerance) ────
  function getEditDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const al = a.length;
    const bl = b.length;
    const matrix = [];

    for (let i = 0; i <= al; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= bl; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let min = Math.min(
          matrix[i - 1][j] + 1,       // deletion
          matrix[i][j - 1] + 1,       // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );

        // Transposition (swapped adjacent characters: e.g. "teh" -> "the")
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          min = Math.min(min, matrix[i - 2][j - 2] + cost);
        }

        matrix[i][j] = min;
      }
    }

    return matrix[al][bl];
  }

  // ── 3. Tokenizer & Stopword Filter ──────────────────────────
  const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with'
  ]);

  function tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9#+.\s-]/g, ' ')
      .split(/[\s,/-]+/)
      .map(t => t.trim())
      .filter(t => t.length > 1 && !STOPWORDS.has(t));
  }

  // ── 4. BM25 Search Engine Class ─────────────────────────────
  class BM25Engine {
    constructor(options = {}) {
      this.k1 = options.k1 || 1.2;
      this.b = options.b || 0.75;
      this.fieldBoosts = options.fieldBoosts || {
        title: 5.0,
        skills: 3.5,
        category: 2.0,
        description: 1.0,
        company: 2.5
      };
    }

    /**
     * Expand query tokens with synonyms and acronyms
     */
    expandQuery(queryTokens) {
      const expanded = new Set(queryTokens);
      queryTokens.forEach(token => {
        if (SYNONYM_MAP[token]) {
          SYNONYM_MAP[token].forEach(syn => {
            tokenize(syn).forEach(st => expanded.add(st));
          });
        }
      });
      return Array.from(expanded);
    }

    /**
     * Calculate token match score considering exact matches, prefixes, and typo tolerance
     */
    calculateTokenScore(qToken, docToken) {
      if (qToken === docToken) return 1.0;
      if (docToken.startsWith(qToken) && qToken.length >= 3) return 0.85;
      if (qToken.startsWith(docToken) && docToken.length >= 3) return 0.75;

      // Typo tolerance (Levenshtein)
      if (qToken.length >= 4 && docToken.length >= 4) {
        const dist = getEditDistance(qToken, docToken);
        if (dist === 1) return 0.75; // 1-character typo (e.g. "pyton" vs "python")
        if (dist === 2 && qToken.length >= 6) return 0.45; // 2-character typo for longer words
      }

      return 0.0;
    }

    /**
     * Search and rank documents using multi-field BM25 + fuzzy hybrid scoring
     */
    search(documents, queryString, extractFieldsFn) {
      if (!documents || !documents.length) return [];
      const trimmed = (queryString || '').trim();
      if (!trimmed) {
        // Return original documents with zero score
        return documents.map(doc => ({ item: doc, score: 0, matchedTerms: [] }));
      }

      const rawQueryTokens = tokenize(trimmed);
      if (!rawQueryTokens.length) {
        return documents.map(doc => ({ item: doc, score: 0, matchedTerms: [] }));
      }

      const expandedQueryTokens = this.expandQuery(rawQueryTokens);
      const N = documents.length;

      // Extract text representations
      const docData = documents.map(doc => {
        const fields = extractFieldsFn ? extractFieldsFn(doc) : doc;
        const fieldTokens = {};
        let totalTokens = 0;

        for (const [fieldName, val] of Object.entries(fields)) {
          let text = '';
          if (Array.isArray(val)) {
            text = val.map(v => (typeof v === 'object' ? (v.name || v.title || JSON.stringify(v)) : String(v))).join(' ');
          } else if (typeof val === 'string') {
            text = val;
          } else if (val) {
            text = String(val);
          }
          const tokens = tokenize(text);
          fieldTokens[fieldName] = tokens;
          totalTokens += tokens.length;
        }

        return { doc, fieldTokens, totalTokens };
      });

      // Calculate Average Document Length (avgdl)
      const totalAllTokens = docData.reduce((acc, d) => acc + d.totalTokens, 0);
      const avgdl = totalAllTokens / (N || 1);

      // Score each document
      const scoredResults = docData.map(({ doc, fieldTokens, totalTokens }) => {
        let docScore = 0;
        const matchedTerms = new Set();

        rawQueryTokens.forEach(qToken => {
          let bestTermScore = 0;

          for (const [fieldName, tokens] of Object.entries(fieldTokens)) {
            const boost = this.fieldBoosts[fieldName] || 1.0;
            const fieldLen = tokens.length;

            tokens.forEach(docToken => {
              const similarity = this.calculateTokenScore(qToken, docToken);
              if (similarity > 0) {
                // BM25 saturation term
                const tf = similarity;
                const denominator = tf + this.k1 * (1 - this.b + this.b * (fieldLen / (avgdl || 1)));
                const termScore = ((tf * (this.k1 + 1)) / (denominator || 1)) * boost;

                if (termScore > bestTermScore) {
                  bestTermScore = termScore;
                  matchedTerms.add(docToken);
                }
              }
            });
          }

          docScore += bestTermScore;
        });

        // Boost for expanded synonyms
        expandedQueryTokens.forEach(synToken => {
          if (!rawQueryTokens.includes(synToken)) {
            for (const [fieldName, tokens] of Object.entries(fieldTokens)) {
              const boost = (this.fieldBoosts[fieldName] || 1.0) * 0.4; // 40% weight for synonyms
              if (tokens.some(t => t === synToken || t.startsWith(synToken))) {
                docScore += boost * 0.5;
                matchedTerms.add(synToken);
                break;
              }
            }
          }
        });

        return {
          item: doc,
          score: parseFloat(docScore.toFixed(3)),
          matchedTerms: Array.from(matchedTerms)
        };
      });

      // Filter non-matches and sort descending by relevance score
      return scoredResults
        .filter(res => res.score > 0)
        .sort((a, b) => b.score - a.score);
    }
  }

  // Export globally
  window.SearchRelevanceEngine = {
    BM25Engine,
    create: (options) => new BM25Engine(options),
    getEditDistance,
    tokenize,
    SYNONYM_MAP
  };

})(typeof window !== 'undefined' ? window : this);
