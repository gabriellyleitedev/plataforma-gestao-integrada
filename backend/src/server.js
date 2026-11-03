import { app } from './app.js';
import { env } from './config/env.js';
import { closePool } from './database/pool.js';
import { initializeStore, driver } from './database/store.js';

await initializeStore();
const server = app.listen(env.port, () => console.log(`API em http://localhost:${env.port} | Banco: ${driver}`));
server.on('error', (error) => { console.error(`Falha ao iniciar a API: ${error.code}`); process.exitCode = 1; });

function shutdown() {
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(async () => {
    try { await closePool(); } catch { process.exitCode = 1; }
    clearTimeout(timeout);
  });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
