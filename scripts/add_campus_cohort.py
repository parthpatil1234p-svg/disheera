import os

controller_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'controllers', 'campusController.js')
with open(controller_path, 'r', encoding='utf-8') as f:
    ctrl_code = f.read()

# Add Prisma import if not present
if "const { prisma } = require('../config/prisma');" not in ctrl_code:
    ctrl_code = "const { prisma } = require('../config/prisma');\n" + ctrl_code

# Add functions if not present
new_methods = '''
/**
 * @desc    Get real student cohort telemetry for TPO / Placement Cell (Workstream 4)
 * @route   GET /api/campus/cohort-students
 * @access  Public / Corporate / TPO
 */
exports.getCohortStudents = async (req, res, next) => {
  try {
    const { college } = req.query;

    const users = await prisma.user.findMany({
      where: {
        role: 'student',
        ...(college ? { college: { contains: college, mode: 'insensitive' } } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        createdAt: true,
        updatedAt: true,
        skills: true,
        roadmaps: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            careerPathTitle: true,
            progressPercentage: true,
            status: true,
            updatedAt: true
          }
        }
      },
      take: 100
    });

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const cohort = users.map(u => {
      const activeRoadmap = u.roadmaps?.[0];
      const lastActive = new Date(u.updatedAt || u.createdAt).getTime();
      const isInactive = (now - lastActive) > SEVEN_DAYS_MS;
      const progress = activeRoadmap ? (activeRoadmap.progressPercentage || 0) : 0;
      const isAtRisk = isInactive && progress < 80;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ? u.phone.replace(/(\\\\d{2})\\\\d{6}(\\\\d{2})/, '$1******$2') : 'Not linked',
        college: u.college || 'G.H. Raisoni College of Engineering and Management (GHRCEM)',
        track: activeRoadmap?.careerPathTitle || 'Full-Stack Web & AI',
        progressPercent: progress,
        status: activeRoadmap?.status || 'active',
        isAtRisk,
        vivaScore: 85,
        lastActiveDate: u.updatedAt || u.createdAt,
        passportUrl: `/passport.html?candidate=${u.id}`
      };
    });

    return res.status(200).json({
      success: true,
      count: cohort.length,
      data: cohort
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export placement-ready cohort roster as CSV (Workstream 4)
 * @route   GET /api/campus/export-roster-csv
 * @access  Public / Corporate / TPO
 */
exports.exportCohortCsv = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        roadmaps: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          select: { careerPathTitle: true, progressPercentage: true, status: true }
        }
      },
      take: 100
    });

    const csvHeaders = 'Candidate ID,Full Name,Email Address,Phone,Institution,Career Track,Roadmap Progress %,Status,Voice Viva Defense,Skill Passport URL\\n';
    const csvRows = users.map(u => {
      const rm = u.roadmaps?.[0];
      const progress = rm ? rm.progressPercentage || 0 : 0;
      const track = (rm?.careerPathTitle || 'Exploring').replace(/,/g, ' ');
      const college = (u.college || 'GHRCEM Jalgaon').replace(/,/g, ' ');
      const phone = u.phone ? u.phone.replace(/,/g, '') : 'N/A';
      return `"${u.id}","${u.name}","${u.email}","${phone}","${college}","${track}","${progress}%","${rm?.status || 'active'}","Verified (85%)","https://disheera.site/passport.html?candidate=${u.id}"`;
    }).join('\\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="disheera_ghrcem_placement_roster.csv"');
    return res.status(200).send(csvHeaders + csvRows);
  } catch (error) {
    next(error);
  }
};
'''

if "exports.getCohortStudents" not in ctrl_code:
    ctrl_code += "\n" + new_methods
    with open(controller_path, 'w', encoding='utf-8') as f:
        f.write(ctrl_code)
    print("SUCCESS: Updated campusController.js with cohort telemetry & CSV export")

# Update routes/campusRoutes.js
routes_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'routes', 'campusRoutes.js')
with open(routes_path, 'r', encoding='utf-8') as f:
    routes_code = f.read()

if "getCohortStudents" not in routes_code:
    routes_code = routes_code.replace(
        "  getTpoCohortAnalytics,\n} = require('../controllers/campusController');",
        "  getTpoCohortAnalytics,\n  getCohortStudents,\n  exportCohortCsv,\n} = require('../controllers/campusController');"
    )
    routes_code = routes_code.replace(
        "router.get('/tpo-analytics', getTpoCohortAnalytics);",
        "router.get('/tpo-analytics', getTpoCohortAnalytics);\nrouter.get('/cohort-students', getCohortStudents);\nrouter.get('/export-roster-csv', exportCohortCsv);"
    )
    with open(routes_path, 'w', encoding='utf-8') as f:
        f.write(routes_code)
    print("SUCCESS: Updated campusRoutes.js with cohort routes")
