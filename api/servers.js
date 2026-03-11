// api/servers.js — List and delete servers
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET — list all servers
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ servers: data });
    } catch (err) {
      console.error('Error fetching servers:', err);
      return res.status(500).json({ error: 'Failed to fetch servers' });
    }
  }

  // DELETE — delete a server and its messages
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Server ID required' });
    }

    try {
      // Delete all messages in this server first
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('server_id', id);

      if (msgError) throw msgError;

      // Delete the server
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error deleting server:', err);
      return res.status(500).json({ error: 'Failed to delete server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
