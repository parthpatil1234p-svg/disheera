/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * cloudinary-service.js — Cloudinary Media Storage Helper
 *
 * Provides high-speed, secure uploads for Student Avatars and Resumes.
 * Operates through the authenticated server API (/api/users/avatar and /api/users/resume).
 */

(function () {
  /**
   * Helper: Read a File object as a Base64 Data URI
   * @param {File} file 
   * @returns {Promise<string>}
   */
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload Student Profile Picture (Avatar)
   * Sends image to backend /api/users/avatar which uploads to Cloudinary with face detection & auto-crop.
   * @param {File} file 
   * @param {string} userId 
   * @returns {Promise<string>} Cloudinary secure HTTPS URL
   */
  async function uploadAvatar(file, userId) {
    if (!file) throw new Error('Please select an image file to upload.');

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format. Supported formats: JPG, PNG, WEBP, GIF, SVG.');
    }

    // Validate size (max 8MB)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Image size exceeds 8MB limit. Please choose a smaller photo.');
    }

    const fileData = await readFileAsDataURL(file);

    // Call backend Cloudinary upload endpoint
    const response = await window.API.post(
      '/users/avatar',
      { fileData, userId },
      { auth: true }
    );

    if (response.success && response.data?.avatarUrl) {
      return response.data.avatarUrl;
    }

    throw new Error(response.message || 'Failed to upload photo to Cloudinary.');
  }

  /**
   * Upload Student Resume / CV
   * Sends resume to backend /api/users/resume which stores it securely on Cloudinary.
   * @param {File} file 
   * @param {string} userId 
   * @returns {Promise<string>} Cloudinary secure HTTPS URL
   */
  async function uploadResume(file, userId) {
    if (!file) throw new Error('Please select a resume file to upload.');

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      throw new Error('Invalid resume format. Only PDF, DOC, or DOCX documents are accepted.');
    }

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Resume file size exceeds 10MB limit.');
    }

    const fileData = await readFileAsDataURL(file);

    // Call backend Cloudinary upload endpoint
    const response = await window.API.post(
      '/users/resume',
      { fileData, userId },
      { auth: true }
    );

    if (response.success && response.data?.resumeUrl) {
      return response.data.resumeUrl;
    }

    throw new Error(response.message || 'Failed to upload resume document.');
  }

  /**
   * Generates a high-resolution PNG preview image URL for a resume PDF
   * @param {string} resumeUrl
   * @param {number} page
   * @returns {string}
   */
  function getResumePreviewUrl(resumeUrl, page = 1) {
    if (!resumeUrl || typeof resumeUrl !== 'string') return '';
    return resumeUrl
      .replace(/\/image\/upload\/(?:v\d+\/)?/, (match) => `${match}dn_150,pg_${page},q_auto/v1/`)
      .replace(/\.pdf$/i, '.png');
  }

  /**
   * Generates authenticated proxy view URL for the student's resume
   * @returns {string}
   */
  function getResumeViewUrl() {
    const token = window.Auth?.getToken?.() || localStorage.getItem('token') || '';
    const apiBase = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
    return `${apiBase}/users/resume/view?token=${encodeURIComponent(token)}`;
  }

  const cloudinaryService = {
    uploadAvatar,
    uploadResume,
    readFileAsDataURL,
    getResumePreviewUrl,
    getResumeViewUrl,
  };

  // Expose clean namespace on window
  window.CloudinaryService = cloudinaryService;
  window.MediaService = cloudinaryService;
})();

