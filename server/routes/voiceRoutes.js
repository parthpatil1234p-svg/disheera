/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/voiceRoutes.js — Browser Voice AI Support Agent Routes
 * Disheera · Enterprise Backend API
 *
 * Endpoints:
 * - GET  /api/voice/status        Public status & engine readiness check
 * - POST /api/voice/session/start Protected: Authenticate & start voice session
 * - POST /api/voice/interact      Protected: Process voice/text turn with Dual-Engine
 * - POST /api/voice/session/end   Protected: Finalize session, commit CallLog & recording
 * - GET  /api/voice/logs          Protected: Retrieve call history & telemetry
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const voiceSupportService = require('../services/browserVoiceSupportService');

/**
 * @route   GET /api/voice/status
 * @desc    Get engine availability and readiness status
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const hasGroq = Boolean(process.env.GROQ_API_KEY);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);

    return res.status(200).json({
      success: true,
      data: {
        agentName: 'Arya (Disheera Voice Support Guide)',
        mode: 'browser_voice_agent',
        engines: {
          groqLpu: hasGroq,
          geminiFallback: hasGemini,
        },
        ready: hasGroq || hasGemini,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice agent status',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/voice/session/start
 * @desc    Start a new authenticated Voice Support session
 * @access  Protected (Requires careerpath_token)
 */
router.post('/session/start', protect, async (req, res) => {
  try {
    const sessionData = voiceSupportService.startSession(req.user);
    return res.status(200).json({
      success: true,
      message: 'Voice Support session initiated',
      data: sessionData,
    });
  } catch (error) {
    console.error('[VoiceRoute /session/start] Error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to start voice session',
    });
  }
});

/**
 * @route   POST /api/voice/interact
 * @desc    Process a conversation turn (audio or text) and return AI voice reply
 * @access  Protected (Requires careerpath_token)
 */
router.post('/interact', protect, async (req, res) => {
  try {
    const { sessionId, audioBase64, textInput, mimeType, phoneUpdate } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required for voice interaction',
      });
    }

    const result = await voiceSupportService.processVoiceTurn(sessionId, {
      audioBase64,
      textInput,
      mimeType,
      phoneUpdate,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[VoiceRoute /interact] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Voice interaction failed',
    });
  }
});

/**
 * @route   POST /api/voice/session/end
 * @desc    Conclude call, save final recording audio, and commit CallLog
 * @access  Protected (Requires careerpath_token)
 */
router.post('/session/end', protect, async (req, res) => {
  try {
    const { sessionId, audioBase64 } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required to end voice session',
      });
    }

    const result = await voiceSupportService.endSession(sessionId, audioBase64);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[VoiceRoute /session/end] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to terminate voice session',
    });
  }
});

/**
 * @route   GET /api/voice/logs
 * @desc    Get call logs and recordings for Admin Dashboard
 * @access  Protected (Admin / Staff)
 */
router.get('/logs', protect, async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const logsData = await voiceSupportService.getCallLogs({ page, limit, search, status });

    return res.status(200).json({
      success: true,
      data: logsData,
    });
  } catch (error) {
    console.error('[VoiceRoute /logs] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice call logs',
    });
  }
});

module.exports = router;
