/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/leaderboardService.js — Cumulative Merit Score (CMS) & Dynamic Leaderboard Engine (Plan 46)
 *
 * Implements:
 * 1. Weighted Composite CMS Calculation:
 *    CMS = (M_Assignments * 0.40) + (M_Quizzes * 0.30) + (M_Progress * 0.20) + (M_Consistency * 0.10)
 * 2. Dynamic Rank Assignment (1st to Nth) and Top 3 Podium Designation (Gold, Silver, Bronze)
 * 3. Career-Track and Global Leaderboards
 * 4. Partner Tech Internship & Placement Rewards matching
 *
 * Disheera Technologies Inc.
 */

const { prisma } = require('../config/prisma');

// Curated Top Partner Tech Internships & Opportunities
const INITIAL_INTERNSHIP_REWARDS = [
  {
    companyName: 'Razorpay Software',
    roleTitle: 'Full-Stack Engineering Intern',
    location: 'Bengaluru / Remote',
    stipendRange: '₹45,000 / month',
    eligibilityCrest: 'GOLD',
    applyUrl: 'https://razorpay.com/jobs',
    referralContact: 'Disheera Strategic Placement Partner'
  },
  {
    companyName: 'CRED Technologies',
    roleTitle: 'Distributed Systems & Backend Intern',
    location: 'Bengaluru',
    stipendRange: '₹50,000 / month',
    eligibilityCrest: 'GOLD',
    applyUrl: 'https://cred.club/careers',
    referralContact: 'Disheera Direct Executive Referral'
  },
  {
    companyName: 'Postman',
    roleTitle: 'Developer Experience & API Platform Intern',
    location: 'Bengaluru / Hybrid',
    stipendRange: '₹40,000 / month',
    eligibilityCrest: 'SILVER',
    applyUrl: 'https://www.postman.com/company/careers',
    referralContact: 'Fast-Track Technical Assessment'
  },
  {
    companyName: 'Swiggy',
    roleTitle: 'Cloud Infrastructure & DevOps Intern',
    location: 'Bengaluru',
    stipendRange: '₹35,000 / month',
    eligibilityCrest: 'SILVER',
    applyUrl: 'https://careers.swiggy.com',
    referralContact: 'Campus Partner Placement Fast-Track'
  },
  {
    companyName: 'Zerodha',
    roleTitle: 'High-Throughput Fintech & Systems Intern',
    location: 'Bengaluru',
    stipendRange: '₹40,000 / month',
    eligibilityCrest: 'BRONZE',
    applyUrl: 'https://zerodha.com/careers',
    referralContact: 'Open Source Merit Fast-Track'
  },
  {
    companyName: 'Zomato Engineering',
    roleTitle: 'Mobile App & Frontend Architecture Intern',
    location: 'Gurugram / Hybrid',
    stipendRange: '₹30,000 / month',
    eligibilityCrest: 'TOP_10',
    applyUrl: 'https://www.zomato.com/careers',
    referralContact: 'Priority Recruiter Spotlight'
  }
];

/**
 * Seeds initial curated internship rewards if table is empty.
 */
async function seedInternshipRewards() {
  const count = await prisma.internshipReward.count();
  if (count > 0) return;

  for (const reward of INITIAL_INTERNSHIP_REWARDS) {
    await prisma.internshipReward.create({ data: reward });
  }
  console.log('[leaderboardService] Seeded curated topper internship rewards.');
}

/**
 * Computes the Cumulative Merit Score (CMS) for an individual student.
 *
 * @param {string} userId - User ID
 * @returns {Promise<object>} StudentMeritScore record
 */
async function calculateMeritScoreForStudent(userId) {
  // 1. Assignment Marks (40% Weightage) - normalized out of 100
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { userId },
    select: { finalScore: true, aiScore: true, status: true }
  });

  let assignmentMarks = 0;
  if (submissions.length > 0) {
    const validScores = submissions
      .map(s => (s.finalScore != null ? s.finalScore : (s.status === 'GRADED' ? s.aiScore : null)))
      .filter(score => score != null);

    if (validScores.length > 0) {
      const avgOutOf10 = validScores.reduce((sum, val) => sum + val, 0) / validScores.length;
      assignmentMarks = +(Math.min(100, Math.max(0, (avgOutOf10 / 10) * 100))).toFixed(1);
    }
  }

  // 2. Quiz & Milestone Test Scores (30% Weightage)
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    select: { percent: true, passed: true }
  });

  let quizMarks = 0;
  if (attempts.length > 0) {
    const totalPercent = attempts.reduce((acc, a) => acc + (a.percent || 0), 0);
    quizMarks = +(Math.min(100, Math.max(0, totalPercent / attempts.length))).toFixed(1);
  }

  // 3. Roadmap Progress Marks (20% Weightage)
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    select: { progressPercentage: true, status: true }
  });

  let progressMarks = 0;
  if (roadmaps.length > 0) {
    const maxProgress = Math.max(...roadmaps.map(r => r.progressPercentage || 0));
    progressMarks = +(Math.min(100, Math.max(0, maxProgress))).toFixed(1);
  }

  // 4. Consistency Marks (10% Weightage)
  // Combines submission timeliness, task completions, and activity
  let consistencyMarks = 0;
  const completedTaskCount = await prisma.roadmapTask.count({
    where: {
      roadmap: { userId },
      completed: true
    }
  });

  // Base consistency from tasks + bonus per assignment submitted
  const baseTaskConsistency = Math.min(60, completedTaskCount * 5);
  const submissionConsistency = Math.min(40, submissions.length * 10);
  consistencyMarks = +(Math.min(100, baseTaskConsistency + submissionConsistency)).toFixed(1);

  // If student has done no activities yet, give baseline 0
  const totalMeritScore = +(
    (assignmentMarks * 0.40) +
    (quizMarks * 0.30) +
    (progressMarks * 0.20) +
    (consistencyMarks * 0.10)
  ).toFixed(1);

  const meritRecord = await prisma.studentMeritScore.upsert({
    where: { userId },
    update: {
      assignmentMarks,
      quizMarks,
      progressMarks,
      consistencyMarks,
      totalMeritScore,
      lastCalculatedAt: new Date()
    },
    create: {
      userId,
      assignmentMarks,
      quizMarks,
      progressMarks,
      consistencyMarks,
      totalMeritScore
    }
  });

  return meritRecord;
}

/**
 * Recalculates Cumulative Merit Scores for all students and updates national ranks.
 */
async function recalculateGlobalLeaderboard() {
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true }
  });

  for (const student of students) {
    await calculateMeritScoreForStudent(student.id);
  }

  // Fetch all scores sorted descending
  const allScores = await prisma.studentMeritScore.findMany({
    orderBy: { totalMeritScore: 'desc' }
  });

  // Assign ranks and topper badges
  for (let i = 0; i < allScores.length; i++) {
    const rank = i + 1;
    let isTopper = false;
    let topperBadge = null;

    if (rank === 1 && allScores[i].totalMeritScore > 0) {
      isTopper = true;
      topperBadge = 'GOLD';
    } else if (rank === 2 && allScores[i].totalMeritScore > 0) {
      isTopper = true;
      topperBadge = 'SILVER';
    } else if (rank === 3 && allScores[i].totalMeritScore > 0) {
      isTopper = true;
      topperBadge = 'BRONZE';
    } else if (rank <= 10 && allScores[i].totalMeritScore > 0) {
      topperBadge = 'TOP_10';
    }

    await prisma.studentMeritScore.update({
      where: { id: allScores[i].id },
      data: {
        currentRank: rank,
        isTopper,
        topperBadge
      }
    });
  }

  return allScores.length;
}

/**
 * Fetches the ranked leaderboard with Top 3 podium, rankings, current user standings, and rewards.
 *
 * @param {object} params
 * @param {string} [params.careerId] - Optional filter by career
 * @param {string} [params.currentUserId] - Authenticated student ID
 * @param {number} [params.limit] - Limit results (default 50)
 * @returns {Promise<object>}
 */
async function getLeaderboardData({ careerId, currentUserId, limit = 50 } = {}) {
  await seedInternshipRewards();

  // If current user is authenticated, ensure their merit score is updated
  if (currentUserId) {
    await calculateMeritScoreForStudent(currentUserId);
  }

  const where = {};
  if (careerId) {
    where.user = {
      roadmaps: {
        some: { careerId, status: 'active' }
      }
    };
  }

  const scores = await prisma.studentMeritScore.findMany({
    where,
    orderBy: { totalMeritScore: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          education: true,
          primaryStream: true,
          roadmaps: {
            where: { status: 'active' },
            take: 1,
            include: { career: { select: { title: true } } }
          }
        }
      }
    }
  });

  const formattedRankings = scores.map((s, idx) => {
    const rank = idx + 1;
    let badge = s.topperBadge;
    if (rank === 1 && s.totalMeritScore > 0) badge = 'GOLD';
    else if (rank === 2 && s.totalMeritScore > 0) badge = 'SILVER';
    else if (rank === 3 && s.totalMeritScore > 0) badge = 'BRONZE';

    const activeCareer = s.user?.roadmaps?.[0]?.career?.title || 'Full-Stack Developer';
    const college = s.user?.education?.college || s.user?.education?.institution || 'College of Engineering';

    return {
      rank,
      studentId: s.userId,
      studentName: s.user?.name || 'Anonymous Student',
      studentEmail: s.user?.email,
      avatarUrl: s.user?.avatarUrl,
      careerTitle: activeCareer,
      college,
      totalMeritScore: s.totalMeritScore,
      assignmentMarks: s.assignmentMarks,
      quizMarks: s.quizMarks,
      progressMarks: s.progressMarks,
      consistencyMarks: s.consistencyMarks,
      isTopper: rank <= 3 && s.totalMeritScore > 0,
      topperBadge: badge,
      isCurrentUser: currentUserId === s.userId
    };
  });

  // Top 3 Podium
  const top3 = formattedRankings.slice(0, 3);

  // Current User Standing
  let currentUserStanding = null;
  if (currentUserId) {
    const myMatch = formattedRankings.find(r => r.studentId === currentUserId);
    if (myMatch) {
      currentUserStanding = myMatch;
    } else {
      const myScore = await prisma.studentMeritScore.findUnique({
        where: { userId: currentUserId },
        include: { user: true }
      });
      if (myScore) {
        currentUserStanding = {
          rank: myScore.currentRank || 99,
          studentId: currentUserId,
          studentName: myScore.user?.name,
          totalMeritScore: myScore.totalMeritScore,
          topperBadge: myScore.topperBadge,
          isCurrentUser: true
        };
      }
    }
  }

  // Fetch Available Internship Rewards
  const rewards = await prisma.internshipReward.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });

  return {
    success: true,
    totalRanked: formattedRankings.length,
    top3,
    rankings: formattedRankings,
    currentUser: currentUserStanding,
    rewards
  };
}

module.exports = {
  calculateMeritScoreForStudent,
  recalculateGlobalLeaderboard,
  getLeaderboardData,
  seedInternshipRewards
};
