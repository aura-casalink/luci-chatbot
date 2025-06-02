// Mapa global para almacenar conexiones SSE activas
const connections = new Map();

export default async function handler(req, res) {
  console.log('Events endpoint llamado:', req.method, req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }
  
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    console.log('Error: sessionId faltante');
    return res.status(400).json({ error: 'sessionId required' });
  }
  
  console.log('Estableciendo conexión SSE para sesión:', sessionId);
  
  // Configurar SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  
  // Almacenar la conexión
  connections.set(sessionId, res);
  console.log('Conexiones activas:', connections.size);
  
  // Enviar mensaje de conexión establecida
  res.write(`data: ${JSON.stringify({type: 'connected', sessionId})}\n\n`);
  
  // Enviar heartbeat cada 30 segundos
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({type: 'heartbeat'})}\n\n`);
    } catch (error) {
      console.log('Error enviando heartbeat:', error);
      clearInterval(heartbeat);
      connections.delete(sessionId);
    }
  }, 30000);
  
  // Limpiar cuando se cierre la conexión
  req.on('close', () => {
    console.log('Conexión SSE cerrada para sesión:', sessionId);
    clearInterval(heartbeat);
    connections.delete(sessionId);
  });
}

// Función para enviar datos a una sesión específica
export function sendToSession(sessionId, data) {
  console.log('Intentando enviar a sesión:', sessionId, 'Data:', data);
  console.log('Conexiones disponibles:', Array.from(connections.keys()));
  
  const connection = connections.get(sessionId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
      console.log('Mensaje enviado exitosamente');
      return true;
    } catch (error) {
      console.log('Error enviando mensaje:', error);
      connections.delete(sessionId);
      return false;
    }
  } else {
    console.log('No se encontró conexión para la sesión:', sessionId);
    return false;
  }
}
