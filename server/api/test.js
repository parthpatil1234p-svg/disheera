module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel Serverless Function is working perfectly!',
    timestamp: new Date().toISOString(),
    node: process.version,
  });
};
