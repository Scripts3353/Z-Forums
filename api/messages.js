// api/messages.js — Get, post, and delete messages
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET — fetch messages for a server
  if (req.method === 'GET') {
    const { server_id, limit = 60, before } = req.query;

    if (!server_id) {
      return res.status(400).json({ error: 'server_id is required' });
    }

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('server_id', server_id)
        .order('created_at', { ascending: true })
        .limit(parseInt(limit, 10));

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) throw error;

      return res.status(200).json({ messages: data });
    } catch (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  // POST — send a message
  if (req.method === 'POST') {
    const { server_id, username, content } = req.body || {};

    if (!server_id || !username || !content) {
      return res.status(400).json({ error: 'server_id, username, and content are required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    if (username.length > 32) {
      return res.status(400).json({ error: 'Username too long (max 32 characters)' });
    }

    // Sanitize: strip null bytes
    const safeContent = content.replace(/\0/g, '');
    const safeUsername = username.replace(/\0/g, '').trim();

    try {
      // Verify server exists
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .select('id')
        .eq('id', server_id)
        .single();

      if (serverError || !server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          server_id,
          username: safeUsername,
          content:  safeContent,
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ message: data });
    } catch (err) {
      console.error('Error sending message:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // DELETE — delete a specific message
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
