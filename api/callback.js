export default function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;
  const callbackData = req.body;

  console.log('Callback recibido para sesión:', sessionId, 'Data:', callbackData);

  // Aquí podrías validar el sessionId si es necesario
  
  // Devolver script que ejecute el callback en el frontend
  const script = `
    <script>
      try {
        if (window.opener && window.opener.handleCallback) {
          const result = window.opener.handleCallback(${JSON.stringify(callbackData)});
          console.log('Callback ejecutado:', result);
        } else if (parent && parent.handleCallback) {
          const result = parent.handleCallback(${JSON.stringify(callbackData)});
          console.log('Callback ejecutado:', result);
        } else {
          console.log('No se encontró función handleCallback en ventana padre');
        }
        // Cerrar ventana si fue abierta para callback
        if (window.opener) {
          window.close();
        }
      } catch (error) {
        console.error('Error ejecutando callback:', error);
      }
    </script>
    <html><body>Callback procesado</body></html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(script);
}
