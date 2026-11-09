import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import mysql from 'mysql2/promise';

const root = fileURLToPath(new URL('../../', import.meta.url));
const local = resolve(root, '.local');
const base = resolve(process.env.MYSQL_BINARY_DIR || join(local, 'mysql-8.4.13-winx64'));
const executable = join(base, 'bin', process.platform === 'win32' ? 'mysqld.exe' : 'mysqld');
if (!existsSync(executable))
  throw new Error('MySQL portátil não encontrado. Configure MYSQL_BINARY_DIR com a pasta do pacote oficial.');
mkdirSync(local, { recursive: true });
const data = join(local, 'mysql-validation-data');
const secrets = join(local, 'mysql-validation.json');
const config = existsSync(secrets)
  ? JSON.parse(readFileSync(secrets, 'utf8'))
  : { password: randomBytes(32).toString('hex'), configured: false };
if (!existsSync(secrets)) writeFileSync(secrets, JSON.stringify(config), { flag: 'wx', mode: 0o600 });
const port = Number(process.env.TEST_MYSQL_PORT || 33307);
const logPath = join(local, 'mysql-validation.log');
if (!existsSync(join(data, 'mysql'))) {
  if (existsSync(data))
    throw new Error(
      'Diretório de inicialização já existe e será preservado. Confira o log antes de tentar novamente.'
    );
  const log = openSync(logPath, 'a');
  const initialized = spawnSync(
    executable,
    ['--no-defaults', '--initialize-insecure', `--basedir=${base}`, `--datadir=${data}`, '--console'],
    { stdio: ['ignore', log, log], timeout: 120000, windowsHide: true }
  );
  closeSync(log);
  if (initialized.status !== 0)
    throw new Error('Falha ao inicializar MySQL portátil. Veja .local/mysql-validation.log.');
}
const server = spawn(
  executable,
  [
    '--no-defaults',
    `--basedir=${base}`,
    `--datadir=${data}`,
    '--bind-address=127.0.0.1',
    `--port=${port}`,
    '--mysqlx=OFF',
    `--log-error=${logPath}`
  ],
  { stdio: 'ignore', windowsHide: true }
);
let failed;
server.on('error', (error) => {
  failed = error;
});
let connection;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (failed || server.exitCode !== null)
      throw new Error('MySQL não iniciou. Confira o log local e se a porta de teste está livre.');
    try {
      connection = await mysql.createConnection({
        host: '127.0.0.1',
        port,
        user: 'root',
        password: config.configured ? config.password : '',
        connectTimeout: 1000
      });
      break;
    } catch {
      await new Promise((done) => setTimeout(done, 500));
    }
  }
  if (!connection) throw new Error('Tempo limite ao aguardar MySQL portátil.');
  if (!config.configured) {
    await connection.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [config.password]);
    config.configured = true;
    writeFileSync(secrets, JSON.stringify(config), { mode: 0o600 });
  }
  console.log('MySQL Community local pronto, com senha gerada e restrito a 127.0.0.1.');
  const runner = spawn(process.execPath, [fileURLToPath(new URL('./test-mysql.js', import.meta.url))], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    env: {
      ...process.env,
      TEST_MYSQL_HOST: '127.0.0.1',
      TEST_MYSQL_PORT: String(port),
      TEST_MYSQL_USER: 'root',
      TEST_MYSQL_PASSWORD: config.password
    }
  });
  const code = await new Promise((done, reject) => {
    runner.once('error', reject);
    runner.once('exit', done);
  });
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (connection) {
    try {
      await connection.query('SHUTDOWN');
    } catch {
      /* Aceitamos o fechamento da conexão durante o shutdown. */
    }
    await connection.end().catch(() => {});
  }
  if (server.exitCode === null) {
    const exited = new Promise((done) => server.once('exit', done));
    const timeout = setTimeout(() => server.kill(), 10000);
    await exited;
    clearTimeout(timeout);
  }
}
