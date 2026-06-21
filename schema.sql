const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// ── Configure Cloudinary ──────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer: store files in memory before uploading to Cloudinary ──────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

// ── Upload a buffer to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer, folder = 'pastpapers') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary, cloudinary };
