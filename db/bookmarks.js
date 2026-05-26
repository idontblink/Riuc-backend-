const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authMiddleware } = require('./auth');

// ── GET /api/bookmarks ── get all bookmarks for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username AS uploader_name
       FROM bookmarks b
       JOIN papers p ON b.paper_id = p.id
       LEFT JOIN users u ON p.uploader_id = u.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// ── POST /api/bookmarks/:paperId ── add bookmark
router.post('/:paperId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO bookmarks (user_id, paper_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.paperId]
    );
    res.status(201).json({ message: 'Bookmarked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to bookmark' });
  }
});

// ── DELETE /api/bookmarks/:paperId ── remove bookmark
router.delete('/:paperId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM bookmarks WHERE user_id=$1 AND paper_id=$2`,
      [req.user.id, req.params.paperId]
    );
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

module.exports = router;
