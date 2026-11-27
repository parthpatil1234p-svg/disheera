/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Standalone Voice AI Support Microservice Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const voiceService = require('../services/voiceSupportService');

// Public Health Check
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'Disheera Standalone Voice AI Microservice',
      agentName: 'Arya (Disheera Voice Support Guide)',
      status: 'healthy',
      engines: {
        groqLpu: Boolean(process.env.GROQ_API_KEY),
        geminiFallback: Boolean(process.env.GEMINI_API_KEY),
      },
    },
  });
});

// Protected Voice Call Lifecycle
router.post('/session/start', protect, async (req, res) => {
  try {
    const sessionData = voiceService.startSession(req.user);
    res.status(200).json({ success: true, data: sessionData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/interact', protect, async (req, res) => {
  try {
    const { sessionId, audioBase64, textInput, mimeType, phoneUpdate } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required.' });
    }
    const result = await voiceService.processVoiceTurn(sessionId, {
      audioBase64,
      textInput,
      mimeType,
      phoneUpdate,
      user: req.user,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/session/end', protect, async (req, res) => {
  try {
    const { sessionId, audioBase64 } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required.' });
    }
    const result = await voiceService.endSession(sessionId, audioBase64);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/logs', protect, (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const logs = voiceService.getCallLogs({ page, limit, search, status });
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
