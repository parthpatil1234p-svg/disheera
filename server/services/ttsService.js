/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/ttsService.js — High-Fidelity Neural Text-to-Speech Engine
 * 
 * Powered by Microsoft Edge Neural TTS:
 * - Natural human cadence (100% non-robotic)
 * - Energetic Indian mentor voice (hi-IN-MadhurNeural)
 * - Dynamic +22% speaking rate to eliminate sluggishness
 * - Instant in-memory / temp audio synthesis for WhatsApp PTT
 * 
 * Disheera Technologies Inc.
 */

const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_VOICE = process.env.WHATSAPP_TTS_VOICE || 'hi-IN-MadhurNeural';
const DEFAULT_RATE = process.env.WHATSAPP_TTS_RATE || '+22%'; // Crisp, energetic, fast pacing
const DEFAULT_PITCH = process.env.WHATSAPP_TTS_PITCH || '+2Hz';

/**
 * Prepares text for optimal spoken audio clarity.
 * Strips markdown symbols, links, and extracts a crisp 1-2 sentence mentor punchline.
 * 
 * @param {string} rawText - Input text (markdown or plain)
 * @param {number} [maxLength=150] - Max character length for snappy voice memo
 * @returns {string} - Clean spoken text
 */
function cleanTextForSpeech(rawText, maxLength = 150) {
  if (!rawText || typeof rawText !== 'string') return '';

  let clean = rawText
    // Remove markdown links e.g. [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove markdown symbols
    .replace(/[*#_~`>•\-]/g, ' ')
    // Replace multiple spaces or newlines with a single clean space
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract first 1-2 clean sentences that fit within maxLength
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let summary = '';
  for (const s of sentences) {
    if ((summary + ' ' + s).trim().length <= maxLength) {
      summary = (summary + ' ' + s).trim();
    } else {
      break;
    }
  }

  if (!summary || summary.length < 20) {
    summary = clean.slice(0, maxLength).trim();
    if (summary.length >= maxLength) {
      summary = summary.replace(/\s+\S*$/, '') + '...';
    }
  }

  return summary;
}

/**
 * Synthesizes high-energy, natural neural audio for WhatsApp voice notes
 * using 100% in-memory streaming (zero disk I/O latency).
 * 
 * @param {string} text - Text to speak
 * @param {object} [options] - Custom voice options
 * @returns {Promise<{base64?: string, url?: string, buffer?: Buffer, provider: string}>}
 */
async function generateNeuralVoiceNote(text, options = {}) {
  const spokenText = cleanTextForSpeech(text, options.maxLength || 150);
  if (!spokenText) {
    throw new Error('Empty text provided for speech synthesis');
  }

  const voice = options.voice || DEFAULT_VOICE;
  const rate = options.rate || DEFAULT_RATE;
  const pitch = options.pitch || DEFAULT_PITCH;

  try {
    const tts = new EdgeTTS({
      voice,
      lang: voice.startsWith('hi-') ? 'hi-IN' : 'en-IN',
      rate,
      pitch,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeout: 6000
    });

    // 100% In-Memory Streaming — Zero Disk I/O Overhead
    const chunks = [];
    for await (const chunk of tts.streamAudio(spokenText)) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }
    }

    if (chunks.length === 0) {
      throw new Error('EdgeTTS stream yielded 0 audio chunks');
    }

    const buffer = Buffer.concat(chunks);
    const base64 = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    console.log(`[Neural TTS] In-Memory Audio: ${buffer.length} bytes synthesized via ${voice} at ${rate}`);
    return {
      base64,
      buffer,
      spokenText,
      provider: 'edge_neural_tts'
    };
  } catch (edgeErr) {
    console.warn('[Neural TTS] EdgeTTS stream failed, falling back to Google TTS:', edgeErr.message);
    
    // Fast Fallback: Google Translate TTS audio URL
    const shortChunk = spokenText.slice(0, 190);
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortChunk)}&tl=hi&client=tw-ob`;
    return {
      url: fallbackUrl,
      spokenText: shortChunk,
      provider: 'google_tts_fallback'
    };
  }
}

module.exports = {
  cleanTextForSpeech,
  generateNeuralVoiceNote
};
