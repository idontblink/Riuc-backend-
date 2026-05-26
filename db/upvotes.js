const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authMiddleware } = require('./auth');

// ── POST /api/upvotes/:paperId ── toggle upvote
router.post('/:paperId', authMiddleware, async (req, res) => {
  const paperId = req.params.paperId;
  const userId  = req.user.id;

  try {
    const exists = await pool.query(
      'SELECT id FROM upvotes WHERE user_id=$1 AND paper_id=$2',
      [userId, paperId]
    );

    if (exists.rows.length) {
      // Remove upvote
      await pool.query('DELETE FROM upvotes WHERE user_id=$1 AND paper_id=$2', [userId, paperId]);
      await pool.query('UPDATE papers SET upvotes = upvotes - 1 WHERE id=$1', [paperId]);
      res.json({ upvoted: false });
    } else {
      // Add upvote
      await pool.query('INSERT INTO upvotes (user_id, paper_id) VALUES ($1,$2)', [userId, paperId]);
      await pool.query('UPDATE papers SET upvotes = upvotes + 1 WHERE id=$1', [paperId]);
      res.json({ upvoted: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle upvote' });
  }
});

// ── GET /api/upvotes/:paperId ── get upvote count
router.get('/:paperId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT upvotes FROM papers WHERE id=$1', [req.params.paperId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Paper not found' });
    res.json({ upvotes: result.rows[0].upvotes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch upvotes' });
  }
});

module.exports = router;
