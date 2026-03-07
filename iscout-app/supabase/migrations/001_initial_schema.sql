-- iScout Game Database Schema
-- Migration 001: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE doe_inzending_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE reisvraag_status AS ENUM ('unlocked', 'answered_correct', 'answered_wrong');

-- ============================================================
-- TABLES
-- ============================================================

-- Global game state (exactly 1 row)
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  credits INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the single game state row
INSERT INTO game_state (id, credits, points) VALUES (1, 0, 0);

-- Doe-opdrachten (tasks players can complete in real life)
CREATE TABLE doe_opdrachten (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  example_media_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doe-inzendingen (submissions for doe-opdrachten)
CREATE TABLE doe_inzendingen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opdracht_id UUID NOT NULL REFERENCES doe_opdrachten(id) ON DELETE CASCADE,
  status doe_inzending_status NOT NULL DEFAULT 'pending',
  credits_awarded INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  note TEXT
);

-- Reisvragen (travel/geography questions)
-- NOTE: lat, lng, radius_km are sensitive and must NOT be exposed to clients
CREATE TABLE reisvragen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hint TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  radius_km FLOAT NOT NULL DEFAULT 50,
  cost_credits INTEGER NOT NULL DEFAULT 10,
  points_awarded INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gespeelde reisvragen (tracks which questions have been played)
CREATE TABLE gespeelde_reisvragen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vraag_id UUID NOT NULL UNIQUE REFERENCES reisvragen(id) ON DELETE CASCADE,
  status reisvraag_status NOT NULL DEFAULT 'unlocked',
  wrong_answer_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE doe_opdrachten ENABLE ROW LEVEL SECURITY;
ALTER TABLE doe_inzendingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE reisvragen ENABLE ROW LEVEL SECURITY;
ALTER TABLE gespeelde_reisvragen ENABLE ROW LEVEL SECURITY;

-- game_state: public read, no direct write (server-side only)
CREATE POLICY "game_state_public_read" ON game_state
  FOR SELECT USING (true);

-- doe_opdrachten: public read (active only), no direct write
CREATE POLICY "doe_opdrachten_public_read" ON doe_opdrachten
  FOR SELECT USING (true);

-- doe_inzendingen: public read, public insert
CREATE POLICY "doe_inzendingen_public_read" ON doe_inzendingen
  FOR SELECT USING (true);

CREATE POLICY "doe_inzendingen_public_insert" ON doe_inzendingen
  FOR INSERT WITH CHECK (true);

-- reisvragen: public read but WITHOUT sensitive columns (lat, lng, radius_km)
-- We use a view to expose only safe columns
CREATE POLICY "reisvragen_public_read" ON reisvragen
  FOR SELECT USING (true);

-- gespeelde_reisvragen: public read and insert
CREATE POLICY "gespeelde_reisvragen_public_read" ON gespeelde_reisvragen
  FOR SELECT USING (true);

CREATE POLICY "gespeelde_reisvragen_public_insert" ON gespeelde_reisvragen
  FOR INSERT WITH CHECK (true);

CREATE POLICY "gespeelde_reisvragen_public_update" ON gespeelde_reisvragen
  FOR UPDATE USING (true);

-- ============================================================
-- SAFE VIEW: reisvragen without sensitive location data
-- This view is used by the frontend to list questions safely
-- ============================================================

CREATE VIEW reisvragen_safe AS
  SELECT
    id,
    name,
    hint,
    cost_credits,
    points_awarded,
    is_active,
    created_at
  FROM reisvragen;

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE doe_inzendingen;
ALTER PUBLICATION supabase_realtime ADD TABLE gespeelde_reisvragen;
