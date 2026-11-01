/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * codeBugChallenges.js - Curated Real-World Bug-Fixing Challenges
 * Powers the In-Browser "Fix-the-Bug" Proof-of-Work Chamber.
 * Replaces cheat-prone multiple-choice questions with authentic production code debugging.
 *
 * Disheera - Enterprise Skill Verification Engine
 */

const CODE_BUG_CHALLENGES = [
  {
    id: 'js-promise-unhandled-rejection',
    title: 'Fix Unhandled Promise Rejection in Async Worker',
    category: 'JavaScript / Node.js',
    difficulty: 'Medium',
    targetSkill: 'JavaScript',
    filename: 'worker.js',
    language: 'javascript',
    scenario: 'In an asynchronous batch data pipeline, network retries fail silently and crash the Node.js process with UnhandledPromiseRejection. The error handler is not properly returned through the promise chain.',
    errorLog: 'UnhandledPromiseRejection: Error: Gateway timeout connecting to payment service\n    at fetchWithRetry (worker.js:14:11)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\nProcess exited with status code 1',
    initialCode: `// Buggy implementation: Unhandled promise rejection
async function fetchUserTransactions(userId, gatewayUrl) {
  const fetchPromise = new Promise((resolve, reject) => {
    if (!userId) {
      // BUG: Throwing without rejecting causes unhandled error
      throw new Error("Invalid User ID");
    }
    setTimeout(() => {
      if (gatewayUrl.includes("error")) {
        reject(new Error("Gateway connection timed out"));
      } else {
        resolve({ userId, transactions: [100, 250, 40] });
      }
    }, 50);
  });

  // BUG: Missing catch or try/await wrapper
  const result = await fetchPromise;
  return result;
}`,
    canonicalSolution: `// Verified fix: Proper error handling with try/catch and input validation
async function fetchUserTransactions(userId, gatewayUrl) {
  if (!userId) {
    throw new Error("Invalid User ID");
  }

  try {
    const result = await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!gatewayUrl || gatewayUrl.includes("error")) {
          reject(new Error("Gateway connection timed out"));
        } else {
          resolve({ userId, transactions: [100, 250, 40] });
        }
      }, 50);
    });

    return result;
  } catch (err) {
    return { error: err.message, userId, transactions: [] };
  }
}`,
    hints: [
      'Validate userId before constructing the async Promise to avoid unhandled throws.',
      'Wrap the await statement in a try/catch block so failed gateway calls return a graceful fallback instead of crashing the process.',
      'Return a structured object with an error key and empty transactions array on failure.'
    ],
    testCases: [
      {
        description: 'Should return transactions for valid user and healthy gateway',
        input: ['usr-101', 'https://api.payment.internal/v1'],
        expectedOutput: { userId: 'usr-101', transactions: [100, 250, 40] }
      },
      {
        description: 'Should gracefully handle gateway errors without crashing',
        input: ['usr-102', 'https://api.payment.internal/error'],
        expectedOutput: { error: 'Gateway connection timed out', userId: 'usr-102', transactions: [] }
      }
    ]
  },
  {
    id: 'js-array-reference-mutation',
    title: 'Prevent In-Place Mutation of Shared Redux/State Array',
    category: 'JavaScript / Node.js',
    difficulty: 'Easy',
    targetSkill: 'JavaScript',
    filename: 'analytics.js',
    language: 'javascript',
    scenario: 'A dashboard data table allows users to sort candidates by score. However, calling sort() directly mutates the original props array in place, corrupting the parent component state and triggering accidental re-renders.',
    errorLog: 'Invariant Violation: Cannot modify frozen array elements in strict mode.\n    at Array.sort (<anonymous>)\n    at getTopPerformers (analytics.js:8:15)\n    at renderDashboard (dashboard.js:42:19)',
    initialCode: `// Buggy implementation: Mutates original array in place
function getTopPerformers(candidateList, limit) {
  if (!candidateList) return [];

  // BUG: Array.prototype.sort mutates the source array directly!
  const sorted = candidateList.sort((a, b) => b.score - a.score);

  return sorted.slice(0, limit);
}`,
    canonicalSolution: `// Verified fix: Create shallow clone before sorting
function getTopPerformers(candidateList, limit) {
  if (!Array.isArray(candidateList)) return [];

  // Create shallow copy using spread or slice to prevent mutation
  const sorted = [...candidateList].sort((a, b) => b.score - a.score);

  return sorted.slice(0, limit);
}`,
    hints: [
      'In JavaScript, arr.sort() mutates the array in-place rather than returning a new copy.',
      'Use the spread operator [...candidateList] or candidateList.slice() before calling .sort().',
      'Verify that candidateList is an array with Array.isArray().'
    ],
    testCases: [
      {
        description: 'Should sort candidates without mutating original input array',
        testFn: `(fn) => {
          const original = [{ name: 'A', score: 40 }, { name: 'B', score: 90 }, { name: 'C', score: 70 }];
          const originalCopy = JSON.stringify(original);
          const top = fn(original, 2);
          const didNotMutate = JSON.stringify(original) === originalCopy;
          const isCorrectOrder = top.length === 2 && top[0].score === 90 && top[1].score === 70;
          return didNotMutate && isCorrectOrder;
        }`
      }
    ]
  },
  {
    id: 'react-useeffect-dependency-loop',
    title: 'Resolve Infinite Re-Render Loop in React Component Hook',
    category: 'React / Frontend',
    difficulty: 'Medium',
    targetSkill: 'React',
    filename: 'ProfileCard.jsx',
    language: 'jsx',
    scenario: 'A React user profile card fetches telemetry metrics inside useEffect. Because a new object reference is created on every render and placed in the dependency array, the component enters an infinite re-render loop that locks the browser tab.',
    errorLog: 'Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn\'t have a dependency array, or one of the dependencies changes on every render.\n    at ProfileCard (ProfileCard.jsx:18)',
    initialCode: `// Buggy React hook pattern: Object dependency recreated on each render
function useProfileTelemetry(userId) {
  const [telemetry, setTelemetry] = React.useState({ views: 0, rank: 'N/A' });
  const config = { target: userId, timestamp: Date.now() }; // BUG: New object created every render!

  React.useEffect(() => {
    // Fetches metrics and updates state
    function loadMetrics() {
      const computedRank = userId ? 'Top 10%' : 'Unranked';
      setTelemetry({ views: 42, rank: computedRank });
    }
    loadMetrics();
  }, [config]); // BUG: config reference changes every render -> infinite loop

  return telemetry;
}`,
    canonicalSolution: `// Verified fix: Use primitive dependency (userId) or memoize config
function useProfileTelemetry(userId) {
  const [telemetry, setTelemetry] = React.useState({ views: 0, rank: 'N/A' });

  React.useEffect(() => {
    if (!userId) return;

    function loadMetrics() {
      const computedRank = userId ? 'Top 10%' : 'Unranked';
      setTelemetry({ views: 42, rank: computedRank });
    }
    loadMetrics();
  }, [userId]); // Fixed: Primitive string/id dependency only changes when user changes

  return telemetry;
}`,
    hints: [
      'Objects and arrays created inside component bodies get a new memory reference on every render.',
      'Placing non-memoized objects in the useEffect dependency array triggers an infinite loop.',
      'Depend only on the primitive userId value instead of the unstable config object.'
    ],
    testCases: [
      {
        description: 'Should only update when userId changes without infinite re-renders',
        testFn: `(code) => {
          return !code.includes('[config]') && (code.includes('[userId]') || code.includes('useMemo'));
        }`
      }
    ]
  },
  {
    id: 'react-stale-closure-counter',
    title: 'Fix Stale Closure in React Timer Hook',
    category: 'React / Frontend',
    difficulty: 'Medium',
    targetSkill: 'React',
    filename: 'useExamTimer.jsx',
    language: 'jsx',
    scenario: 'An assessment timer displays elapsed exam seconds. The timer interval captures a stale closure of the state variable, causing the timer to freeze at 1 second instead of counting up.',
    errorLog: 'Telemetry anomaly: Timer state remained at 1 for 180 consecutive seconds.\n    at ExamHUD.jsx:34 (tick)',
    initialCode: `// Buggy React timer: Captures stale state value in interval closure
function useExamTimer() {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      // BUG: Stale closure captures seconds = 0 forever!
      setSeconds(seconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty deps captures initial render seconds = 0

  return seconds;
}`,
    canonicalSolution: `// Verified fix: Use functional state updater to access current state
function useExamTimer() {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      // Functional updater provides latest state value regardless of closure
      setSeconds(prevSeconds => prevSeconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return seconds;
}`,
    hints: [
      'When an interval callback runs, it sees the variables from the render cycle where it was created.',
      'Use the functional updater pattern: setSeconds(prev => prev + 1).',
      'This avoids needing seconds in the dependency array and ensures accurate counter increments.'
    ],
    testCases: [
      {
        description: 'Should use functional state updater prev => prev + 1',
        testFn: `(code) => {
          return code.includes('setSeconds(prev') || code.includes('setSeconds((prev') || code.includes('prevSeconds =>');
        }`
      }
    ]
  },
  {
    id: 'python-mutable-default-argument',
    title: 'Eliminate Python Mutable Default Argument Memory Leak',
    category: 'Python / Backend',
    difficulty: 'Easy',
    targetSkill: 'Python',
    filename: 'solution.py',
    language: 'python',
    scenario: 'In an applicant tracking service, a helper function records interview stage notes with a default list parameter. Because Python evaluates default arguments once at definition time, notes from candidate A leak into candidate B.',
    errorLog: 'AssertionError: Candidate 2 should have 1 note, but found 3 notes from previous candidate evaluations!\n    assert len(candidate_b.notes) == 1\n    E  assert 3 == 1',
    initialCode: `# Buggy Python implementation: Mutable default argument
def add_interview_note(candidate_id, note, history=[]):
    """Adds an evaluation note to candidate review history."""
    # BUG: history list is created once at function definition time!
    history.append({
        "candidate_id": candidate_id,
        "note": note
    })
    return history`,
    canonicalSolution: `# Verified fix: Use None as default and initialize inside function
def add_interview_note(candidate_id, note, history=None):
    """Adds an evaluation note to candidate review history safely."""
    if history is None:
        history = []
    
    history.append({
        "candidate_id": candidate_id,
        "note": note
    })
    return history`,
    hints: [
      'In Python, default arguments are evaluated only once when the function is defined, not every time it is called.',
      'Using a mutable default like history=[] shares the same list across all calls.',
      'Use history=None as the default parameter, and do history = [] if history is None inside the body.'
    ],
    testCases: [
      {
        description: 'Should use None as default parameter instead of mutable list []',
        testFn: `(code) => {
          const norm = code.replace(/\\s+/g, ' ');
          const hasNoneDefault = code.includes('history=None') || code.includes('history = None') || norm.includes('history=None') || norm.includes('history = None');
          const hasNoneCheck = code.includes('if history is None') || code.includes('if not history') || code.includes('history is None') || norm.includes('if history is None');
          return hasNoneDefault && hasNoneCheck;
        }`
      }
    ]
  },
  {
    id: 'sql-off-by-one-pagination',
    title: 'Fix Off-By-One SQL Pagination Skipping Rows',
    category: 'SQL / Databases',
    difficulty: 'Medium',
    targetSkill: 'SQL',
    filename: 'query.sql',
    language: 'sql',
    scenario: 'A recruiter applicant table queries 10 candidates per page. Due to an off-by-one formula in the OFFSET clause, the query skips candidate #10 on Page 1 and starts Page 2 at row #11, dropping candidates from the radar.',
    errorLog: 'Data Integrity Alert: Candidate ID 2049 present in database table but missing from both Page 1 and Page 2 search queries.',
    initialCode: `-- Buggy SQL Query: Page number calculation skips row on offset
-- Parameters: @page = 1 (1-based), @pageSize = 10
SELECT 
    id, full_name, degree, overall_score 
FROM 
    candidates
ORDER BY 
    overall_score DESC
-- BUG: When page=1, OFFSET is (1 * 10) = 10, skipping the first 10 rows completely!
OFFSET (@page * @pageSize) ROWS
FETCH NEXT @pageSize ROWS ONLY;`,
    canonicalSolution: `-- Verified Fix: Offset by (page - 1) * pageSize for 1-based indexing
SELECT 
    id, full_name, degree, overall_score 
FROM 
    candidates
ORDER BY 
    overall_score DESC
-- Correct 1-based offset formula: page 1 -> offset 0; page 2 -> offset 10
OFFSET ((@page - 1) * @pageSize) ROWS
FETCH NEXT @pageSize ROWS ONLY;`,
    hints: [
      'For 1-based page numbering (where Page 1 is the first page), Page 1 must start at OFFSET 0.',
      'The formula for 1-based pagination offset is (page - 1) * pageSize.',
      'Check what happens when page=1: (1 - 1) * 10 = 0.'
    ],
    testCases: [
      {
        description: 'Should compute offset as (page - 1) * pageSize',
        testFn: `(code) => {
          return code.includes('(@page - 1)') || code.includes('(page - 1)');
        }`
      }
    ]
  },
  {
    id: 'node-express-missing-error-middleware',
    title: 'Fix Swallowed Exceptions in Express Error Handler',
    category: 'JavaScript / Node.js',
    difficulty: 'Medium',
    targetSkill: 'Node.js',
    filename: 'server.js',
    language: 'javascript',
    scenario: 'When an unhandled database timeout occurs in an Express route, the server hangs indefinitely without responding to the client because the error handling middleware omits the 4th parameter or fails to call next(err).',
    errorLog: 'HTTP 504 Gateway Timeout: Client connection aborted after 30000ms.\n    No response returned from POST /api/roadmaps/enroll',
    initialCode: `// Buggy Express error middleware: Missing 4th parameter (err, req, res, next)
const express = require('express');
const app = express();

app.get('/api/candidate/:id', async (req, res, next) => {
  try {
    const candidate = await db.find(req.params.id);
    if (!candidate) throw new Error('Candidate not found');
    res.json(candidate);
  } catch (err) {
    // BUG: If error handling middleware signature is wrong, this hangs!
    next(err);
  }
});

// BUG: Express only treats middleware as an error handler if it has EXACTLY 4 arguments!
app.use((req, res, next) => {
  console.error("Error occurred");
  res.status(500).json({ error: "Internal Server Error" });
});`,
    canonicalSolution: `// Verified fix: Express error handlers must have all 4 arguments (err, req, res, next)
const express = require('express');
const app = express();

app.get('/api/candidate/:id', async (req, res, next) => {
  try {
    const candidate = await db.find(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    return res.json(candidate);
  } catch (err) {
    next(err);
  }
});

// Correct Express error handler signature with exactly 4 parameters
app.use((err, req, res, next) => {
  console.error('Handled server error:', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});`,
    hints: [
      'Express differentiates error-handling middleware from standard middleware strictly by checking function.length === 4.',
      'The signature must be (err, req, res, next) even if next is not explicitly called.',
      'Remember to send an appropriate HTTP status code and response payload.'
    ],
    testCases: [
      {
        description: 'Should define error middleware with 4 parameters (err, req, res, next)',
        testFn: `(code) => {
          return code.includes('(err, req, res, next)') || code.includes('(err,req,res,next)');
        }`
      }
    ]
  },
  {
    id: 'js-async-array-foreach-await',
    title: 'Fix Asynchronous Race Condition in Array Loop',
    category: 'JavaScript / Node.js',
    difficulty: 'Hard',
    targetSkill: 'JavaScript',
    filename: 'batchPipeline.js',
    language: 'javascript',
    scenario: 'A batch assessment score calculator uses Array.prototype.forEach with an async callback. Because forEach does not await promises, the function returns an empty response before any database records are written.',
    errorLog: 'Race Condition Alert: HTTP 200 returned with 0 saved scores, followed 400ms later by asynchronous writes out-of-order.\n    at saveAllScores (batchService.js:22)',
    initialCode: `// Buggy implementation: forEach does NOT wait for async callbacks
async function saveCandidateScores(scoreEntries, dbClient) {
  const savedIds = [];

  // BUG: forEach executes callbacks synchronously without awaiting the returned promises!
  scoreEntries.forEach(async (entry) => {
    const result = await dbClient.insert(entry);
    savedIds.push(result.id);
  });

  // BUG: Returns immediately with empty savedIds before any await finishes
  return savedIds;
}`,
    canonicalSolution: `// Verified fix: Use Promise.all with map, or a standard for...of loop
async function saveCandidateScores(scoreEntries, dbClient) {
  if (!Array.isArray(scoreEntries) || scoreEntries.length === 0) {
    return [];
  }

  // Solution A: Promise.all with map for concurrent execution
  const promises = scoreEntries.map(entry => dbClient.insert(entry));
  const results = await Promise.all(promises);
  return results.map(r => r.id);

  /* Alternative Solution B (Sequential):
  const savedIds = [];
  for (const entry of scoreEntries) {
    const result = await dbClient.insert(entry);
    savedIds.push(result.id);
  }
  return savedIds;
  */
}`,
    hints: [
      'Array.prototype.forEach ignores the promise returned by async callbacks.',
      'To run operations concurrently and await completion, use Promise.all(scoreEntries.map(async ...)).',
      'Alternatively, use a modern for...of loop if operations need to be strictly sequential.'
    ],
    testCases: [
      {
        description: 'Should use Promise.all(items.map(...)) or for...of loop instead of forEach',
        testFn: `(code) => {
          return (code.includes('Promise.all') && code.includes('.map')) || (code.includes('for (') && code.includes(' of ') && code.includes('await'));
        }`
      }
    ]
  },
  {
    id: 'node-jwt-auth-header-strip',
    title: 'Handle Malformed Authorization Header in Auth Middleware',
    category: 'Web Security / Express',
    difficulty: 'Medium',
    targetSkill: 'Security',
    filename: 'authMiddleware.js',
    language: 'javascript',
    scenario: 'An authentication middleware crashes with TypeError: Cannot read properties of undefined (reading split) when a bot sends an empty or malformed Authorization header without the Bearer scheme.',
    errorLog: 'TypeError: Cannot read properties of undefined (reading \'split\')\n    at authMiddleware (auth.js:9:32)\n    at Layer.handle [as handle_request] (express/lib/router/layer.js:95:5)',
    initialCode: `// Buggy Auth Header Parser
function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;

  // BUG: Crashes if authHeader is undefined, null, or not formatted as "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.token = token;
  next();
}`,
    canonicalSolution: `// Verified fix: Safe header extraction with null checks and prefix validation
function authenticateRequest(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({ error: 'Malformed token: Expected Bearer <token>' });
  }

  req.token = parts[1];
  next();
}`,
    hints: [
      'Always verify that req.headers.authorization exists and is a string before calling .split().',
      'Check that the header starts with "Bearer " and has exactly 2 parts.',
      'Return HTTP 401 Unauthorized instead of throwing an unhandled TypeError.'
    ],
    testCases: [
      {
        description: 'Should safely handle missing or non-Bearer headers with 401 response',
        testFn: `(code) => {
          return (code.includes('!authHeader') || code.includes('authHeader?.')) && (code.includes('Bearer') || code.includes('bearer'));
        }`
      }
    ]
  },
  {
    id: 'sql-injection-raw-concat',
    title: 'Remediate SQL Injection Vulnerability in Search Filter',
    category: 'SQL / Databases',
    difficulty: 'Medium',
    targetSkill: 'SQL',
    filename: 'searchFilter.sql',
    language: 'sql',
    scenario: 'A student search endpoint interpolates user query strings directly into an SQL statement. A malicious input \' OR 1=1 -- bypasses college filters and dumps student personal contact data.',
    errorLog: 'Security Incident: SQL Injection telemetry alert triggered on /api/students/search query parameter.',
    initialCode: `-- Buggy raw query concatenation
-- In Node backend: const query = "SELECT id, name, gpa FROM students WHERE branch = '" + userBranch + "' AND college = '" + userCollege + "'";
SELECT 
    id, name, email, gpa 
FROM 
    students 
-- BUG: Vulnerable to direct string injection when userBranch = "' OR '1'='1"
WHERE 
    branch = '$userBranch' AND college = '$userCollege';`,
    canonicalSolution: `-- Verified Fix: Use parameterized query placeholders ($1, $2 or :branch, :college)
SELECT 
    id, name, email, gpa 
FROM 
    students 
-- Secure parameterized query: values are treated strictly as data literals
WHERE 
    branch = $1 AND college = $2;`,
    hints: [
      'Never concatenate raw user input strings directly into SQL statements.',
      'Use parameterized queries ($1, $2 in PostgreSQL, or ? in MySQL) so the database driver separates SQL command logic from input data.',
      'This completely defangs SQL injection attempts.'
    ],
    testCases: [
      {
        description: 'Should use parameterized placeholders ($1, $2 or ?) instead of string interpolation',
        testFn: `(code) => {
          return code.includes('$1') || code.includes('?') || code.includes(':branch');
        }`
      }
    ]
  }
];

module.exports = {
  CODE_BUG_CHALLENGES
};
