import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('dados persistem entre processos sem tocar no banco do usuário', () => {
  const folder = mkdtempSync(join(tmpdir(), 'pgi-persistence-'));
  const database = join(folder, 'test.sqlite');
  const moduleUrl = new URL('../src/database/store.js', import.meta.url).href;
  const run = (source) => spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    env: { ...process.env, NODE_ENV: 'test', DB_DRIVER: 'sqlite', SQLITE_PATH: database }, encoding: 'utf8', timeout: 15000
  });
  try {
    const created = run(`const { insert } = await import(${JSON.stringify(moduleUrl)}); await insert('categories', { name: 'Teste de persistência', description: '', created_at: new Date().toISOString() });`);
    assert.equal(created.status, 0, created.stderr);
    const restarted = run(`const { one } = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify(await one('SELECT name FROM categories LIMIT 1')));`);
    assert.equal(restarted.status, 0, restarted.stderr);
    assert.equal(JSON.parse(restarted.stdout).name, 'Teste de persistência');
  } finally {
    for (const suffix of ['', '-shm', '-wal']) if (existsSync(database + suffix)) unlinkSync(database + suffix);
    rmdirSync(folder);
  }
});
