-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_name VARCHAR(255),
  department VARCHAR(100),
  level INT,
  avatar_url VARCHAR(500),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create papers table
CREATE TABLE IF NOT EXISTS papers (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  exam_type VARCHAR(50) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  answer_file_url VARCHAR(500),
  uploader_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  rejection_reason TEXT,
  upvotes INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  paper_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  UNIQUE(user_id, paper_id)
);

-- Create upvotes table
CREATE TABLE IF NOT EXISTS upvotes (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  paper_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  UNIQUE(user_id, paper_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_papers_status ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_uploader ON papers(uploader_id);
CREATE INDEX IF NOT EXISTS idx_papers_department ON papers(department);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_course_code ON papers(course_code);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_paper ON bookmarks(paper_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user ON upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_paper ON upvotes(paper_id);