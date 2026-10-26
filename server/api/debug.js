module.exports = (req, res) => {
  const results = {};
  const modulesToTest = [
    'express',
    'dotenv',
    'cors',
    'helmet',
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    'nodemailer',
    'socket.io',
    '../config/prisma',
    '../server'
  ];

  for (const mod of modulesToTest) {
    try {
      require(mod);
      results[mod] = 'OK';
    } catch (e) {
      results[mod] = 'FAILED: ' + e.message + ' | stack: ' + (e.stack ? e.stack.split('\n')[1] : '');
    }
  }

  res.status(200).json({
    status: 'debug-complete',
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasAdminJwtSecret: !!process.env.ADMIN_JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      nodeVersion: process.version,
    },
    modules: results,
  });
};
