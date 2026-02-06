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

-- Rice transactions table
CREATE TABLE IF NOT EXISTS rice_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('charge', 'consume', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user rice transactions
CREATE INDEX IF NOT EXISTS idx_rice_transactions_user_id ON rice_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_rice_transactions_created_at ON rice_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_rice_transactions_reference ON rice_transactions(reference_type, created_at);

-- Name analysis records table (이름 풀이)
CREATE TABLE IF NOT EXISTS name_analysis_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  korean_name VARCHAR(10) NOT NULL,
  surname VARCHAR(5),
  surname_hanja VARCHAR(5),
  selected_hanja VARCHAR(30) NOT NULL,
  analysis_result JSONB NOT NULL,
  overall_score INTEGER NOT NULL,
  overall_grade VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_name_analysis_user ON name_analysis_records(user_id);
CREATE INDEX IF NOT EXISTS idx_name_analysis_name ON name_analysis_records(korean_name, selected_hanja);
