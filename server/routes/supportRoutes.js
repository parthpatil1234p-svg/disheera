/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/supportRoutes.js  -  Official Support & Grievance Redressal Endpoints
 * 
 * Mounted at: /api/support (in server.js)
 * 
 * Endpoints:
 *   POST /api/support/ticket            → Register new support ticket
 *   GET  /api/support/officer           → Official Grievance Officer details
 *   GET  /api/support/ticket/:ticketId  → Look up ticket status
 * 
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const {
  createTicket,
  getGrievanceDetails,
  getTicketStatus
} = require('../controllers/supportController');

router.post('/ticket', createTicket);
router.get('/officer', getGrievanceDetails);
router.get('/ticket/:ticketId', getTicketStatus);

module.exports = router;
