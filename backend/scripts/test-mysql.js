import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Geramos o nome aqui para remover somente o banco criado pelo teste.
const name = `pgi_test_${randomBytes(12).toString('hex')}`;
const options = {
  host: process.env.TEST_MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.TEST_MYSQL_PORT || process.env.DB_PORT || 3306),
  user: process.env.TEST_MYSQL_USER || process.env.DB_USER,
  password: process.env.TEST_MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? ''
};
if (!options.user) throw new Error('Configure TEST_MYSQL_USER ou DB_USER para uma instância de teste.');
let connection;
let created = false;
try {
  connection = await mysql.createConnection(options);
  await connection.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  created = true;
  console.log('MySQL real: executando os fluxos em banco temporário isolado.');
  const child = spawn(process.execPath, ['--test', 'test/management.test.js'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit',
    env: { ...process.env, RUN_MYSQL_TEST: '1', NODE_ENV: 'test', DB_DRIVER: 'mysql', DB_HOST: options.host, DB_PORT: String(options.port), DB_USER: options.user, DB_PASSWORD: options.password, DB_NAME: name, DB_SSL: 'false' }
  });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(`Teste MySQL falhou: ${error.code || error.message}`);
  process.exitCode = 1;
} finally {
  if (created) await connection.query(`DROP DATABASE \`${name}\``);
  if (connection) await connection.end();
}
