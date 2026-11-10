import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

test('health funciona sem credenciais ou conexão MySQL', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'plataforma-gestao-integrada-api' });
  assert.equal(response.headers.get('x-powered-by'), null);
});
test('rota desconhecida retorna JSON 404', async () => {
  const response = await fetch(`${base}/api/inexistente`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
});
test('JSON malformado retorna erro 400', async () => {
  const response = await fetch(`${base}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{'
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_JSON');
});
test('origem local recebe cabeçalho CORS configurado', async () => {
  const response = await fetch(`${base}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});
