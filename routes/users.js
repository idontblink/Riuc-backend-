const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const { authMiddleware } = require("./auth");

// GET /api/users — admin only
router.get("/", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  try {
    const result = await pool.query(
      "SELECT id, username, profile_name, email, department, level, is_admin, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: result.rows });
  } catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
});

// GET /api/users/me/uploads
router.get("/me/uploads", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, course_code, course_name, year, exam_type, status, created_at FROM papers WHERE uploader_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ papers: result.rows });
  } catch (err) { res.status(500).json({ error: "Failed to fetch uploads" }); }
});

module.exports = router;
