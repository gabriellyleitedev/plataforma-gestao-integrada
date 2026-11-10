import { app } from '../../backend/src/app.js';
import { initializeStore } from '../../backend/src/database/store.js';

export default async function handler(req, res) {
  if (req.url.split('?')[0] !== '/api/health') {
    try {
      await initializeStore();
    } catch (error) {
      console.error('Falha de conexão com o banco:', error.code || error.name);
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error: {
            code: 'DATABASE_UNAVAILABLE',
            message:
              'Não conseguimos conectar ao banco. Precisamos conferir as variáveis de conexão na Vercel.'
          }
        })
      );
    }
  }
  return app(req, res);
}
