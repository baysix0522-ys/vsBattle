-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  nickname VARCHAR(50) NOT NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  rice INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for guest users (for cleanup if needed)
CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest);
