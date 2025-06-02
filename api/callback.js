// api/callback.js

import { createClient } from '@supabase/supabase-js';

// Las variables de entorno que definimos en Vercel
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Creamos el cliente de Supabase con la clave proporcionada
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  console.log('Callback endpoint llamado:', {
    method: req.method,
    query: req.query,
    body: req.body
  });

  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si es preflight OPTIONS, devolvemos 200
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitimos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Only POST allowed' });
  }

  try {
    // 1) Leemos el JSON del body
    const callbackData = req.body;

    // 2) Extraemos sessionId de la query o del body
    const sessionId =
      req.query.sessionId ||
      callbackData.sessionId ||
      callbackData.session_id;

    console.log('Processing callback:', { sessionId, callbackData });

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId required' });
    }

    // 3) Insertamos una fila nueva en callbacks
    const { data, error: insertError } = await supabase
      .from('callbacks')
      .insert({
        session_id: sessionId,
        payload: callbackData,
        // pending: true (lo toma por defecto)
        updated_at: new Date().toISOString()
      })
      .select('id') // queremos que devuelva el id generado
      .single();    // esperamos un solo objeto

    if (insertError) {
      console.error('Error insertando en Supabase:', insertError);
      return res.status(500).json({ success: false, error: 'Error insertando callback en Supabase' });
    }

    console.log('Nuevo callback insertado con id:', data.id);

    // 4) Respondemos con el id de la fila recién creada
    return res.status(200).json({
      success: true,
      message: 'Callback registrado',
      sessionId,
      id: data.id
    });
  } catch (error) {
    console.error('Error procesando callback:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
