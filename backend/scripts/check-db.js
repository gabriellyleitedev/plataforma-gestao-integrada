import { closePool } from '../src/database/pool.js';
import { query, driver } from '../src/database/store.js';
try {
  await query('SELECT 1');
  console.log(`Conexão ${driver} confirmada. Schema inicial disponível.`);
} catch (error) {
  console.error(
    `Não foi possível conectar ao banco: ${error.code || 'verifique as variáveis DB_* e o certificado TLS'}`
  );
  process.exitCode = 1;
} finally {
  await closePool();
}
