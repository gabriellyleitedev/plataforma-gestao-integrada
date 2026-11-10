import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';

if (process.env.RUN_MYSQL_TEST === '1') {
  if (!/^pgi_test_[a-f0-9]{24}$/.test(process.env.DB_NAME || '')) throw new Error('Teste MySQL exige banco temporário criado pelo runner.');
  process.env.DB_DRIVER = 'mysql';
} else {
  process.env.DB_DRIVER = 'sqlite';
  process.env.SQLITE_PATH = ':memory:';
}
const { app } = await import('../src/app.js');
const handler = process.env.RUN_VERCEL_TEST === '1' ? (await import('../../frontend/api/[...path].js')).default : app;
const { one } = await import('../src/database/store.js');
const { closePool } = await import('../src/database/pool.js');
let server;
let base;
let token;
const password = randomBytes(18).toString('hex');
before(async () => {
  server = createServer(handler).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { await new Promise((resolve) => server.close(resolve)); await closePool(); });
async function request(path, method = 'GET', body, auth = token, expected = 200) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}

test('fluxo integrado de gestão com banco isolado', async (t) => {
  let client, category, supplier, product, service, sale, operatorToken;
  await t.test('primeiro administrador e autenticação sem senha padrão', async () => {
    assert.equal((await request('/setup')).needsSetup, true);
    await request('/setup', 'POST', { name: 'Administrador de teste', email: 'admin@example.test', password }, null, 201);
    await request('/setup', 'POST', { name: 'Outro', email: 'other@example.test', password }, null, 409);
    await request('/auth/login', 'POST', { email: 'admin@example.test', password: 'incorreta' }, null, 401);
    const session = await request('/auth/login', 'POST', { email: 'admin@example.test', password }, null);
    token = session.token;
    assert.equal(session.user.role, 'admin');
    assert.equal((await request('/auth/me')).email, 'admin@example.test');
    const stored = await one('SELECT password_hash FROM users WHERE id = 1');
    assert.notEqual(stored.password_hash, password);
    await request('/clients', 'GET', undefined, null, 401);
  });
  await t.test('cadastros relacionados e validação de campos', async () => {
    await request('/clients', 'POST', { name: '' }, token, 400);
    client = await request('/clients', 'POST', { name: 'Cliente de teste', email: 'client@example.test', phone: '123', notes: 'Anotação de teste' }, token, 201);
    category = await request('/categories', 'POST', { name: 'Categoria de teste' }, token, 201);
    supplier = await request('/suppliers', 'POST', { name: 'Fornecedor de teste' }, token, 201);
    product = await request('/items', 'POST', { name: 'Produto de teste', type: 'product', price_cents: 2500, cost_cents: 1000, category_id: category.id, supplier_id: supplier.id, stock_minimum: 2 }, token, 201);
    service = await request('/items', 'POST', { name: 'Serviço de teste', type: 'service', price_cents: 5000, cost_cents: 2000 }, token, 201);
    await request('/items', 'POST', { name: 'Preço inválido', type: 'product', price_cents: -1 }, token, 400);
    await request('/items', 'POST', { name: 'Referência inválida', type: 'product', price_cents: 1, category_id: 999 }, token, 400);
    const edited = await request(`/clients/${client.id}`, 'PUT', { ...client, name: 'Cliente atualizado' });
    assert.equal(edited.name, 'Cliente atualizado');
  });
  await t.test('estoque: entradas, saídas, ajustes e rejeição de saldo negativo', async () => {
    await request('/stock/movements', 'POST', { item_id: service.id, type: 'entry', quantity: 1, reason: 'Teste' }, token, 400);
    await request('/stock/movements', 'POST', { item_id: product.id, type: 'entry', quantity: 10, reason: 'Entrada de teste' }, token, 201);
    await request('/stock/movements', 'POST', { item_id: product.id, type: 'exit', quantity: 11, reason: 'Sem saldo' }, token, 409);
    await request('/stock/movements', 'POST', { item_id: product.id, type: 'exit', quantity: 1, reason: 'Saída de teste' }, token, 201);
    await request('/stock/movements', 'POST', { item_id: product.id, type: 'adjustment', quantity: 10, reason: 'Contagem' }, token, 201);
    assert.equal((await request('/items')).find((item) => item.id === product.id).stock, 10);
  });
  await t.test('venda mista usa preço do servidor, baixa produto e preserva serviço', async () => {
    sale = await request('/sales', 'POST', { client_id: client.id, payment_method: 'pix', total_cents: 1, items: [{ item_id: product.id, quantity: 2, price_cents: 1 }, { item_id: service.id, quantity: 1 }] }, token, 201);
    assert.equal(sale.total_cents, 10000);
    const items = await request('/items');
    assert.equal(items.find((item) => item.id === product.id).stock, 8);
    assert.equal(items.find((item) => item.id === service.id).stock, 0);
    const movements = await request('/stock/movements');
    assert.equal(movements.filter((row) => row.sale_id === sale.id).length, 1);
  });
  await t.test('venda inválida não deixa registros ou movimentos parciais', async () => {
    const before = (await request('/sales')).length;
    await request('/sales', 'POST', { payment_method: 'pix', items: [{ item_id: service.id, quantity: 1 }, { item_id: product.id, quantity: 100 }] }, token, 409);
    assert.equal((await request('/sales')).length, before);
    await request('/sales', 'POST', { payment_method: 'pix', items: [{ item_id: product.id, quantity: 1 }, { item_id: product.id, quantity: 1 }] }, token, 400);
  });
  await t.test('indicadores e relatório calculam vendas e margem reais', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const report = await request(`/reports?from=${today}&to=${today}`);
    assert.equal(report.revenue_cents, 10000);
    assert.equal(report.sales_count, 1);
    assert.equal(report.margin_cents, 6000);
    assert.equal(report.stock_value_cents, 8000);
    await request('/reports?from=2026-99-99&to=2026-99-99', 'GET', undefined, token, 400);
  });
  await t.test('atendimento pode ser criado e concluído', async () => {
    const appointment = await request('/appointments', 'POST', { client_id: client.id, subject: 'Atendimento de teste', scheduled_at: new Date().toISOString() }, token, 201);
    await request(`/appointments/${appointment.id}`, 'PUT', { ...appointment, status: 'completed' });
    assert.equal((await request('/appointments'))[0].status, 'completed');
  });
  await t.test('perfis restringem gestão de usuários, catálogo e estoque', async () => {
    await request('/users', 'POST', { name: 'Operador de teste', email: 'operator@example.test', password, role: 'operator' }, token, 201);
    operatorToken = (await request('/auth/login', 'POST', { email: 'operator@example.test', password }, null)).token;
    await request('/users', 'GET', undefined, operatorToken, 403);
    await request('/items', 'POST', { name: 'Sem permissão', type: 'product', price_cents: 1 }, operatorToken, 403);
    await request('/stock/movements', 'POST', { item_id: product.id, type: 'entry', quantity: 1, reason: 'Teste' }, operatorToken, 403);
    await request('/clients', 'POST', { name: 'Cliente do operador' }, operatorToken, 201);
    await request(`/users/1`, 'PUT', { name: 'Admin', email: 'admin@example.test', role: 'operator', active: true }, token, 400);
  });
  await t.test('cancelamento devolve estoque uma vez e remove faturamento', async () => {
    await request(`/sales/${sale.id}/cancel`, 'POST', { reason: 'Teste' }, operatorToken, 403);
    await request(`/sales/${sale.id}/cancel`, 'POST', { reason: 'Desistência de teste' });
    await request(`/sales/${sale.id}/cancel`, 'POST', { reason: 'Repetição' }, token, 409);
    assert.equal((await request('/items')).find((item) => item.id === product.id).stock, 10);
    const today = new Date().toISOString().slice(0, 10);
    assert.equal((await request(`/reports?from=${today}&to=${today}`)).revenue_cents, 0);
  });
  await t.test('concorrência não permite vender mais que o saldo', async () => {
    await request('/stock/movements', 'POST', { item_id: product.id, type: 'adjustment', quantity: 1, reason: 'Contagem de teste' }, token, 201);
    const responses = await Promise.all([1, 2].map(() => fetch(`${base}/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ payment_method: 'cash', items: [{ item_id: product.id, quantity: 1 }] }) })));
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await request('/items')).find((item) => item.id === product.id).stock, 0);
  });
  await t.test('arquivamento preserva histórico e impede nova venda', async () => {
    await request(`/items/${product.id}`, 'DELETE');
    assert.equal((await request('/items')).some((item) => item.id === product.id), false);
    await request('/sales', 'POST', { payment_method: 'pix', items: [{ item_id: product.id, quantity: 1 }] }, token, 400);
    assert.equal((await request(`/sales/${sale.id}`)).items.length, 2);
    await request(`/clients/${client.id}`, 'DELETE');
    assert.equal((await request(`/sales/${sale.id}`)).client_name, 'Cliente atualizado');
  });
  await t.test('logout invalida a sessão no servidor', async () => {
    await request('/auth/logout', 'POST', undefined, operatorToken);
    await request('/clients', 'GET', undefined, operatorToken, 401);
  });
  await t.test('troca de senha exige senha atual e preserva espaços da nova senha', async () => {
    const newPassword = ` ${randomBytes(16).toString('hex')} `;
    await request('/auth/password', 'PUT', { current_password: 'incorreta', password: newPassword }, token, 400);
    await request('/auth/password', 'PUT', { current_password: password, password: newPassword });
    await request('/clients', 'GET', undefined, token, 401);
    await request('/auth/login', 'POST', { email: 'admin@example.test', password }, null, 401);
    const updated = await request('/auth/login', 'POST', { email: 'admin@example.test', password: newPassword }, null);
    token = updated.token;
    assert.equal(updated.user.role, 'admin');
  });
});
