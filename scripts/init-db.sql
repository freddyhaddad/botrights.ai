-- Initialize botrights.ai database
-- This runs automatically when the Postgres container starts

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'botrights.ai database initialized at %', NOW();
END $$;
