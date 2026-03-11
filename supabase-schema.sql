-- ════════════════════════════════════════════
-- ChatForge — Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Servers table ──────────────────────────
CREATE TABLE IF NOT EXISTS servers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '💬',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Messages table ─────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id   UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes for performance ────────────────
CREATE INDEX IF NOT EXISTS idx_messages_server_id
  ON messages(server_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_servers_created_at
  ON servers(created_at DESC);

-- ── Row Level Security (RLS) ───────────────
-- Enable RLS on tables
ALTER TABLE servers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Since we use the service_role key in API routes, these policies
-- allow all operations via the service role (which bypasses RLS).
-- For additional security, you can add user-based policies here.

-- Allow service role full access (already true by default)
-- Public read for servers (optional if you want direct client access)
CREATE POLICY "Public read servers" ON servers
  FOR SELECT USING (true);

CREATE POLICY "Public read messages" ON messages
  FOR SELECT USING (true);

-- ── Seed some starter servers ──────────────
INSERT INTO servers (name, icon, description) VALUES
  ('General Chat',      '🌍', 'A place for everyone. Talk about anything!'),
  ('Tech & Dev',        '💻', 'Programming, tools, and all things technical.'),
  ('Gaming Lounge',     '🎮', 'GG! Discuss games, share clips, find teammates.'),
  ('Music & Vibes',     '🎵', 'Share what you''re listening to right now.'),
  ('Creative Corner',   '🎨', 'Art, design, writing, and creative projects.')
ON CONFLICT (name) DO NOTHING;
