-- ============================================================
--  PastPapers RIUC — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  student_id  VARCHAR(20)  UNIQUE NOT NULL,
  role        VARCHAR(20)         NOT NULL DEFAULT 'student',  -- 'student' | 'admin'
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- COURSES
CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20)  UNIQUE NOT NULL,  -- e.g. 'RIDA115'
  name        VARCHAR(200)        NOT NULL,
  department  VARCHAR(100)        NOT NULL,
  level       VARCHAR(10),                    -- e.g. '100', '200'
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- PAPERS
CREATE TABLE IF NOT EXISTS papers (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255)        NOT NULL,
  course_code     VARCHAR(20)         NOT NULL,
  year            INTEGER             NOT NULL,
  semester        VARCHAR(20)         NOT NULL,  -- 'First' | 'Second' | 'Resit'
  description     TEXT,
  file_url        TEXT                NOT NULL,   -- Cloudinary secure_url
  file_public_id  TEXT                NOT NULL,   -- Cloudinary public_id (for deletion)
  file_type       VARCHAR(50)         NOT NULL,
  file_size       INTEGER,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status          VARCHAR(20)         NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  download_count  INTEGER             NOT NULL DEFAULT 0,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ── Indexes for common queries ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_papers_course_code ON papers(course_code);
CREATE INDEX IF NOT EXISTS idx_papers_status      ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_year        ON papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_user_id     ON papers(user_id);

-- ── Seed admin account ─────────────────────────────────────────────────
-- Password below is bcrypt hash of your actual admin password.
-- Replace the hash after running: node -e "require('bcrypt').hash('YourPassword',12).then(console.log)"
INSERT INTO users (name, email, password, student_id, role)
VALUES (
  'Admin',
  'akpehuel@gmail.com',
  '$2b$12$REPLACE_THIS_WITH_REAL_BCRYPT_HASH',
  'ADMIN001',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ── Seed some RIUC courses ─────────────────────────────────────────────
INSERT INTO courses (code, name, department, level) VALUES
  ('RIDA115', 'Digital and Academic Literacies',        'General Studies',          '100'),
  ('UGBS105', 'Introduction to Public Administration',  'Business Studies',         '100'),
  ('DCIT101', 'Introduction to Computer Science',       'Computer Science',         '100'),
  ('DCIT103', 'Programming Fundamentals',               'Computer Science',         '100'),
  ('DCIT201', 'Data Structures and Algorithms',         'Computer Science',         '200'),
  ('DCIT205', 'Database Management Systems',            'Computer Science',         '200'),
  ('DCIT301', 'Computer Networks',                      'Computer Science',         '300'),
  ('DCIT303', 'Information Security',                   'Computer Science',         '300')
ON CONFLICT (code) DO NOTHING;
