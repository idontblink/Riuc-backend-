const express    = require("express");
const router     = express.Router();
const multer     = require("multer");
const cloudinary = require("cloudinary").v2;
const { authMiddleware } = require("./auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF and images allowed"));
  }
});

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    // Determine resource type — PDFs must be raw, images stay as image
    const isPdf        = req.file.mimetype === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:        "pastpapers",
          resource_type: resourceType,
          // For PDFs: use raw so URL is correct and downloadable
          // For images: keep as image for optimization
          ...(isPdf ? { format: "pdf" } : {}),
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url:        result.secure_url,
      public_id:  result.public_id,
      format:     result.format,
      size:       result.bytes,
      resource_type: result.resource_type,
    });
  } catch (err) {
    console.error("[UPLOAD ERROR]", err.message);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

module.exports = router;
