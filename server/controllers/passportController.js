/**
 * passportController.js - Public Skill Passport Endpoints
 * Disheera Technologies Inc.
 */

const { generatePassportData } = require('../services/passportService');

/**
 * GET /api/passport/:id
 * Public endpoint to fetch verified Skill Passport dossier
 */
const getPassportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid student ID or credential reference is required.'
      });
    }

    let passport = await generatePassportData(id.trim());

    if (!passport) {
      return res.status(404).json({
        success: false,
        message: 'Skill Passport not found for the requested candidate ID.'
      });
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.status(200).json({
      success: true,
      data: { passport }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPassportById
};
