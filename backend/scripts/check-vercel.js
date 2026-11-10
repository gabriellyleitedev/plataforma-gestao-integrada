import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const child = spawn(process.execPath, ['--test', 'test/management.test.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit',
  env: { ...process.env, RUN_MYSQL_TEST: '0', RUN_VERCEL_TEST: '1', NODE_ENV: 'test', DB_DRIVER: 'sqlite', SQLITE_PATH: ':memory:' }
});
child.on('error', () => { console.error('Não conseguimos iniciar o teste da função Vercel.'); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
