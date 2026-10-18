/**
 * adminDashboardController.js — Admin Overview & KPI Aggregation
 *
 * Provides aggregated analytics across students, recruiters, roadmaps,
 * test attempts, and active job postings.
 */

const { prisma } = require('../config/prisma');

/**
 * GET /api/admin/dashboard/stats
 * Aggregated platform metrics and KPIs
 */
async function getDashboardStats(req, res) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      totalRecruiters,
      pendingRecruiters,
      dailySignups,
      weeklySignups,
      activeRoadmaps,
      totalJobOpenings,
      totalAttempts,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'recruiter' } }),
      prisma.user.count({ where: { role: 'recruiter', isVerified: false } }),
      prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.roadmap.count({ where: { status: 'active' } }),
      prisma.jobOpening.count({ where: { status: 'active' } }),
      prisma.attempt.count(),
      prisma.adminAuditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          adminEmail: true,
          action: true,
          targetType: true,
          targetId: true,
          details: true,
          createdAt: true
        }
      })
    ]);

    const mem = process.memoryUsage();

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalRecruiters,
        pendingRecruiters,
        dailySignups,
        weeklySignups,
        activeRoadmaps,
        totalJobOpenings,
        totalAttempts,
      },
      recentActivity: recentAuditLogs,
      systemHealth: {
        status: 'operational',
        databaseEngine: 'Supabase PostgreSQL (Prisma ORM)',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('[AdminDashboardController.getDashboardStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative dashboard metrics.'
    });
  }
}

module.exports = {
  getDashboardStats
};
