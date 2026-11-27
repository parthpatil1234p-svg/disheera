/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * voice-support-agent.js — Browser Voice AI Support Agent Client
 * Disheera · Modern Light-Theme Voice Support Interface
 *
 * Capabilities:
 * - Real-time Voice Call session via Web Audio API & MediaRecorder
 * - Strict Login Authentication Check (careerpath_token & careerpath_user)
 * - Dual-Engine Groq LPU (<300ms) with Gemini fallback
 * - Live soundwave / audio visualizer reacting to voice
 * - Automatic ticket creation display & WhatsApp confirmation relay
 * - Disheera Light-Theme styling (#FFFFFF, #F8FAFC, #2563EB)
 */

(function () {
  'use strict';

  // API Base Resolver
  function getApiBase() {
    if (window.CONFIG && window.CONFIG.VOICE_API_BASE_URL) {
      return window.CONFIG.VOICE_API_BASE_URL.replace(/\/+$/, '');
    }
    if (window.CONFIG && window.CONFIG.API_BASE_URL) {
      return window.CONFIG.API_BASE_URL.replace(/\/+$/, '');
    }
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocal ? 'http://localhost:5000/api' : 'https://disheera.site/api';
  }

  // Auth Helpers
  function getAuthToken() {
    return localStorage.getItem('careerpath_token') || localStorage.getItem('token') || '';
  }

  function getAuthUser() {
    try {
      const raw = localStorage.getItem('careerpath_user') || localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Voice Agent State
  const state = {
    sessionId: null,
    isCalling: false,
    isMuted: false,
    audioContext: null,
    analyser: null,
    mediaStream: null,
    mediaRecorder: null,
    recordedChunks: [],
    speechRecognition: null,
    isSpeaking: false,
    visualizerAnimationId: null,
    activeTicketId: null,
  };

  /**
   * Injects CSS styles for Voice Agent and Light Theme Call Modal
   */
  function injectStyles() {
    if (document.getElementById('voice-agent-styles')) return;
    const style = document.createElement('style');
    style.id = 'voice-agent-styles';
    style.textContent = `
      /* Floating Call Trigger Button */
      .voice-call-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1040;
        background: #2563EB;
        color: #FFFFFF;
        border: none;
        border-radius: 9999px;
        padding: 12px 20px;
        font-family: inherit;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 25px -4px rgba(37, 99, 235, 0.4);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .voice-call-fab:hover {
        background: #1D4ED8;
        transform: translateY(-2px);
        box-shadow: 0 14px 28px -4px rgba(37, 99, 235, 0.45);
      }
      .voice-call-fab .pulse-dot {
        width: 10px;
        height: 10px;
        background: #10B981;
        border-radius: 50%;
        display: inline-block;
        animation: fabPulse 1.8s infinite;
      }
      @keyframes fabPulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      /* Voice Call Overlay & Modal Sheet */
      .voice-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .voice-modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      .voice-modal-sheet {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 20px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.95);
        transition: transform 0.25s ease;
      }
      .voice-modal-overlay.active .voice-modal-sheet {
        transform: scale(1);
      }
      .voice-sheet-header {
        background: #F8FAFC;
        border-bottom: 1px solid #E2E8F0;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .voice-sheet-title {
        font-size: 16px;
        font-weight: 700;
        color: #0F172A;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .voice-sheet-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .voice-orb-container {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }
      .voice-orb {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: radial-gradient(circle, #2563EB 0%, #3B82F6 60%, #93C5FD 100%);
        box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 32px;
        transition: transform 0.1s ease;
      }
      .voice-orb.speaking {
        animation: orbTalk 1.2s infinite ease-in-out;
      }
      @keyframes orbTalk {
        0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(37, 99, 235, 0.4); }
        50% { transform: scale(1.15); box-shadow: 0 0 35px rgba(37, 99, 235, 0.7); }
      }
      .voice-status-text {
        font-size: 14px;
        font-weight: 600;
        color: #2563EB;
        margin-bottom: 4px;
      }
      .voice-substatus-text {
        font-size: 12px;
        color: #64748B;
        margin-bottom: 16px;
      }
      .voice-canvas-box {
        width: 100%;
        height: 50px;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        margin-bottom: 16px;
        overflow: hidden;
      }
      .voice-transcript-box {
        width: 100%;
        height: 140px;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 12px;
        text-align: left;
        font-size: 13px;
        color: #334155;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }
      .voice-bubble {
        padding: 8px 12px;
        border-radius: 10px;
        max-width: 85%;
        line-height: 1.4;
      }
      .voice-bubble.user {
        background: #EFF6FF;
        color: #1E40AF;
        align-self: flex-end;
        border-bottom-right-radius: 2px;
      }
      .voice-bubble.agent {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        color: #0F172A;
        align-self: flex-start;
        border-bottom-left-radius: 2px;
      }
      .voice-ticket-badge {
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
        color: #065F46;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
        width: 100%;
        display: none;
      }
      .voice-phone-prompt {
        background: #FFFBEB;
        border: 1px solid #FDE68A;
        padding: 10px;
        border-radius: 10px;
        margin-bottom: 12px;
        width: 100%;
        display: none;
      }
      .voice-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        width: 100%;
      }
      .btn-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      .btn-circle-mute {
        background: #F1F5F9;
        color: #475569;
      }
      .btn-circle-mute.active {
        background: #FEE2E2;
        color: #EF4444;
      }
      .btn-circle-end {
        background: #EF4444;
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
      }
      .btn-circle-end:hover {
        background: #DC2626;
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Injects Modal DOM into body
   */
  function injectModalDOM() {
    if (document.getElementById('voiceSupportCallModal')) return;

    const modal = document.createElement('div');
    modal.id = 'voiceSupportCallModal';
    modal.className = 'voice-modal-overlay';
    modal.innerHTML = `
      <div class="voice-modal-sheet">
        <div class="voice-sheet-header">
          <h3 class="voice-sheet-title">
            <i class="bi bi-headset text-primary"></i>
            Arya · Disheera Voice AI Support
          </h3>
          <button type="button" class="btn-close" id="voiceCloseBtn" aria-label="Close"></button>
        </div>
        <div class="voice-sheet-body">
          <div class="voice-orb-container">
            <div class="voice-orb" id="voiceOrb">
              <i class="bi bi-mic-fill" id="voiceOrbIcon"></i>
            </div>
          </div>
          <div class="voice-status-text" id="voiceStatusText">Connecting Call...</div>
          <div class="voice-substatus-text" id="voiceSubstatusText">Powered by Groq LPU &amp; Gemini Dual-Engine</div>

          <!-- Dynamic Wave Visualizer Canvas -->
          <div class="voice-canvas-box">
            <canvas id="voiceVisualizerCanvas" width="400" height="50" style="width: 100%; height: 100%;"></canvas>
          </div>

          <!-- Ticket Notification Banner -->
          <div class="voice-ticket-badge" id="voiceTicketBadge">
            <i class="bi bi-check-circle-fill me-1"></i>
            <span id="voiceTicketText">Support Ticket #CP-TKT-XXXXXX Registered</span>
          </div>

          <!-- Missing Phone Prompt (if needed for ticket) -->
          <div class="voice-phone-prompt" id="voicePhonePrompt">
            <div class="small fw-semibold text-dark mb-1">Enter WhatsApp Mobile Number for Ticket:</div>
            <div class="d-flex gap-2">
              <input type="tel" id="voicePhoneInput" class="form-control form-control-sm" placeholder="10-digit number" maxlength="10" />
              <button class="btn btn-primary btn-sm px-3" id="voicePhoneSubmitBtn">Submit</button>
            </div>
          </div>

          <!-- Transcript Live Feed -->
          <div class="voice-transcript-box" id="voiceTranscriptBox">
            <div class="voice-bubble agent">Namaste! Connecting with Arya...</div>
          </div>

          <!-- Controls -->
          <div class="voice-controls">
            <button class="btn-circle btn-circle-mute" id="voiceMuteBtn" title="Mute Microphone">
              <i class="bi bi-mic-fill" id="voiceMuteIcon"></i>
            </button>
            <button class="btn-circle btn-circle-end" id="voiceEndBtn" title="End Call">
              <i class="bi bi-telephone-x-fill"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Bind Close & End
    document.getElementById('voiceCloseBtn').addEventListener('click', endCall);
    document.getElementById('voiceEndBtn').addEventListener('click', endCall);
    document.getElementById('voiceMuteBtn').addEventListener('click', toggleMute);
    document.getElementById('voicePhoneSubmitBtn').addEventListener('click', submitPhoneNumber);
  }

  /**
   * Floating Call Action Button
   */
  function injectFloatingButton() {
    if (document.getElementById('voiceCallFab')) return;

    const fab = document.createElement('button');
    fab.id = 'voiceCallFab';
    fab.className = 'voice-call-fab';
    fab.innerHTML = `
      <span class="pulse-dot"></span>
      <i class="bi bi-headset"></i>
      <span>Voice Support</span>
    `;
    fab.addEventListener('click', startCall);
    document.body.appendChild(fab);
  }

  /**
   * Prompts non-logged in user with a Light Theme sign-in alert
   */
  function promptLoginRequired() {
    const existing = document.getElementById('voiceAuthAlertModal');
    if (existing) existing.remove();

    const alertModal = document.createElement('div');
    alertModal.id = 'voiceAuthAlertModal';
    alertModal.className = 'voice-modal-overlay active';
    alertModal.innerHTML = `
      <div class="voice-modal-sheet p-4 text-center">
        <div class="mb-3">
          <div style="width: 56px; height: 56px; border-radius: 16px; background: #EFF6FF; color: #2563EB; display: inline-flex; align-items: center; justify-content: center; font-size: 26px;">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
        </div>
        <h4 class="h5 fw-bold text-dark mb-2">Login Required for Voice Support</h4>
        <p class="small text-muted mb-4">
          Disheera Voice AI Support is exclusively available to authenticated students to link your account, roadmaps, and priority grievance tickets.
        </p>
        <div class="d-flex gap-2 justify-content-center">
          <a href="login.html" class="btn btn-primary btn-sm px-4 fw-semibold">
            <i class="bi bi-box-arrow-in-right me-1"></i>Sign In Now
          </a>
          <button class="btn btn-outline-secondary btn-sm px-3" id="voiceAuthCancelBtn">
            Cancel
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(alertModal);
    document.getElementById('voiceAuthCancelBtn').addEventListener('click', () => alertModal.remove());
  }

  /**
   * Starts a Voice Support Call Session
   */
  async function startCall() {
    const token = getAuthToken();
    const user = getAuthUser();

    if (!token || !user) {
      promptLoginRequired();
      return;
    }

    const modal = document.getElementById('voiceSupportCallModal');
    modal.classList.add('active');
    updateStatus('Initializing Voice Connection...', 'Authenticating student profile...');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/voice/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to start voice session');
      }

      state.sessionId = data.data.sessionId;
      state.isCalling = true;
      state.activeTicketId = null;

      // Render greeting in transcript
      renderTranscript(data.data.greeting, 'agent');
      speakText(data.data.greeting);

      // Start Microphone & Audio Analyzer
      await initMicrophone();
      initSpeechRecognition();

      updateStatus('Arya Listening...', 'Speak naturally about your roadmap, assignments, or doubt.');
    } catch (err) {
      console.error('[VoiceSupport] Session start failed:', err);
      updateStatus('Connection Failed', err.message);
      setTimeout(endCall, 3500);
    }
  }

  /**
   * Inits Microhone and Web Audio Visualizer
   */
  async function initMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaStream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        state.audioContext = new AudioCtx();
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 64;
        const source = state.audioContext.createMediaStreamSource(stream);
        source.connect(state.analyser);
        startVisualizer();
      }

      // Setup MediaRecorder for whole-call recording
      state.recordedChunks = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      state.mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.recordedChunks.push(e.data);
      };
      state.mediaRecorder.start(1000);
    } catch (micErr) {
      console.warn('[VoiceSupport] Mic permission denied or unavailable:', micErr.message);
      updateStatus('Mic Inactive (Text Mode)', 'Microphone access was denied. You can still type queries.');
    }
  }

  /**
   * Animates soundwave on canvas
   */
  function startVisualizer() {
    const canvas = document.getElementById('voiceVisualizerCanvas');
    if (!canvas || !state.analyser) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!state.isCalling) return;
      state.visualizerAnimationId = requestAnimationFrame(draw);
      state.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = state.isSpeaking ? '#2563EB' : '#10B981';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    draw();
  }

  /**
   * Inits Web Speech Recognition for Real-Time Utterance Detection
   */
  function initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.log('[VoiceSupport] Web Speech Recognition not supported in this browser, relying on Whisper STT.');
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = async (event) => {
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript.trim();

      if (transcript && state.isCalling && !state.isSpeaking) {
        renderTranscript(transcript, 'user');
        updateStatus('Arya Thinking...', 'Analyzing Disheera knowledge base via Groq...');
        await sendTurnToBackend(transcript);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('[VoiceSupport] Speech recognition error:', e.error);
      }
    };

    try {
      recognition.start();
      state.speechRecognition = recognition;
    } catch (_) {}
  }

  /**
   * Sends conversation turn to backend
   */
  async function sendTurnToBackend(textQuery, phoneUpdate = null) {
    if (!state.sessionId) return;
    const token = getAuthToken();

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/voice/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          textInput: textQuery,
          phoneUpdate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error processing response');
      }

      const { replyText, ticketId, needsPhonePrompt } = data.data;

      // Handle in-call ticket prompt
      if (needsPhonePrompt) {
        document.getElementById('voicePhonePrompt').style.display = 'block';
      } else {
        document.getElementById('voicePhonePrompt').style.display = 'none';
      }

      // Handle ticket generation badge
      if (ticketId) {
        state.activeTicketId = ticketId;
        const ticketBadge = document.getElementById('voiceTicketBadge');
        document.getElementById('voiceTicketText').textContent = `Support Ticket #${ticketId} Registered (WhatsApp Dispatched)`;
        ticketBadge.style.display = 'block';
      }

      renderTranscript(replyText, 'agent');
      speakText(replyText);
      updateStatus('Arya Listening...', 'Speak your query or question.');
    } catch (err) {
      console.error('[VoiceSupport] Turn processing error:', err);
      updateStatus('Arya Error', err.message);
    }
  }

  /**
   * Submits phone number entered in modal
   */
  function submitPhoneNumber() {
    const input = document.getElementById('voicePhoneInput');
    const val = (input.value || '').trim();
    if (val.length < 10) {
      alert('Please enter a valid 10-digit Indian WhatsApp number.');
      return;
    }
    document.getElementById('voicePhonePrompt').style.display = 'none';
    renderTranscript(`My mobile number is +91 ${val}`, 'user');
    sendTurnToBackend('Please register my ticket with this mobile number', val);
  }

  /**
   * Speaks text using browser SpeechSynthesis
   */
  function speakText(text) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.05;

    // Pick Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang === 'en-IN' || v.name.includes('India'));
    if (preferredVoice) utterance.voice = preferredVoice;

    const orb = document.getElementById('voiceOrb');
    utterance.onstart = () => {
      state.isSpeaking = true;
      if (orb) orb.classList.add('speaking');
    };
    utterance.onend = () => {
      state.isSpeaking = false;
      if (orb) orb.classList.remove('speaking');
    };
    utterance.onerror = () => {
      state.isSpeaking = false;
      if (orb) orb.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Renders a transcript bubble in the modal
   */
  function renderTranscript(text, speaker) {
    const box = document.getElementById('voiceTranscriptBox');
    if (!box) return;

    const bubble = document.createElement('div');
    bubble.className = `voice-bubble ${speaker}`;
    bubble.textContent = text;
    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  }

  /**
   * Toggles microphone mute
   */
  function toggleMute() {
    if (!state.mediaStream) return;
    state.isMuted = !state.isMuted;
    state.mediaStream.getAudioTracks().forEach((track) => {
      track.enabled = !state.isMuted;
    });

    const muteBtn = document.getElementById('voiceMuteBtn');
    const muteIcon = document.getElementById('voiceMuteIcon');
    if (state.isMuted) {
      muteBtn.classList.add('active');
      muteIcon.className = 'bi bi-mic-mute-fill';
      updateStatus('Microphone Muted', 'Click mic icon to resume speaking.');
    } else {
      muteBtn.classList.remove('active');
      muteIcon.className = 'bi bi-mic-fill';
      updateStatus('Arya Listening...', 'Speak your query or question.');
    }
  }

  /**
   * Ends call session and commits CallLog
   */
  async function endCall() {
    if (!state.isCalling) {
      const modal = document.getElementById('voiceSupportCallModal');
      if (modal) modal.classList.remove('active');
      return;
    }

    state.isCalling = false;
    updateStatus('Concluded', 'Saving call recording and logs...');

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (state.speechRecognition) {
      try { state.speechRecognition.stop(); } catch (_) {}
    }
    if (state.visualizerAnimationId) cancelAnimationFrame(state.visualizerAnimationId);

    // Stop MediaRecorder and collect audio
    let audioBase64 = null;
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      try {
        state.mediaRecorder.stop();
        if (state.recordedChunks.length > 0) {
          const blob = new Blob(state.recordedChunks, { type: 'audio/webm' });
          audioBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (recErr) {
        console.warn('[VoiceSupport] Error finalising audio recording blob:', recErr.message);
      }
    }

    // Stop tracks
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach((t) => t.stop());
    }

    // Call End API
    try {
      const token = getAuthToken();
      const apiBase = getApiBase();
      if (state.sessionId && token) {
        await fetch(`${apiBase}/voice/session/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: state.sessionId,
            audioBase64,
          }),
        });
      }
    } catch (endErr) {
      console.warn('[VoiceSupport] Session end API sync warning:', endErr.message);
    }

    // Reset state & close modal
    state.sessionId = null;
    const modal = document.getElementById('voiceSupportCallModal');
    if (modal) modal.classList.remove('active');
  }

  function updateStatus(title, subtitle) {
    const t = document.getElementById('voiceStatusText');
    const s = document.getElementById('voiceSubstatusText');
    if (t) t.textContent = title;
    if (s) s.textContent = subtitle || '';
  }

  // Public Interface
  window.DisheeraVoiceAgent = {
    startCall,
    endCall,
    toggleMute,
  };

  // Auto-Initialize on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    injectModalDOM();
    injectFloatingButton();

    // Attach to any page buttons with data-voice-call attribute
    document.querySelectorAll('[data-voice-call="true"], #startBrowserVoiceCallBtn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startCall();
      });
    });
  });
})();
