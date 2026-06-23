const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const { authMiddleware } = require("./auth");

// ── GET /api/papers ───────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { search, department, year, exam_type, tag, sort = "recent", page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let conditions = [`p.status = 'approved'`];
  let params = []; let i = 1;
  if (search)     { conditions.push(`(p.course_code ILIKE $${i} OR p.course_name ILIKE $${i} OR p.department ILIKE $${i})`); params.push(`%${search}%`); i++; }
  if (department) { conditions.push(`p.department = $${i}`); params.push(department); i++; }
  if (year)       { conditions.push(`p.year = $${i}`); params.push(parseInt(year)); i++; }
  if (exam_type)  { conditions.push(`p.exam_type = $${i}`); params.push(exam_type); i++; }
  if (tag)        { conditions.push(`$${i} = ANY(p.tags)`); params.push(tag); i++; }
  const where   = "WHERE " + conditions.join(" AND ");
  const orderBy = sort === "upvotes" ? "p.upvotes DESC" : "p.created_at DESC";
  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM papers p ${where}`, params);
    const result = await pool.query(
      `SELECT p.*, u.username AS uploader_name, u.profile_name AS uploader_profile
       FROM papers p LEFT JOIN users u ON p.uploader_id = u.id
       ${where} ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );
    res.json({
      papers: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
    });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch papers" }); }
});

// ── ADMIN: GET /api/papers/admin/pending ── must be before /:id ──────
router.get("/admin/pending", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  try {
    const result = await pool.query(
      `SELECT p.*, u.username AS uploader_name, u.email AS uploader_email
       FROM papers p LEFT JOIN users u ON p.uploader_id = u.id
       WHERE p.status = 'pending' ORDER BY p.created_at ASC`
    );
    res.json({ papers: result.rows });
  } catch (err) { res.status(500).json({ error: "Failed to fetch pending papers" }); }
});

// ── GET /api/papers/:id ───────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  if (isNaN(req.params.id)) return res.status(404).json({ error: "Route not found" });
  try {
    const result = await pool.query(
      `SELECT p.*, u.username AS uploader_name, u.profile_name AS uploader_profile
       FROM papers p LEFT JOIN users u ON p.uploader_id = u.id
       WHERE p.id = $1 AND p.status = 'approved'`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Paper not found" });
    res.json({ paper: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "Failed to fetch paper" }); }
});

// ── POST /api/papers ──────────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  const { course_code, course_name, department, year, exam_type, file_url, answer_file_url, tags } = req.body;
  if (!course_code || !course_name || !department || !year || !exam_type || !file_url)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const result = await pool.query(
      `INSERT INTO papers (course_code, course_name, department, year, exam_type, file_url, answer_file_url, uploader_id, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [course_code.toUpperCase(), course_name, department, parseInt(year), exam_type, file_url, answer_file_url || null, req.user.id, tags || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to upload paper" }); }
});

// ── PUT /api/papers/:id/approve ───────────────────────────────────────
router.put("/:id/approve", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  try {
    const result = await pool.query(
      `UPDATE papers SET status='approved', approved_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Paper not found" });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to approve" }); }
});

// ── PUT /api/papers/:id/reject ────────────────────────────────────────
router.put("/:id/reject", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  const { reason } = req.body;
  try {
    const result = await pool.query(
      `UPDATE papers SET status='rejected', rejection_reason=$1 WHERE id=$2 RETURNING *`,
      [reason || "Does not meet requirements", req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Paper not found" });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to reject" }); }
});

// ── POST /api/papers/:id/rate ─────────────────────────────────────────
router.post("/:id/rate", authMiddleware, async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });
  try {
    await pool.query(
      `INSERT INTO ratings (user_id, paper_id, rating) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, paper_id) DO UPDATE SET rating=$3`,
      [req.user.id, req.params.id, rating]
    );
    const avg = await pool.query(
      "SELECT ROUND(AVG(rating),1) as avg, COUNT(*) as count FROM ratings WHERE paper_id=$1",
      [req.params.id]
    );
    res.json({ avg: avg.rows[0].avg, count: avg.rows[0].count });
  } catch (err) { res.status(500).json({ error: "Failed to rate" }); }
});

// ── GET /api/papers/:id/comments ─────────────────────────────────────
router.get("/:id/comments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username, u.profile_name FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.paper_id=$1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ comments: result.rows });
  } catch (err) { res.status(500).json({ error: "Failed to fetch comments" }); }
});

// ── POST /api/papers/:id/comments ────────────────────────────────────
router.post("/:id/comments", authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Comment text required" });
  try {
    const result = await pool.query(
      `INSERT INTO comments (paper_id, user_id, text) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, text.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to post comment" }); }
});

// ── DELETE /api/papers/:id ────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const paper = await pool.query("SELECT * FROM papers WHERE id=$1", [req.params.id]);
    if (!paper.rows.length) return res.status(404).json({ error: "Paper not found" });
    if (!req.user.is_admin && paper.rows[0].uploader_id !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });
    await pool.query("DELETE FROM papers WHERE id=$1", [req.params.id]);
    res.json({ message: "Paper deleted" });
  } catch (err) { res.status(500).json({ error: "Failed to delete" }); }
});

module.exports = router;
