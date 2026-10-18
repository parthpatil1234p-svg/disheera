/**
 * services/cloudinaryService.js — Cloudinary Media Storage Service
 *
 * Provides optimized cloud asset management for student profile photos and resumes.
 * Uses authenticated signed uploads with automatic face-detection cropping.
 */

const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('⚠️  [WARN] Cloudinary credentials missing from environment. Media upload features are disabled.');
}

/**
 * Upload an image (avatar) to Cloudinary with automatic face-focus square cropping.
 * @param {string} fileData - Base64 Data URI (data:image/...) or remote URL
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadAvatar = async (fileData, userId) => {
  if (!isCloudinaryConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('Cloudinary media storage service is not configured in production environment.');
      err.statusCode = 503;
      err.code = 'STORAGE_SERVICE_UNAVAILABLE';
      throw err;
    }
    console.warn('[cloudinaryService] Cloudinary not configured. Operating in resilient simulated asset mode.');
    return {
      secure_url: `https://res.cloudinary.com/demo/image/upload/disheera/avatars/avatar_${userId || 'user'}_${Date.now()}.jpg`,
      public_id: `disheera/avatars/avatar_${userId || 'user'}_${Date.now()}`,
    };
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileData,
      {
        folder: 'disheera/avatars',
        public_id: `avatar_${userId || 'user'}_${Date.now()}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

const AdmZip = require('adm-zip');

/**
 * Extracts Cloudinary public_id from a full Cloudinary URL
 * @param {string} url - Full Cloudinary asset URL
 * @returns {string|null} public_id
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
};

/**
 * Generates a high-resolution PNG preview URL for a PDF resume (page 1)
 * Cloudinary can always deliver rendered image representations of PDFs (200 OK)
 * @param {string} publicIdOrUrl - Cloudinary publicId or URL
 * @param {number} [page=1] - Page number to render
 * @returns {string} High-res preview image URL
 */
const getResumePreviewUrl = (publicIdOrUrl, page = 1) => {
  const publicId = getPublicIdFromUrl(publicIdOrUrl) || publicIdOrUrl;
  if (!publicId) return null;
  return cloudinary.url(`${publicId}.png`, {
    page,
    secure: true,
    resource_type: 'image',
    quality: 'auto',
    density: 150,
  });
};

/**
 * Downloads and extracts the original uncompressed PDF buffer from Cloudinary archive.
 * Bypasses Cloudinary's default account-level PDF delivery ACL restrictions.
 * @param {string} publicIdOrUrl - Cloudinary publicId or URL
 * @returns {Promise<{ filename: string, data: Buffer, size: number }>}
 */
const downloadResumeBuffer = async (publicIdOrUrl) => {
  if (!isCloudinaryConfigured()) {
    const err = new Error('Cloudinary media storage service is not configured on this server.');
    err.statusCode = 503;
    err.code = 'STORAGE_SERVICE_UNAVAILABLE';
    throw err;
  }
  const publicId = getPublicIdFromUrl(publicIdOrUrl) || publicIdOrUrl;
  if (!publicId) throw new Error('Invalid resume identifier or URL');

  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids: [publicId],
    resource_type: 'image',
    target_format: 'zip',
  });

  const res = await fetch(zipUrl);
  if (!res.ok) {
    throw new Error(`Cloudinary archive fetch failed with status ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  if (!entries || entries.length === 0) {
    throw new Error('No document files found in Cloudinary resume archive');
  }

  const fileEntry = entries[0];
  return {
    filename: fileEntry.name.split('/').pop() || 'Student_Resume.pdf',
    data: fileEntry.getData(),
    size: fileEntry.header.size,
  };
};

/**
 * Upload a document (resume PDF/DOC) to Cloudinary.
 * @param {string} fileData - Base64 Data URI (data:application/...)
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadResume = async (fileData, userId) => {
  if (!isCloudinaryConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('Cloudinary media storage service is not configured in production environment.');
      err.statusCode = 503;
      err.code = 'STORAGE_SERVICE_UNAVAILABLE';
      throw err;
    }
    console.warn('[cloudinaryService] Cloudinary not configured. Operating in resilient simulated resume storage mode.');
    const mockPublicId = `disheera/resumes/resume_${userId || 'user'}_${Date.now()}`;
    return {
      secure_url: `https://res.cloudinary.com/demo/image/upload/${mockPublicId}.pdf`,
      public_id: mockPublicId,
      format: 'pdf',
      bytes: Buffer.byteLength(String(fileData), 'utf8'),
      previewUrl: `https://res.cloudinary.com/demo/image/upload/${mockPublicId}.png`,
    };
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileData,
      {
        folder: 'disheera/resumes',
        public_id: `resume_${userId || 'user'}_${Date.now()}`,
        resource_type: 'auto',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        const previewUrl = getResumePreviewUrl(result.public_id, 1);
        resolve({
          ...result,
          previewUrl,
        });
      }
    );
  });
};

/**
 * Deletes a resume asset from Cloudinary by public ID.
 * Tries image resource type first, falls back to raw resource type.
 * @param {string} publicId - Cloudinary publicId
 * @returns {Promise<Object|null>}
 */
const deleteResumeFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return null;
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
    if (res && res.result !== 'ok') {
      const rawRes = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
        invalidate: true,
      });
      return rawRes;
    }
    return res;
  } catch (err) {
    console.warn('[cloudinaryService.deleteResumeFromCloudinary] Note:', err.message);
    return null;
  }
};

/**
 * Deletes an asset from Cloudinary by public ID.
 * @param {string} publicId
 * @param {string} resourceType
 */
const deleteResource = async (publicId, resourceType = 'auto') => {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn('[cloudinaryService.deleteResource] Note:', err.message);
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadAvatar,
  uploadResume,
  getPublicIdFromUrl,
  getResumePreviewUrl,
  downloadResumeBuffer,
  deleteResource,
  deleteResumeFromCloudinary,
};

