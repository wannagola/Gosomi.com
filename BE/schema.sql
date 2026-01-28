CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(255),
  kakao_id VARCHAR(255),
  profile_image VARCHAR(255),
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  plaintiff_id INT NOT NULL,
  defendant_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'ONGOING',
  law_type VARCHAR(50),
  verdict_text TEXT,
  penalties_json TEXT, -- JSON
  fault_ratio TEXT, -- JSON
  penalty_choice VARCHAR(50),
  penalty_selected TEXT,
  jury_enabled BOOLEAN DEFAULT FALSE,
  jury_mode VARCHAR(50),
  jury_invite_token VARCHAR(255),
  appeal_status VARCHAR(50) DEFAULT 'NONE',
  appellant_id INT,
  appeal_reason TEXT,
  appeal_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plaintiff_id) REFERENCES users(id),
  FOREIGN KEY (defendant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evidences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'text', 'image'
  text_content TEXT,
  file_path VARCHAR(255),
  mime_type VARCHAR(100),
  submitted_by VARCHAR(50) NOT NULL, -- 'PLAINTIFF', 'DEFENDANT'
  stage VARCHAR(50) DEFAULT 'INITIAL', -- 'INITIAL', 'APPEAL'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE TABLE IF NOT EXISTS defenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE TABLE IF NOT EXISTS jurors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'INVITED', -- 'INVITED', 'VOTED'
  vote VARCHAR(50), -- 'PLAINTIFF', 'DEFENDANT'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  case_id INT, -- Can be 0 or NULL for non-case notifs
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS friends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (friend_id) REFERENCES users(id)
);
