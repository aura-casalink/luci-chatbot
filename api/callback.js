export default async function handler(req, res) {
  console.log('Callback endpoint llamado:', {
    method: req.method,
    query: req.query,
    body: req.body
  });
  
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
    const sessionId = req.query.sessionId || callbackData.sessionId || callbackData.session_id;
    
    console.log('Processing callback:', { sessionId, callbackData });
    
    if (!sessionId) {
      console.log('Error: No sessionId provided');
      return res.status(400).json({
        success: false,
        error: 'sessionId required'
      });
    }
    
    // Importar dinámicamente la función sendToSession
    const { sendToSession } = await import('./events.js');
    
    const sent = sendToSession(sessionId, {
      type: 'callback',
      ...callbackData
    });
    
    console.log('Callback result:', { sent, sessionId });
    
    // Responder con éxito
    return res.status(200).json({
      success: true,
      message: 'Callback processed',
      sent: sent,
      sessionId: sessionId
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
