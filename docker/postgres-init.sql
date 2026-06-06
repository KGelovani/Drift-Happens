-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  total_purchases DECIMAL(10,2) DEFAULT 0,
  last_transaction_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_total_purchases ON customers(total_purchases);
CREATE INDEX idx_customers_last_transaction ON customers(last_transaction_at);

-- Create segments table
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  rules JSONB NOT NULL,
  parent_segment_id UUID REFERENCES segments(id),
  last_evaluated_at TIMESTAMP,
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_segments_type ON segments(type);
CREATE INDEX idx_segments_parent ON segments(parent_segment_id);
CREATE INDEX idx_segments_active ON segments(is_active);

-- Create segment_memberships table
CREATE TABLE IF NOT EXISTS segment_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(segment_id, customer_id)
);

CREATE INDEX idx_memberships_segment ON segment_memberships(segment_id);
CREATE INDEX idx_memberships_customer ON segment_memberships(customer_id);

-- Create segment_deltas table
CREATE TABLE IF NOT EXISTS segment_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  customer_ids TEXT[] NOT NULL,
  type VARCHAR(50) NOT NULL,
  count INT DEFAULT 0,
  metadata JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deltas_segment ON segment_deltas(segment_id);
CREATE INDEX idx_deltas_created ON segment_deltas(created_at);
CREATE INDEX idx_deltas_type ON segment_deltas(type);
