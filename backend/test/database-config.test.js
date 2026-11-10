import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseOptions } from '../src/config/database.js';

test('aceitamos a URI MySQL com usuário e senha codificados', () => {
  assert.deepEqual(databaseOptions({ DATABASE_URL: 'mysql://test%40user:pass%3Aword@127.0.0.1:33307/test_database' }), {
    host: '127.0.0.1', port: 33307, database: 'test_database', user: 'test@user', password: 'pass:word'
  });
});
test('mantemos a configuração com variáveis separadas', () => {
  assert.equal(databaseOptions({ DB_HOST: 'localhost', DB_USER: 'test', DB_NAME: 'test_database' }).port, 3306);
});
test('recusamos URI de outro banco ou porta inválida', () => {
  assert.throws(() => databaseOptions({ DATABASE_URL: 'postgres://user:pass@localhost/test_database' }), /MySQL/);
  assert.throws(() => databaseOptions({ DB_HOST: 'localhost', DB_USER: 'test', DB_NAME: 'test_database', DB_PORT: 'abc' }), /Porta/);
});
