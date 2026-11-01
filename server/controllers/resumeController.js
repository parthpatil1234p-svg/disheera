/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/resumeController.js — AI Resume ATS Scoring & Keyword Optimization
 *
 * Disheera · Enterprise Backend Service
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { analyzeResumeText } = require('../services/resumeAnalyzerService');
const { cacheManager } = require('../utils/cacheManager');

/**
 * POST /api/resume/analyze
 * Analyzes resume text or user profile against a target career.
 */
exports.analyzeResume = async (req, res, next) => {
  try {
    const { resumeText, targetCareer } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine target career title
    let selectedCareer = targetCareer;
    if (!selectedCareer) {
      const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' }).populate('career');
      selectedCareer = activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Full-Stack Developer';
    }

    // Determine text to analyze: provided resumeText, or extract from user.resumeUrl, or profile skills fallback
    let textToAnalyze = resumeText;
    if (textToAnalyze && textToAnalyze.trim().length >= 50) {
      const { verifyResumeText } = require('../services/resumeAuthenticityService');
      const textAuth = verifyResumeText(textToAnalyze);
      if (!textAuth.isValid) {
        return res.status(422).json({
          success: false,
          code: textAuth.code || 'INVALID_RESUME_CONTENT',
          detectedType: textAuth.detectedType || 'unsupported_document',
          message: textAuth.message || 'The provided text does not match an authentic resume.',
        });
      }
    } else {
      textToAnalyze = null;
    }

    if (!textToAnalyze) {
      if (user.resumeUrl) {
        try {
          const { downloadResumeBuffer } = require('../services/cloudinaryService');
          const { PDFParse } = require('pdf-parse');
          const { data } = await downloadResumeBuffer(user.resumeUrl);
          if (data && data.length > 0) {
            const parser = new PDFParse({ data });
            await parser.load();
            const parseRes = await parser.getText();
            if (parseRes && typeof parseRes.text === 'string' && parseRes.text.trim().length > 50) {
              textToAnalyze = parseRes.text.trim();
            }
          }
        } catch (pdfErr) {
          console.warn('[resumeController.analyzeResume] Note on resumeUrl extraction:', pdfErr.message);
        }
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 50) {
      const skillsStr = (user.skills || []).map(s => `${s.displayName || s.name} (${s.proficiency})`).join(', ');
      const reposStr = (user.githubRepos || []).map(r => `${r.name}: ${r.description} [${r.detectedSkills?.join(', ')}]`).join('\n');
      textToAnalyze = `
Candidate Name: ${user.name}
Email: ${user.email}
Education: ${user.education?.course || 'Computer Science'} from ${user.education?.college || 'University'} (${user.education?.year || 'Final Year'})
Technical Skills: ${skillsStr}
Projects and Repositories:
${reposStr || 'Full-stack web applications with authentication, databases, and responsive UI.'}
Target Objective: Passionate software engineer seeking roles in ${selectedCareer}.
      `.trim();
    }

    const analysisResult = await analyzeResumeText(textToAnalyze, selectedCareer, user.skills || []);

    // Persist to user record
    user.resumeAnalysis = analysisResult;
    await user.save();
    cacheManager.invalidateUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Resume ATS analysis generated successfully!',
      data: analysisResult
    });
  } catch (error) {
    console.error('[ResumeController.analyzeResume] Error:', error.message);
    next(error);
  }
};

/**
 * GET /api/resume/analysis
 * Returns the student's existing or latest resume ATS evaluation.
 */
exports.getResumeAnalysis = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.resumeAnalysis && user.resumeAnalysis.atsScore) {
      return res.status(200).json({
        success: true,
        data: user.resumeAnalysis
      });
    }

    // Generate initial baseline analysis if not already created
    const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' }).populate('career');
    const targetCareer = activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Software Engineer';
    const skillsStr = (user.skills || []).map(s => `${s.displayName || s.name} (${s.proficiency})`).join(', ');

    const baselineText = `
Candidate: ${user.name}
Education: ${user.education?.course || 'Engineering'}
Skills: ${skillsStr || 'JavaScript, HTML, CSS, Git'}
Objective: Aspiring ${targetCareer}
    `.trim();

    const baseline = await analyzeResumeText(baselineText, targetCareer, user.skills || []);
    user.resumeAnalysis = baseline;
    await user.save();
    cacheManager.invalidateUser(user._id);

    return res.status(200).json({
      success: true,
      data: baseline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to build an empty/blank resume for a student.
 * Contains only the student's real registered info (name, email, and real assessment profile education/skills if any).
 * Never fabricates fake colleges, dummy GPAs, fake projects, or mock internships.
 */
function buildEmptyResume(user) {
  const verifiedSkills = (user?.skills || []).map((s) => ({
    name: s.displayName || s.name,
    level: s.proficiency || 'Intermediate',
    isVerified: Boolean(s.isQuizVerified || s.isCodeVerified),
    category: s.category || 'Technical',
  }));

  const gitHubUrl = (user?.githubProfile && user.githubProfile.login)
    ? `https://github.com/${user.githubProfile.login}`
    : '';

  // Only include real repositories if user connected their GitHub
  const realProjects = (user?.githubRepos || []).slice(0, 3).map((r) => ({
    title: r.name ? r.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Project',
    description: r.description || '',
    techStack: Array.isArray(r.detectedSkills) && r.detectedSkills.length > 0 ? r.detectedSkills : [r.language || 'Code'],
    githubUrl: r.htmlUrl || gitHubUrl,
    liveUrl: '',
    isVerified: Boolean(r.stars > 0 || (r.detectedSkills && r.detectedSkills.length > 0)),
  }));

  // Only include education if the user actually provided it during registration/assessment
  const realEducation = user?.education?.course
    ? [
        {
          degree: user.education.course,
          college: user.education.college || '',
          university: user.education.branch || '',
          startYear: '',
          gradYear: user.education.year || '',
          score: '',
        },
      ]
    : [];

  return {
    template: 'student',
    personalInfo: {
      fullName: user?.name || '',
      headline: '',
      email: user?.email || '',
      phone: '',
      location: '',
      linkedIn: '',
      gitHub: gitHubUrl,
      portfolio: '',
    },
    summary: '',
    education: realEducation,
    skills: verifiedSkills,
    projects: realProjects,
    experience: [],
    certifications: [],
    additional: {
      languages: [],
      achievements: [],
      hobbies: [],
    },
    updatedAt: new Date(),
  };
}

/**
 * Illustrative sample resume helper — only loaded when explicitly requested by user.
 */
function buildSampleResume(user, targetCareer = 'Full-Stack Developer') {
  const gitHubUrl = (user?.githubProfile && user.githubProfile.login) ? `https://github.com/${user.githubProfile.login}` : '';
  return {
    template: 'student',
    personalInfo: {
      fullName: user?.name || 'Student Candidate',
      headline: `Aspiring ${targetCareer}`,
      email: user?.email || 'student@example.com',
      phone: '+91 98765 43210',
      location: 'India',
      linkedIn: 'https://linkedin.com/in/username',
      gitHub: gitHubUrl || 'https://github.com/username',
      portfolio: '',
    },
    summary: `Motivated student pursuing a career in ${targetCareer}. Solid foundation in modern software engineering principles with hands-on project experience.`,
    education: [
      {
        degree: user?.education?.course || 'Bachelor of Technology (B.Tech)',
        college: user?.education?.college || 'University Engineering College',
        university: user?.education?.branch || 'Computer Science',
        startYear: '2023',
        gradYear: user?.education?.year ? `Expected ${user.education.year}` : '2026',
        score: '8.5 / 10 CGPA',
      },
    ],
    skills: [
      { name: 'JavaScript', level: 'Intermediate', isVerified: true, category: 'Technical' },
      { name: 'HTML5 & CSS3', level: 'Advanced', isVerified: true, category: 'Technical' },
      { name: 'Node.js & Express', level: 'Intermediate', isVerified: false, category: 'Technical' },
      { name: 'MongoDB', level: 'Beginner', isVerified: false, category: 'Technical' },
      { name: 'Git & GitHub', level: 'Intermediate', isVerified: true, category: 'Tools' },
    ],
    projects: [
      {
        title: 'Full-Stack Web Application',
        description: 'Architected responsive web application featuring RESTful API integration, authenticated routes, and clean UI.',
        techStack: ['JavaScript', 'HTML5', 'Node.js', 'MongoDB'],
        githubUrl: gitHubUrl,
        liveUrl: '',
        isVerified: true,
      },
    ],
    experience: [
      {
        company: 'Academic Projects & Internships',
        role: 'Software Development Contributor',
        type: 'Academic',
        duration: '2024 - Present',
        responsibilities: [
          'Engineered responsive, accessible user interfaces following mobile-first design principles.',
          'Integrated secure RESTful APIs with input validation and database indexing.',
        ],
      },
    ],
    certifications: [
      {
        name: 'Disheera Verified Skill Competency',
        issuer: 'Disheera Platform',
        date: '2026',
        credentialUrl: '',
      },
    ],
    additional: {
      languages: ['English (Professional)'],
      achievements: ['Achieved verified skill badges across core technical competencies'],
      hobbies: ['Competitive Programming', 'Tech Blogging'],
    },
    updatedAt: new Date(),
  };
}

/**
 * GET /api/resume/builder
 * Returns existing built resume draft, or initializes a clean empty resume for new accounts.
 */
exports.getBuiltResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' }).populate('career');
    const targetCareer = activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Full-Stack Developer';

    let resume = user.builtResume;

    // Detect if this account has the legacy fabricated placeholder draft (Demopo Institute of Technology)
    const isLegacyFakeResume = resume && (
      resume.education?.[0]?.college === 'Demopo Institute of Technology' ||
      resume.projects?.[0]?.title === 'Disheera Web Platform' ||
      resume.experience?.[0]?.company === 'Academic & Hackathon Projects'
    );

    // If no draft exists, or if personalInfo has no fullName, or if it holds legacy fake dummy data, initialize with a clean empty resume
    const needsInit = !resume || !resume.personalInfo || !resume.personalInfo.fullName || isLegacyFakeResume;

    if (needsInit) {
      resume = buildEmptyResume(user);
      user.builtResume = resume;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: resume,
      meta: {
        targetCareer,
        verifiedSkillsCount: (user.skills || []).filter(s => s.isQuizVerified || s.isCodeVerified).length,
        githubConnected: Boolean(user.githubProfile),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resume/builder/clear
 * Resets the student's resume draft to a completely clean, empty canvas.
 */
exports.resetBuiltResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const emptyResume = buildEmptyResume(user);
    user.builtResume = emptyResume;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Resume reset to clean empty canvas.',
      data: emptyResume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resume/builder/sample
 * Loads a sample template for reference/inspiration only when explicitly requested.
 */
exports.loadSampleResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' }).populate('career');
    const targetCareer = activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Full-Stack Developer';

    const sample = buildSampleResume(user, targetCareer);
    user.builtResume = sample;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Sample template loaded for reference.',
      data: sample,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resume/builder
 * Saves updated resume draft state into MongoDB.
 */
exports.saveBuiltResume = async (req, res, next) => {
  try {
    const resumeData = req.body.resumeData || req.body;
    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid resume data provided' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    resumeData.updatedAt = new Date();
    user.builtResume = resumeData;
    await user.save();
    cacheManager.invalidateUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Resume draft saved successfully!',
      data: user.builtResume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resume/improve-text
 * AI-powered resume text enhancement for bullet points and summaries.
 */
exports.improveResumeText = async (req, res, next) => {
  try {
    const { text, type = 'bullet', context = '' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Please provide text of at least 4 characters to improve.',
      });
    }

    const trimmed = text.trim();
    let prompt = '';

    if (type === 'summary') {
      prompt = `You are a Fortune 500 tech recruiter and professional resume writer.
Rewrite this resume summary for an aspiring engineer into 3 distinct, high-impact, ATS-optimized variations.
Make each 2 to 3 concise, punchy sentences highlighting technical passion, problem-solving, and reliability.
Target Role Context: ${context || 'Software Engineering'}

Original Summary:
"${trimmed}"

Respond ONLY with a JSON array of exactly 3 strings with no markdown code fences:
["Variation 1", "Variation 2", "Variation 3"]`;
    } else {
      prompt = `You are a top tech recruiter and ATS resume specialist.
Transform this resume bullet point into 3 high-impact, quantified, action-oriented bullet points using the Google X-Y-Z formula ("Accomplished [X] as measured by [Y], by doing [Z]").
Start with strong action verbs (Engineered, Architected, Accelerated, Streamlined, Spearheaded). Keep each under 25 words.
Context: ${context || 'Software Development'}

Original Bullet:
"${trimmed}"

Respond ONLY with a JSON array of exactly 3 strings with no markdown code fences:
["Bullet 1", "Bullet 2", "Bullet 3"]`;
    }

    let suggestions = [];

    // 1. Try Groq LLaMA-3 (fastest response)
    const { callGroq } = require('../services/groqService');
    const { callGemini } = require('../services/geminiService');

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await callGroq([
          { role: 'system', content: 'You are an expert resume editor. You output strictly raw JSON arrays of strings.' },
          { role: 'user', content: prompt }
        ]);

        const cleaned = groqRes.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed.slice(0, 3);
        }
      } catch (groqErr) {
        console.warn('[improveResumeText] Groq note:', groqErr.message);
      }
    }

    // 2. Try Gemini fallback
    if (suggestions.length === 0 && process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await callGemini(
          [{ role: 'user', parts: [{ text: prompt }] }],
          null,
          null,
          'You are an expert resume editor. You output strictly raw JSON arrays of strings.'
        );
        const cleaned = geminiRes.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed.slice(0, 3);
        }
      } catch (gemErr) {
        console.warn('[improveResumeText] Gemini note:', gemErr.message);
      }
    }

    // 3. Fallback Heuristics Generator (Guarantees zero-failure operation)
    if (suggestions.length === 0) {
      if (type === 'summary') {
        suggestions = [
          `Results-driven ${context || 'Software Engineer'} with strong proficiency in building modern web applications, optimizing databases, and solving complex problems with clean, scalable code.`,
          `Passionate technologist equipped with hands-on project experience in ${context || 'Full-Stack Development'}, dedicated to engineering accessible, high-performance digital products and collaborating in agile teams.`,
          `Motivated and agile engineering candidate with proven ability in ${trimmed.slice(0, 50)}... eager to contribute strong development skills and continuous learning to high-growth tech teams.`,
        ];
      } else {
        const cleanRaw = trimmed.replace(/^[•\-\*]\s*/, '').replace(/\.$/, '');
        suggestions = [
          `Architected and deployed ${cleanRaw.toLowerCase()}, enhancing application responsiveness and reducing load latency by 28%.`,
          `Engineered scalable solution for ${cleanRaw.toLowerCase()}, ensuring 99.9% uptime and adhering to modern modular coding standards.`,
          `Spearheaded the development of ${cleanRaw.toLowerCase()}, collaborating with peers to accelerate feature delivery by 35%.`,
        ];
      }
    }

    return res.status(200).json({
      success: true,
      type,
      originalText: trimmed,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resume/match-job
 * Compares resume against a pasted job description, computes ATS match %, and highlights missing skills.
 */
exports.matchResumeToJob = async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please paste a job description of at least 20 characters for ATS evaluation.',
      });
    }

    const jdText = jobDescription.toLowerCase();

    // 1. Gather all resume textual terms and skills
    const resumeSkills = [];
    if (resumeData?.skills && Array.isArray(resumeData.skills)) {
      resumeData.skills.forEach(s => {
        if (s.name) resumeSkills.push(s.name.trim());
      });
    }

    let resumeFullText = '';
    if (resumeData) {
      resumeFullText = [
        resumeData.personalInfo?.headline || '',
        resumeData.summary || '',
        (resumeData.projects || []).map(p => `${p.title} ${p.description} ${(p.techStack || []).join(' ')}`).join(' '),
        (resumeData.experience || []).map(e => `${e.role} ${e.company} ${(e.responsibilities || []).join(' ')}`).join(' '),
        (resumeData.education || []).map(ed => `${ed.degree} ${ed.college}`).join(' '),
        resumeSkills.join(' '),
      ].join(' ').toLowerCase();
    }

    // 2. Common tech keyword dictionary for matching
    const KEYWORD_BANK = [
      'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'html', 'css', 'bootstrap', 'tailwind',
      'node.js', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'c++', 'c#', '.net', 'sql', 'mysql',
      'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'ci/cd',
      'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'unit testing', 'jest', 'cypress', 'linux',
      'data structures', 'algorithms', 'system design', 'machine learning', 'artificial intelligence'
    ];

    // Helper: Safely match keywords with proper word/symbol boundaries
    const keywordMatches = (text, kw) => {
      if (!text || !kw) return false;
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundaryStart = /^\w/.test(kw) ? '\\b' : '';
      const boundaryEnd = /\w$/.test(kw) ? '\\b' : '(?![a-zA-Z0-9])';
      try {
        const rx = new RegExp(`${boundaryStart}${escaped}${boundaryEnd}`, 'i');
        return rx.test(text);
      } catch (e) {
        return text.toLowerCase().includes(kw.toLowerCase());
      }
    };

    // Find keywords demanded by Job Description
    const demandedKeywords = [];
    KEYWORD_BANK.forEach(kw => {
      if (keywordMatches(jdText, kw)) {
        demandedKeywords.push(kw);
      }
    });

    // Determine matched vs missing keywords
    const matchedSkills = [];
    const missingSkills = [];

    demandedKeywords.forEach(kw => {
      const inResume = keywordMatches(resumeFullText, kw);
      if (inResume) {
        matchedSkills.push({
          name: kw.charAt(0).toUpperCase() + kw.slice(1),
          foundInResume: true,
        });
      } else {
        missingSkills.push({
          name: kw.charAt(0).toUpperCase() + kw.slice(1),
          importance: jdText.indexOf(kw) < jdText.length * 0.4 ? 'High' : 'Medium',
        });
      }
    });

    // 3. Compute ATS Match Score
    let score = 50; // Baseline
    if (demandedKeywords.length > 0) {
      const matchRatio = matchedSkills.length / demandedKeywords.length;
      score = Math.round(40 + (matchRatio * 55));
    } else {
      score = 75;
    }
    score = Math.min(Math.max(score, 25), 98);

    // 4. Generate Tailoring Advice
    const tailoringAdvice = [];
    if (missingSkills.length > 0) {
      const highPriority = missingSkills.filter(s => s.importance === 'High').map(s => s.name);
      if (highPriority.length > 0) {
        tailoringAdvice.push(`Incorporate high-priority keywords: **${highPriority.slice(0, 3).join(', ')}** into your Skills and Project descriptions.`);
      }
      tailoringAdvice.push(`Align your headline to match the job title mentioned in the opening.`);
    } else {
      tailoringAdvice.push('Excellent keyword alignment! Ensure your project bullet points quantify business impact (e.g. % speed, user count).');
    }
    tailoringAdvice.push('Review your verified skills badge — highlighting verified competencies improves recruiter click-through rates by up to 40%.');

    return res.status(200).json({
      success: true,
      data: {
        matchScore: score,
        matchedCount: matchedSkills.length,
        missingCount: missingSkills.length,
        demandedCount: demandedKeywords.length,
        matchedSkills,
        missingSkills,
        tailoringAdvice,
        verdict: score >= 80 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : 'Needs Optimization',
      },
    });
  } catch (error) {
    next(error);
  }
};

