/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/companyVerificationService.js — Real Company & Recruiter Authenticity Engine
 *
 * Implements multi-tier corporate validation:
 *  1. Webmail Blacklist Check (prohibits @gmail.com, @yahoo.com, disposable temp mails)
 *  2. Domain Cross-Match (email domain matches company website)
 *  3. DNS MX Record Resolution (verifies active mail exchange servers on corporate domain)
 *  4. HTTP/HTTPS Live Probing (verifies company website responds with valid HTTP status)
 *  5. AI Corporate Intelligence (Groq Llama 3.3 / Gemini corporate analysis & legitimacy score)
 *
 * Disheera · Enterprise Backend Service
 */

const dns = require('dns');
const { callGroq } = require('./groqService');
const { callGemini } = require('./geminiService');

// ── 1. Comprehensive Free & Disposable Webmail Blacklist ──────────────────────
const FREE_WEBMAIL_DOMAINS = new Set([
  // Popular Consumer Webmails
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.com.br', 'ymail.com', 'rocketmail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'windowslive.com',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'zoho.com', 'zohomail.in', 'zohomail.com',
  'aol.com', 'aim.com',
  'mail.com', 'email.com', 'usa.com', 'post.com',
  'gmx.com', 'gmx.net', 'gmx.de',
  'yandex.com', 'yandex.ru', 'ya.ru',
  'mail.ru', 'inbox.ru', 'bk.ru',
  'rediffmail.com', 'rediff.com',
  'lycos.com', 'fastmail.com', 'tutanota.com', 'tuta.io',

  // Disposable / Temporary / Trash Email Providers
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.net',
  '10minutemail.com', 'throwawaymail.com', 'trashmail.com', 'sharklasers.com',
  'dispostable.com', 'fakemailgenerator.com', 'getnada.com', 'mohmal.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'dropmail.me', 'inboxkitten.com',
  'burnermail.io', 'crazymailing.com', 'generator.email', 'tempinbox.com'
]);

/**
 * Checks if an email address or domain belongs to a free consumer webmail or disposable service
 * @param {string} input - Email address or domain string
 * @returns {boolean}
 */
function isFreeWebmail(input) {
  if (!input || typeof input !== 'string') return false;
  const domain = extractDomain(input);
  return FREE_WEBMAIL_DOMAINS.has(domain);
}

/**
 * Cleans and extracts the root/primary domain from a URL or email
 * e.g., "https://careers.razorpay.com/about" -> "razorpay.com"
 * e.g., "recruiter@stripe.com" -> "stripe.com"
 * @param {string} input
 * @returns {string}
 */
function extractDomain(input) {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim().toLowerCase();

  // If email format, take portion after @
  if (str.includes('@')) {
    str = str.split('@')[1] || '';
  }

  // Strip protocol
  str = str.replace(/^[a-zA-Z]+:\/\//, '');

  // Strip credentials
  if (str.includes('@')) {
    str = str.split('@')[1];
  }

  // Strip port, path, query, hash
  str = str.split('/')[0].split('?')[0].split('#')[0].split(':')[0];

  // Strip leading www. or m.
  str = str.replace(/^www\./, '').replace(/^m\./, '');

  return str.trim();
}

/**
 * Checks whether two domains match or share the same parent domain
 * e.g., "careers.razorpay.com" matches "razorpay.com"
 * @param {string} domainA
 * @param {string} domainB
 * @returns {boolean}
 */
function domainsMatch(domainA, domainB) {
  const d1 = extractDomain(domainA);
  const d2 = extractDomain(domainB);
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;

  // Check parent-subdomain relationships (e.g. jobs.google.com and google.com)
  if (d1.endsWith('.' + d2) || d2.endsWith('.' + d1)) {
    return true;
  }

  // Split into parts to check primary domain matching
  const parts1 = d1.split('.');
  const parts2 = d2.split('.');
  if (parts1.length >= 2 && parts2.length >= 2) {
    const root1 = parts1.slice(-2).join('.');
    const root2 = parts2.slice(-2).join('.');
    if (root1 === root2) return true;
  }

  return false;
}

/**
 * Resolves DNS MX (Mail Exchange) records to verify the domain has live mail routing
 * @param {string} domain
 * @param {number} timeoutMs
 * @returns {Promise<{ valid: boolean, mxRecords: Array, error?: string }>}
 */
async function checkDnsMx(domain, timeoutMs = 3500) {
  const cleanDomain = extractDomain(domain);
  if (!cleanDomain) {
    return { valid: false, mxRecords: [], error: 'Invalid domain specified' };
  }

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ valid: false, mxRecords: [], error: 'DNS resolution timed out' });
      }
    }, timeoutMs);

    dns.promises.resolveMx(cleanDomain)
      .then((records) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const hasMx = Array.isArray(records) && records.length > 0;
          resolve({
            valid: hasMx,
            mxRecords: records || [],
            error: hasMx ? null : 'No active Mail Exchange (MX) records found for domain'
          });
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({
            valid: false,
            mxRecords: [],
            error: err.code || err.message || 'DNS lookup failed'
          });
        }
      });
  });
}

/**
 * Probes the company website via HTTPS/HTTP to confirm it is live
 * @param {string} domainOrUrl
 * @param {number} timeoutMs
 * @returns {Promise<{ live: boolean, status: number|null, url: string, error?: string }>}
 */
async function checkWebsiteLive(domainOrUrl, timeoutMs = 4000) {
  const cleanDomain = extractDomain(domainOrUrl);
  if (!cleanDomain) {
    return { live: false, status: null, url: '', error: 'Invalid website specified' };
  }

  // SSRF Protection: Reject private/local IP ranges and non-public hostnames
  const lower = cleanDomain.toLowerCase();
  const isPrivateOrLocal = (
    lower === 'localhost' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.lan') ||
    lower.endsWith('.localdomain') ||
    lower.includes(':') ||
    lower.startsWith('[') ||
    lower.endsWith(']') ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(lower) // disallow raw IP addresses
  );

  const isValidFqdn = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i.test(cleanDomain);

  if (isPrivateOrLocal || !isValidFqdn) {
    return { live: false, status: null, url: '', error: 'Domain must be a valid public FQDN' };
  }

  const urlsToTry = [
    `https://${encodeURIComponent(cleanDomain).replace(/%2E/gi, '.')}`,
    `http://${encodeURIComponent(cleanDomain).replace(/%2E/gi, '.')}`
  ];

  for (const targetUrl of urlsToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // We attempt a lightweight GET or HEAD request
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Disheera-Verifier/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timer);

      // Any HTTP 2xx or 3xx or 403 (Cloudflare/Akamai bot-block) means the server physically exists
      if (response.status >= 200 && response.status < 400) {
        return { live: true, status: response.status, url: targetUrl };
      }
      if (response.status === 403 || response.status === 401) {
        // Site exists behind Cloudflare / firewall
        return { live: true, status: response.status, url: targetUrl };
      }
    } catch (err) {
      // Continue to try next URL
    }
  }

  return { live: false, status: null, url: `https://${cleanDomain}`, error: 'Company website could not be reached' };
}

/**
 * AI Corporate Intelligence: Evaluates company legitimacy, scale, industry, and flags
 * @param {Object} params
 * @param {string} params.companyName
 * @param {string} params.domain
 * @param {string} params.website
 * @returns {Promise<{ isLikelyLegitimate: boolean, confidenceScore: number, industry: string, summary: string, flags: Array }>}
 */
async function verifyCompanyWithAi({ companyName, domain, website }) {
  const cleanDomain = extractDomain(domain || website);
  const prompt = `You are an expert corporate compliance and recruitment verification auditor.
Evaluate the following employer details to determine if this is a genuine, legitimate company or a suspicious/fraudulent registrant:

Company Name: "${companyName || 'Unknown'}"
Official Corporate Domain: "${cleanDomain}"
Website Provided: "${website || ''}"

Return ONLY a strict JSON object with no markdown fences, no surrounding commentary, adhering to this exact format:
{
  "isLikelyLegitimate": true,
  "confidenceScore": 92,
  "industry": "Fintech / Cloud Software",
  "estimatedSize": "51-200",
  "summary": "Genuine business entity operating in the financial technology sector with verified brand presence.",
  "flags": []
}`;

  // 1. Try Groq Llama 3.3 first (Ultra-low latency ~300ms)
  try {
    const groqResponse = await callGroq([
      { role: 'system', content: 'You are a corporate intelligence auditor. Output raw JSON only.' },
      { role: 'user', content: prompt }
    ], 'llama-3.3-70b-versatile');

    const parsed = parseAiJsonResponse(groqResponse);
    if (parsed && typeof parsed.isLikelyLegitimate === 'boolean') {
      return {
        isLikelyLegitimate: parsed.isLikelyLegitimate,
        confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 85)),
        industry: parsed.industry || 'Technology & Services',
        estimatedSize: parsed.estimatedSize || '51-200',
        summary: parsed.summary || `${companyName} is a verified operating entity.`,
        flags: Array.isArray(parsed.flags) ? parsed.flags : []
      };
    }
  } catch (err) {
    // Groq failed, fall through to Gemini
  }

  // 2. Try Gemini 2.0 / 1.5 Flash fallback
  try {
    const geminiResponse = await callGemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      'gemini-2.0-flash',
      null,
      'You are a corporate intelligence auditor. Output raw JSON only.'
    );

    const parsed = parseAiJsonResponse(geminiResponse);
    if (parsed && typeof parsed.isLikelyLegitimate === 'boolean') {
      return {
        isLikelyLegitimate: parsed.isLikelyLegitimate,
        confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 85)),
        industry: parsed.industry || 'Technology & Services',
        estimatedSize: parsed.estimatedSize || '51-200',
        summary: parsed.summary || `${companyName} is a verified operating entity.`,
        flags: Array.isArray(parsed.flags) ? parsed.flags : []
      };
    }
  } catch (err) {
    // Fall back to rule-based corporate heuristics
  }

  // 3. Deterministic Heuristic Fallback (Zero external AI dependencies)
  return heuristicCompanyIntelligence(companyName, cleanDomain);
}

/**
 * Deterministic heuristic company intelligence fallback
 */
function heuristicCompanyIntelligence(companyName, domain) {
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  const isEstablishedTld = ['com', 'org', 'in', 'io', 'ai', 'co', 'net', 'tech', 'dev', 'edu'].includes(tld);
  const nameLength = (companyName || '').trim().length;

  let score = 75;
  if (isEstablishedTld) score += 10;
  if (nameLength >= 3 && nameLength <= 50) score += 10;
  if (domain.includes('fake') || domain.includes('test') || domain.includes('temp') || domain.includes('demo')) {
    score -= 50;
  }

  const isLegit = score >= 65;

  return {
    isLikelyLegitimate: isLegit,
    confidenceScore: Math.min(95, Math.max(20, score)),
    industry: 'Software & Technology Services',
    estimatedSize: '51-200',
    summary: isLegit
      ? `${companyName || domain} matches active corporate domain conventions on .${tld}.`
      : 'Domain pattern indicates an unverified or high-risk origin.',
    flags: isLegit ? [] : ['Unverified TLD or automated risk pattern detected']
  };
}

/**
 * Safely parses raw text into JSON, stripping backticks if any
 */
function parseAiJsonResponse(text) {
  if (!text) return null;
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    return JSON.parse(clean.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Master Verification Pipeline: Executes all checks and computes a unified confidence score
 * @param {Object} input
 * @param {string} input.companyName
 * @param {string} input.email
 * @param {string} input.website
 * @returns {Promise<Object>}
 */
async function computeOverallCompanyVerification({ companyName, email, website }) {
  const corporateEmail = (email || '').trim().toLowerCase();
  const emailDomain = extractDomain(corporateEmail);
  const websiteDomain = extractDomain(website || emailDomain);

  // 1. Mandatory Check: Free Webmail Blacklist
  if (isFreeWebmail(corporateEmail) || isFreeWebmail(emailDomain)) {
    return {
      success: false,
      isRealCompany: false,
      confidenceScore: 0,
      reason: 'Free webmail addresses (@gmail.com, @yahoo.com, @outlook.com, etc.) are strictly prohibited for recruiter accounts. Please enter your official corporate/work email (e.g., recruiter@company.com).',
      verificationDetails: {
        isFreeWebmail: true,
        domainMatch: false,
        dnsValid: false,
        websiteLive: false,
        aiScore: 0
      },
      companyDetails: null
    };
  }

  // 2. Domain Cross-Match Check
  const domainMatch = websiteDomain ? domainsMatch(emailDomain, websiteDomain) : true;
  if (!domainMatch) {
    return {
      success: false,
      isRealCompany: false,
      confidenceScore: 15,
      reason: `Corporate email domain ("${emailDomain}") does not match the company website ("${websiteDomain}"). Official recruiters must register with the company's verified domain.`,
      verificationDetails: {
        isFreeWebmail: false,
        domainMatch: false,
        dnsValid: false,
        websiteLive: false,
        aiScore: 0
      },
      companyDetails: null
    };
  }

  // 3. Parallel Execution: DNS MX Resolution, Live Website Probe & AI Intelligence
  const primaryDomain = websiteDomain || emailDomain;
  const [dnsResult, webResult, aiResult] = await Promise.all([
    checkDnsMx(emailDomain),
    checkWebsiteLive(primaryDomain),
    verifyCompanyWithAi({ companyName, domain: primaryDomain, website })
  ]);

  // 4. Calculate Composite Legitimacy Score (0-100)
  // Weight Breakdown:
  // - Domain match: 20 pts
  // - DNS MX records valid: 35 pts
  // - Website live & accessible: 25 pts
  // - AI corporate intelligence: 20 pts
  let compositeScore = 0;

  if (domainMatch) compositeScore += 20;
  if (dnsResult.valid) compositeScore += 35;
  if (webResult.live) compositeScore += 25;

  const aiWeight = (aiResult.confidenceScore / 100) * 20;
  compositeScore += Math.round(aiWeight);

  // Auto-cap between 0 and 100
  compositeScore = Math.min(100, Math.max(0, compositeScore));

  const isRealCompany = compositeScore >= 65 && dnsResult.valid;

  // Auto-generate high-res company logo URL using Google Favicon Service
  const logoUrl = `https://www.google.com/s2/favicons?domain=${primaryDomain}&sz=128`;

  return {
    success: isRealCompany,
    isRealCompany,
    confidenceScore: compositeScore,
    reason: isRealCompany
      ? null
      : (!dnsResult.valid
          ? `Domain "${emailDomain}" does not have valid mail exchange (MX) servers configured.`
          : 'Company verification confidence score is below the minimum required 65% threshold.'),
    verificationDetails: {
      isFreeWebmail: false,
      domainMatch,
      dnsValid: dnsResult.valid,
      websiteLive: webResult.live,
      aiSummary: aiResult.summary,
      aiScore: aiResult.confidenceScore,
      flags: aiResult.flags,
      verifiedAt: isRealCompany ? new Date() : null
    },
    companyDetails: {
      name: companyName || primaryDomain.split('.')[0].toUpperCase(),
      domain: primaryDomain,
      website: webResult.url || `https://${primaryDomain}`,
      industry: aiResult.industry,
      companySize: aiResult.estimatedSize || '51-200',
      logoUrl
    }
  };
}

module.exports = {
  FREE_WEBMAIL_DOMAINS,
  isFreeWebmail,
  extractDomain,
  domainsMatch,
  checkDnsMx,
  checkWebsiteLive,
  verifyCompanyWithAi,
  computeOverallCompanyVerification
};
