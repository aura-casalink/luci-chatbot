// Mapa global para almacenar conexiones SSE activas
const connections = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  // Configurar SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Almacenar la conexión
  connections.set(sessionId, res);

  // Enviar heartbeat cada 30 segundos
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\n\n');
  }, 30000);

  // Limpiar cuando se cierre la conexión
  req.on('close', () => {
    clearInterval(heartbeat);
    connections.delete(sessionId);
  });
}

// Función para enviar datos a una sesión específica
export function sendToSession(sessionId, data) {
  const connection = connections.get(sessionId);
  if (connection) {
    connection.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  }
  return false;
}
