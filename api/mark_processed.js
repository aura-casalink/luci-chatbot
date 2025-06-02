// api/mark_processed.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  console.log('mark_processed endpoint llamado:', {
    method: req.method,
    query: req.query
  });

  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitimos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Only POST allowed' });
  }

  try {
    // 1) Obtenemos el id de la query (por ejemplo: /api/mark_processed?id=123)
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'id required' });
    }

    // 2) Hacemos update pending = false
    const { error: updateError } = await supabase
      .from('callbacks')
      .update({ pending: false })
      .eq('id', id);

    if (updateError) {
      console.error('Error actualizando pending=false:', updateError);
      return res.status(500).json({ success: false, error: 'Error actualizando en Supabase' });
    }

    console.log('Fila con id', id, 'marcada como procesada (pending=false)');

    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Error en mark_processed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
