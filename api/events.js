// Mapa global para almacenar conexiones SSE activas
const connections = new Map();

export default async function handler(req, res) {
  console.log('Events endpoint llamado:', req.method, req.query);

  // 1) Solo permitimos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  const sessionId = req.query.sessionId;
  if (!sessionId) {
    console.log('Error: sessionId faltante');
    return res.status(400).json({ error: 'sessionId required' });
  }

  console.log('Estableciendo conexión SSE para sesión:', sessionId);

  // 2) Ajustamos encabezados SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // 3) Cada 30 segundos enviamos un heartbeat para mantener viva la conexión
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
    } catch (error) {
      console.log('Error enviando heartbeat:', error);
      clearInterval(heartbeat);
      connections.delete(sessionId);
    }
  }, 30000);

  // 4) Guardamos la conexión en el mapa, junto con el intervalo del heartbeat
  connections.set(sessionId, { res, heartbeat });
  console.log('Conexiones activas:', connections.size);

  // 5) Enviamos inmediatamente el evento “connected”
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // 6) Cuando el cliente cierra la conexión, limpiamos todo
  req.on('close', () => {
    console.log('Conexión SSE cerrada (cliente desconectado):', sessionId);
    clearInterval(heartbeat);
    connections.delete(sessionId);
  });
}

// Función para enviar datos a una sesión específica (callback)
export function sendToSession(sessionId, data) {
  console.log('Intentando enviar a sesión:', sessionId, 'Data:', data);
  console.log('Conexiones disponibles:', Array.from(connections.keys()));

  const entry = connections.get(sessionId);
  if (!entry) {
    console.log('No se encontró conexión para la sesión:', sessionId);
    return false;
  }

  try {
    // 1) Enviamos el evento “callback”
    entry.res.write(`data: ${JSON.stringify(data)}\n\n`);

    // 2) Una vez enviado el callback, cerramos el heartbeat y terminamos la respuesta
    clearInterval(entry.heartbeat);
    entry.res.write(`event: end\n\n`); // opcional: un evento final
    entry.res.end();                  // cerramos el SSE

    connections.delete(sessionId);
    console.log('SSE cerrado tras enviar callback para sesión:', sessionId);
    return true;
  } catch (error) {
    console.log('Error enviando mensaje SSE:', error);
    clearInterval(entry.heartbeat);
    connections.delete(sessionId);
    return false;
  }
}
