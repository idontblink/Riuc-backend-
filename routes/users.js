const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authMiddleware } = require('./auth');

// ── Helper: require an authenticated admin ──
const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ── GET /api/users ──
// Returns all users. Used by the admin panel (Users tab + platform stats).
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, profile_name, department, level, avatar_url, is_admin, created_at
       FROM users
       ORDER BY id`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── GET /api/users/me/uploads ──
// Returns the papers uploaded by the currently logged-in user.
// (Used on the profile page to show an upload count.)
router.get('/me/uploads', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, course_code, course_name, department, year, exam_type,
              file_url, answer_file_url, status, rejection_reason,
              upvotes, tags, created_at, approved_at
       FROM papers
       WHERE uploader_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ papers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

module.exports = router;
