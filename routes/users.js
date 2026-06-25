const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const bcrypt  = require("bcrypt");
const { authMiddleware } = require("./auth");

// ── GET /api/users — admin only ───────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  try {
    const result = await pool.query(
      "SELECT id, username, profile_name, email, department, level, is_admin, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: result.rows });
  } catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
});

// ── GET /api/users/me ─────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, profile_name, email, department, level, avatar_url, is_admin, created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to fetch profile" }); }
});

// ── PATCH /api/users/me — update profile ─────────────────────────────
router.patch("/me", authMiddleware, async (req, res) => {
  const { profile_name, username, department, level } = req.body;

  // Check username not taken by someone else
  if (username) {
    const taken = await pool.query(
      "SELECT id FROM users WHERE username=$1 AND id!=$2",
      [username, req.user.id]
    );
    if (taken.rows.length) return res.status(409).json({ error: "Username already taken" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET
        profile_name = COALESCE($1, profile_name),
        username     = COALESCE($2, username),
        department   = COALESCE($3, department),
        level        = COALESCE($4, level),
        updated_at   = NOW()
       WHERE id=$5
       RETURNING id, username, profile_name, email, department, level, is_admin`,
      [profile_name || null, username || null, department || null, level ? parseInt(level) : null, req.user.id]
    );
    res.json({ user: result.rows[0], message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── PATCH /api/users/me/password — change password ───────────────────
router.patch("/me/password", authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: "Both current and new password required" });
  if (new_password.length < 6)
    return res.status(400).json({ error: "New password must be at least 6 characters" });

  try {
    const result = await pool.query("SELECT password_hash FROM users WHERE id=$1", [req.user.id]);
    const match  = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [hashed, req.user.id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) { res.status(500).json({ error: "Failed to update password" }); }
});

// ── GET /api/users/me/uploads ─────────────────────────────────────────
router.get("/me/uploads", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, course_code, course_name, year, exam_type, status, created_at FROM papers WHERE uploader_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ papers: result.rows });
  } catch (err) { res.status(500).json({ error: "Failed to fetch uploads" }); }
});

// ── PATCH /api/users/:id/make-admin — promote user (admin only) ───────
router.patch("/:id/make-admin", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  try {
    const result = await pool.query(
      "UPDATE users SET is_admin=true, updated_at=NOW() WHERE id=$1 RETURNING id, username, profile_name, email, is_admin",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ user: result.rows[0], message: "User promoted to admin" });
  } catch (err) { res.status(500).json({ error: "Failed to promote user" }); }
});

// ── PATCH /api/users/:id/remove-admin — demote admin (admin only) ─────
router.patch("/:id/remove-admin", authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: "You cannot remove your own admin access" });
  try {
    const result = await pool.query(
      "UPDATE users SET is_admin=false, updated_at=NOW() WHERE id=$1 RETURNING id, username, profile_name, email, is_admin",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ user: result.rows[0], message: "Admin access removed" });
  } catch (err) { res.status(500).json({ error: "Failed to demote user" }); }
});

module.exports = router;
