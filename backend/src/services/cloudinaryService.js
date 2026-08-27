const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer  - File buffer from multer memoryStorage
 * @param {string} folder  - Cloudinary folder (e.g. 'anikai/covers')
 * @param {object} options - Extra cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadBuffer = (buffer, folder, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', ...options },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });

/**
 * Delete a Cloudinary asset by public_id.
 */
const deleteAsset = (publicId, resourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

/**
 * Generate a streaming URL for a video.
 * Cloudinary videos are streamable by default at their secure_url.
 */
const getStreamUrl = (publicId) =>
  cloudinary.url(publicId, { resource_type: 'video', secure: true });

module.exports = { uploadBuffer, deleteAsset, getStreamUrl };
