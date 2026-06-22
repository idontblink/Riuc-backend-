const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const { authMiddleware } = require("./auth");

router.post("/:paperId", authMiddleware, async (req, res) => {
  const { paperId } = req.params;
  const userId = req.user.id;
  try {
    const exists = await pool.query("SELECT id FROM upvotes WHERE user_id=$1 AND paper_id=$2", [userId, paperId]);
    if (exists.rows.length) {
      await pool.query("DELETE FROM upvotes WHERE user_id=$1 AND paper_id=$2", [userId, paperId]);
      await pool.query("UPDATE papers SET upvotes = upvotes - 1 WHERE id=$1", [paperId]);
      res.json({ upvoted: false });
    } else {
      await pool.query("INSERT INTO upvotes (user_id, paper_id) VALUES ($1,$2)", [userId, paperId]);
      await pool.query("UPDATE papers SET upvotes = upvotes + 1 WHERE id=$1", [paperId]);
      res.json({ upvoted: true });
    }
  } catch (err) { res.status(500).json({ error: "Failed to toggle upvote" }); }
});

router.get("/:paperId", async (req, res) => {
  try {
    const result = await pool.query("SELECT upvotes FROM papers WHERE id=$1", [req.params.paperId]);
    if (!result.rows.length) return res.status(404).json({ error: "Paper not found" });
    res.json({ upvotes: result.rows[0].upvotes });
  } catch (err) { res.status(500).json({ error: "Failed to fetch upvotes" }); }
});

module.exports = router;