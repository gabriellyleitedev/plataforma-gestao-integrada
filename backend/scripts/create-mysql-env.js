import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const destination = fileURLToPath(new URL('../../database/.env', import.meta.url));
if (existsSync(destination)) {
  console.log('database/.env já existe e foi preservado.');
} else {
  const body = `DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_NAME=plataforma_gestao_integrada\nDB_USER=pgi\nDB_PASSWORD=${randomBytes(32).toString('hex')}\nMYSQL_ROOT_PASSWORD=${randomBytes(32).toString('hex')}\n`;
  writeFileSync(destination, body, { flag: 'wx', mode: 0o600 });
  console.log('database/.env criado com senhas aleatórias. O arquivo é privado e ignorado pelo Git.');
}
