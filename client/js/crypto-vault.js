/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * crypto-vault.js — Client-Side Encrypted Storage with Minimal-Exposure LLM Calls
 *
 * Implements Layer 2 (Client-Side Encryption) and Layer 3 (Minimal-Exposure LLM Hop)
 * Architecture:
 *   - Native Web Crypto API (AES-GCM 256-bit)
 *   - PBKDF2 Key Derivation (SHA-256, 100,000 iterations, 16-byte random salt)
 *   - 12-byte IV (96-bit AES-GCM nonce)
 *   - PII Sanitization for transient LLM calls (Zero-PII hop)
 *
 * Works in both Modern Browser (window.crypto) and Node.js (globalThis.crypto / require('crypto').webcrypto)
 *
 * Disheera · Enterprise Platform
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser
    root.CryptoVault = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Obtain Web Crypto object
  function getSubtleCrypto() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      return { crypto: globalThis.crypto, subtle: globalThis.crypto.subtle };
    }
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      return { crypto: window.crypto, subtle: window.crypto.subtle };
    }
    if (typeof require === 'function') {
      try {
        const nodeCrypto = require('crypto');
        if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
          return { crypto: nodeCrypto.webcrypto, subtle: nodeCrypto.webcrypto.subtle };
        }
      } catch (_) {}
    }
    throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
  }

  // Text encoder / decoder
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : {
    encode: (str) => Buffer.from(str, 'utf-8')
  };
  const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : {
    decode: (buf) => Buffer.from(buf).toString('utf-8')
  };

  // Base64 encode Uint8Array / ArrayBuffer safely
  function arrayBufferToBase64(buffer) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(buffer).toString('base64');
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Base64 decode string to Uint8Array safely
  function base64ToUint8Array(base64Str) {
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64Str, 'base64');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    const binary = atob(base64Str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const PBKDF2_ITERATIONS = 100000;
  const SALT_BYTE_LENGTH = 16;
  const IV_BYTE_LENGTH = 12; // 96-bit recommended for AES-GCM

  const CryptoVault = {
    /**
     * Derive a 256-bit AES-GCM CryptoKey using PBKDF2 with SHA-256 (100k rounds)
     * @param {string} password - User passphrase or derived password
     * @param {Uint8Array} salt - 16-byte random salt
     * @returns {Promise<CryptoKey>}
     */
    async deriveKey(password, salt) {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }
      if (!salt || !(salt instanceof Uint8Array)) {
        throw new Error('Salt must be a Uint8Array');
      }

      const { subtle } = getSubtleCrypto();
      const passwordBytes = encoder.encode(password);

      const baseKey = await subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const derivedKey = await subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        baseKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );

      return derivedKey;
    },

    /**
     * Client-side AES-GCM 256-bit encryption
     * @param {string|Object} payload - Data to encrypt
     * @param {string} password - Secret passphrase
     * @param {string|Uint8Array} [existingSalt] - Optional salt (Uint8Array or base64)
     * @returns {Promise<{ ciphertext: string, iv: string, salt: string, version: string, algorithm: string, iterations: number }>}
     */
    async encrypt(payload, password, existingSalt = null) {
      const { crypto, subtle } = getSubtleCrypto();

      // Normalize payload to JSON string
      const plaintext = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const plaintextBytes = encoder.encode(plaintext);

      // Salt generation or parsing
      let saltBytes;
      if (existingSalt) {
        saltBytes = typeof existingSalt === 'string' ? base64ToUint8Array(existingSalt) : existingSalt;
      } else {
        saltBytes = new Uint8Array(SALT_BYTE_LENGTH);
        crypto.getRandomValues(saltBytes);
      }

      // Generate random 12-byte IV for AES-GCM
      const ivBytes = new Uint8Array(IV_BYTE_LENGTH);
      crypto.getRandomValues(ivBytes);

      // Derive key
      const key = await this.deriveKey(password, saltBytes);

      // Encrypt with AES-GCM
      const cipherBuffer = await subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes
        },
        key,
        plaintextBytes
      );

      return {
        ciphertext: arrayBufferToBase64(cipherBuffer),
        iv: arrayBufferToBase64(ivBytes),
        salt: arrayBufferToBase64(saltBytes),
        version: 'AES-GCM-256',
        algorithm: 'AES-GCM',
        iterations: PBKDF2_ITERATIONS,
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Client-side AES-GCM 256-bit decryption
     * @param {Object} encryptedData - Object with { ciphertext, iv, salt }
     * @param {string} password - Secret passphrase
     * @returns {Promise<any>} Parsed JSON or string
     */
    async decrypt(encryptedData, password) {
      if (!encryptedData || !encryptedData.ciphertext || !encryptedData.iv || !encryptedData.salt) {
        throw new Error('Encrypted payload missing ciphertext, iv, or salt');
      }

      const { subtle } = getSubtleCrypto();

      const ciphertextBytes = base64ToUint8Array(encryptedData.ciphertext);
      const ivBytes = base64ToUint8Array(encryptedData.iv);
      const saltBytes = base64ToUint8Array(encryptedData.salt);

      // Derive key with same salt & password
      const key = await this.deriveKey(password, saltBytes);

      try {
        const decryptedBuffer = await subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBytes
          },
          key,
          ciphertextBytes
        );

        const decryptedText = decoder.decode(decryptedBuffer);
        try {
          return JSON.parse(decryptedText);
        } catch (_) {
          return decryptedText;
        }
      } catch (err) {
        const decErr = new Error('Decryption failed: Invalid password or corrupted payload (tag authentication mismatch)');
        decErr.code = 'DECRYPTION_FAILED';
        throw decErr;
      }
    },

    /**
     * Layer 3: Minimal-Exposure LLM Sanitization
     * Strips identifying student PII before sending to dynamic LLM endpoints (Groq, Gemini).
     * Only transfers anonymous technical attributes: skills, interests, target roles, academic year.
     * @param {Object} rawProfile
     * @returns {Object} Cleaned, zero-PII technical payload
     */
    sanitizeForLLM(rawProfile) {
      if (!rawProfile || typeof rawProfile !== 'object') return {};

      // Whitelist only non-identifying technical criteria
      const sanitized = {};

      // Skills
      if (Array.isArray(rawProfile.skills)) {
        sanitized.skills = rawProfile.skills.map((s) => ({
          name: typeof s === 'string' ? s : s.name,
          proficiency: s.proficiency || s.level || 'intermediate'
        }));
      }

      // Interests
      if (Array.isArray(rawProfile.interests)) {
        sanitized.interests = rawProfile.interests.filter((i) => typeof i === 'string');
      }

      // Academic level (generic course and year, without university or college names)
      if (rawProfile.education && typeof rawProfile.education === 'object') {
        sanitized.academics = {
          degree: rawProfile.education.course || rawProfile.education.degree || 'Undergraduate',
          branch: rawProfile.education.branch || 'Computer Science',
          year: rawProfile.education.year || 'Second Year'
        };
      }

      // Goals & stream
      if (rawProfile.careerGoals) sanitized.careerGoals = rawProfile.careerGoals;
      if (rawProfile.primaryStream) sanitized.primaryStream = rawProfile.primaryStream;
      if (rawProfile.targetRole) sanitized.targetRole = rawProfile.targetRole;

      return sanitized;
    }
  };

  return CryptoVault;
});
