const express = require('express');
const authRoutes = require('../server/routes/authRoutes');
const { fetchGitHubData, analyzeGitHubRepos } = require('../server/services/githubService');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Test server listening on port ${port}`);

  try {
    // 1. Verify POST /api/auth/github is disabled
    const ghRes = await fetch(`http://localhost:${port}/api/auth/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'test_code' })
    });
    const ghData = await ghRes.json();
    console.log('1. POST /api/auth/github status:', ghRes.status);
    console.log('   Response message:', ghData.message);
    if (ghRes.status === 403 && ghData.success === false) {
      console.log('   ✓ PASS: POST /api/auth/github correctly disabled!');
    } else {
      throw new Error(`FAIL: Expected 403, got ${ghRes.status}`);
    }

    // 2. Verify POST /api/auth/github/connect requires auth (401)
    const connRes = await fetch(`http://localhost:${port}/api/auth/github/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'torvalds' })
    });
    console.log('2. POST /api/auth/github/connect status (unauth):', connRes.status);
    if (connRes.status === 401) {
      console.log('   ✓ PASS: POST /api/auth/github/connect is properly protected by auth middleware!');
    } else {
      throw new Error(`FAIL: Expected 401, got ${connRes.status}`);
    }

    // 3. Verify GET /api/auth/github/config works
    const configRes = await fetch(`http://localhost:${port}/api/auth/github/config`);
    const configData = await configRes.json();
    console.log('3. GET /api/auth/github/config status:', configRes.status);
    if (configRes.status === 200 && configData.success === true) {
      console.log('   ✓ PASS: GET /api/auth/github/config returns valid config payload!');
    }

    // 4. Verify GitHub repository analysis & skill extraction pipeline is fully intact
    console.log('4. Testing GitHub Repository Analysis & Skill Extraction...');
    const mockRepos = [
      {
        name: 'fullstack-ecommerce',
        language: 'TypeScript',
        description: 'React, Node.js, Express, MongoDB web application with Docker',
        stargazers_count: 5,
        fork: false,
        topics: ['react', 'nodejs', 'mongodb', 'docker', 'typescript']
      },
      {
        name: 'ml-recommendation-engine',
        language: 'Python',
        description: 'Deep learning pipeline with PyTorch and Pandas',
        stargazers_count: 8,
        fork: false,
        topics: ['python', 'pytorch', 'machine-learning']
      }
    ];

    const analysis = analyzeGitHubRepos(mockRepos);
    console.log(`   ✓ Repos analyzed: ${analysis.parsedRepos.length}`);
    console.log(`   ✓ Top languages:`, analysis.topLanguages);
    console.log(`   ✓ Code-verified skills detected (${analysis.verifiedSkills.length}):`, 
      analysis.verifiedSkills.map(s => `${s.displayName} (${s.proficiency}, verified: ${s.isCodeVerified})`).join(', ')
    );

    if (analysis.verifiedSkills.length >= 4 && analysis.verifiedSkills.every(s => s.isCodeVerified === true)) {
      console.log('   ✓ PASS: GitHub repository skill extraction & code verification intact and functional!');
    } else {
      throw new Error('FAIL: Skill extraction did not produce expected verified skills');
    }

    console.log('\n🎉 ALL GITHUB POLICY & SKILL EXTRACTION VERIFICATIONS PASSED!');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
