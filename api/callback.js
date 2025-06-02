import { sendToSession } from './events.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Only POST method allowed' 
    });
  }

  try {
    const callbackData = req.body;
    const sessionId = req.query.sessionId || callbackData.sessionId;
    
    console.log('Callback recibido:', { sessionId, data: callbackData });

    const sent = sendToSession(sessionId, {
      type: 'callback',
      ...callbackData
    })

    // Responder con éxito y datos para el frontend
    return res.status(200).json({
      success: true,
      message: 'Callback processed',
      sent: sent
    });

  } catch (error) {
    console.error('Error procesando callback:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
