-- ============================================================
--  PastPapers RIUC — Supabase PostgreSQL Schema
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(100) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_name VARCHAR(255),
  department   VARCHAR(150),
  level        INTEGER,
  avatar_url   VARCHAR(500),
  is_admin     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- COURSES (based on actual RIUC programmes)
CREATE TABLE IF NOT EXISTS courses (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(20) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  faculty    VARCHAR(150) NOT NULL,
  level      VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAPERS
CREATE TABLE IF NOT EXISTS papers (
  id               SERIAL PRIMARY KEY,
  course_code      VARCHAR(20) NOT NULL,
  course_name      VARCHAR(255) NOT NULL,
  department       VARCHAR(150) NOT NULL,
  year             INTEGER NOT NULL,
  exam_type        VARCHAR(50) NOT NULL DEFAULT 'Final Exam',
  file_url         VARCHAR(500) NOT NULL,
  answer_file_url  VARCHAR(500),
  file_type        VARCHAR(50),
  uploader_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  upvotes          INTEGER DEFAULT 0,
  tags             TEXT[] DEFAULT '{}',
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKMARKS
CREATE TABLE IF NOT EXISTS bookmarks (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paper_id   INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, paper_id)
);

-- UPVOTES
CREATE TABLE IF NOT EXISTS upvotes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paper_id   INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, paper_id)
);

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  paper_id   INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RATINGS
CREATE TABLE IF NOT EXISTS ratings (
  id         SERIAL PRIMARY KEY,
  paper_id   INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, paper_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_papers_status      ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_course_code ON papers(course_code);
CREATE INDEX IF NOT EXISTS idx_papers_year        ON papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_department  ON papers(department);
CREATE INDEX IF NOT EXISTS idx_comments_paper     ON comments(paper_id);
CREATE INDEX IF NOT EXISTS idx_ratings_paper      ON ratings(paper_id);

-- ── Seed admin account ─────────────────────────────────────────────
INSERT INTO users (username, email, password_hash, profile_name, department, is_admin)
VALUES (
  'admin',
  'akpehuel@gmail.com',
  '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH',
  'Admin',
  'Faculty of Information and Communications Technology',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- ── Seed RIUC actual courses ───────────────────────────────────────
-- FACULTY OF INFORMATION AND COMMUNICATIONS TECHNOLOGY
INSERT INTO courses (code, name, faculty, level) VALUES
  ('RIDA115', 'Academic and Digital Literacies',              'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIDD119', 'Database Design and Development',             'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RICW113', 'Communication and Writing Skills',            'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIIT101', 'Introduction to Information Technology',      'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIIT201', 'Systems Analysis and Design',                 'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIIT301', 'Network Administration and Security',         'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RISY201', 'Business Information Systems',                'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIPR201', 'Programming Fundamentals',                    'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIWD301', 'Web Development and Design',                  'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RICN301', 'Computer Networks',                           'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RICY301', 'Cybersecurity Fundamentals',                  'Faculty of Information and Communications Technology', 'Undergraduate'),
  ('RIPM201', 'Project Management',                          'Faculty of Information and Communications Technology', 'Undergraduate'),

-- FACULTY OF COMMERCE
  ('UGBS105', 'Introduction to Public Administration',       'Faculty of Commerce', 'Undergraduate'),
  ('RISM201', 'Supply Chain Management Fundamentals',        'Faculty of Commerce', 'Undergraduate'),
  ('RIBA101', 'Business Administration Principles',          'Faculty of Commerce', 'Undergraduate'),
  ('RIAC201', 'Financial Accounting',                        'Faculty of Commerce', 'Undergraduate'),
  ('RIMK201', 'Principles of Marketing',                     'Faculty of Commerce', 'Undergraduate'),
  ('RIHR301', 'Human Resource Management',                   'Faculty of Commerce', 'Undergraduate'),
  ('RIEC201', 'Business Economics',                          'Faculty of Commerce', 'Undergraduate'),
  ('RIMB501', 'MBA Core: Strategic Management',              'Faculty of Commerce', 'Postgraduate'),
  ('RIMB502', 'MBA Core: Leadership and Innovation',         'Faculty of Commerce', 'Postgraduate'),

-- FACULTY OF HOSPITALITY, CULINARY AND SERVICE
  ('RIHO101', 'Introduction to Hospitality Management',      'Faculty of Hospitality, Culinary and Service', 'Undergraduate'),
  ('RICU101', 'Culinary Arts Foundations',                   'Faculty of Hospitality, Culinary and Service', 'Undergraduate'),
  ('RIFO201', 'Food and Beverage Operations',                'Faculty of Hospitality, Culinary and Service', 'Undergraduate'),
  ('RIHT201', 'Hotel Operations Management',                 'Faculty of Hospitality, Culinary and Service', 'Undergraduate'),
  ('RISV201', 'Service Excellence and Quality',              'Faculty of Hospitality, Culinary and Service', 'Undergraduate'),
  ('RIEP201', 'Event Planning and Management',               'Faculty of Hospitality, Culinary and Service', 'Undergraduate'),

-- SHORT LEARNING PROGRAMMES
  ('SLP-CS1', 'Introduction to Cybersecurity',               'Short Learning Programmes', 'Short Course'),
  ('SLP-CS2', 'Advanced Cybersecurity and Threat Management','Short Learning Programmes', 'Short Course'),
  ('SLP-AI1', 'AI for Business Decision-Making',             'Short Learning Programmes', 'Short Course'),
  ('SLP-DL1', 'Digital Literacy and Productivity Tools',     'Short Learning Programmes', 'Short Course'),
  ('SLP-SM1', 'Social Media Marketing and Analytics',        'Short Learning Programmes', 'Short Course')

ON CONFLICT (code) DO NOTHING;
