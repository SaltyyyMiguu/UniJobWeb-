/**
 * cloudinaryUploader.js — Cloudinary-backed file storage (replaces local disk)
 *
 * Render's filesystem is ephemeral — anything written to backend/uploads/ is
 * gone on the next restart/redeploy. Every upload in this app now goes to
 * Cloudinary instead, so files survive deploys and don't depend on which
 * server instance happens to be handling a request.
 */
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Image uploads (avatars, logos, listing covers, profile cover photos) ────
function makeImageUpload({ folder, prefix, maxSizeMB }) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: () => ({
      folder,
      allowed_formats: ['jpeg', 'png', 'jpg'],
      resource_type: 'image',
      public_id: `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
  });
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'), false);
    },
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

// ─── PDF uploads (resumes, offer letters) ─────────────────────────────────────
// resource_type: 'image' — Cloudinary treats PDFs as a special image type
// (page rasterization, thumbnails, transformations) and serves them with the
// inline-viewing + CORS headers browsers need to render them directly.
// 'raw' delivery doesn't carry those headers, which is why PDFs uploaded that
// way were downloading/failing instead of rendering.
//
// NOTE: this requires "Allow delivery of PDF and ZIP files" to be enabled
// under Console → Settings → Security in the Cloudinary dashboard — accounts
// created after Cloudinary's 2018 security change have this OFF by default,
// and PDFs uploaded as 'image' will 401 on delivery until it's turned on.
function makePdfUpload({ folder, prefix, maxSizeMB }) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: () => ({
      folder,
      resource_type: 'image',
      allowed_formats: ['pdf'],
      format: 'pdf',
      public_id: `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
  });
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      // Same double-check as the old disk-storage config: never trust an
      // attacker-controlled filename/extension alone — require the real
      // multipart Content-Type to say application/pdf too.
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.mimetype === 'application/pdf' && ext === '.pdf') cb(null, true);
      else cb(new Error('Only PDF files are allowed'), false);
    },
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

module.exports = {
  cloudinary,
  uploadStudentProfileImage: makeImageUpload({ folder: 'unijoblink/profiles', prefix: 'profile', maxSizeMB: 3 }),
  uploadCompanyProfileImage: makeImageUpload({ folder: 'unijoblink/profiles', prefix: 'company', maxSizeMB: 3 }),
  uploadListingImage: makeImageUpload({ folder: 'unijoblink/listings', prefix: 'listing', maxSizeMB: 5 }),
  uploadCoverPhoto: makeImageUpload({ folder: 'unijoblink/covers', prefix: 'cover', maxSizeMB: 5 }),
  uploadResume: makePdfUpload({ folder: 'unijoblink/resumes', prefix: 'resume', maxSizeMB: 5 }),
  uploadOfferLetter: makePdfUpload({ folder: 'unijoblink/offers', prefix: 'offer', maxSizeMB: 10 }),
};
