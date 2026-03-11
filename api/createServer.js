// api/createServer.js — Create a new server
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, icon, description } = req.body || {};

  // Validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Server name must be at least 2 characters' });
  }
  if (name.trim().length > 64) {
    return res.status(400).json({ error: 'Server name too long (max 64 characters)' });
  }
  if (description && description.length > 256) {
    return res.status(400).json({ error: 'Description too long (max 256 characters)' });
  }

  // Simple emoji validation — allow 1-2 emoji characters or default
  const safeIcon = icon?.trim().slice(0, 4) || '💬';

  try {
    // Check for duplicate name
    const { data: existing } = await supabase
      .from('servers')
      .select('id')
      .ilike('name', name.trim())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'A server with that name already exists' });
    }

    const { data, error } = await supabase
      .from('servers')
      .insert([{
        name:        name.trim(),
        icon:        safeIcon,
        description: description?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ server: data });
  } catch (err) {
    // Duplicate name race condition
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A server with that name already exists' });
    }
    console.error('Error creating server:', err);
    return res.status(500).json({ error: 'Failed to create server' });
  }
}
