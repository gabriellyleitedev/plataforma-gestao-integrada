import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

test('dados persistem entre processos sem tocar no banco do usuário', () => {
  const folder = mkdtempSync(join(tmpdir(), 'pgi-persistence-'));
  const database = join(folder, 'test.sqlite');
  const moduleUrl = new URL('../src/database/store.js', import.meta.url).href;
  const run = (source) =>
    spawnSync(process.execPath, ['--input-type=module', '-e', source], {
      env: { ...process.env, NODE_ENV: 'test', DB_DRIVER: 'sqlite', SQLITE_PATH: database },
      encoding: 'utf8',
      timeout: 15000
    });
  try {
    const created = run(
      `const { insert } = await import(${JSON.stringify(moduleUrl)}); await insert('categories', { company_id: 1, name: 'Teste de persistência', description: '', created_at: new Date().toISOString() });`
    );
    assert.equal(created.status, 0, created.stderr);
    const restarted = run(
      `const { one } = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify(await one('SELECT name FROM categories LIMIT 1')));`
    );
    assert.equal(restarted.status, 0, restarted.stderr);
    assert.equal(JSON.parse(restarted.stdout).name, 'Teste de persistência');
  } finally {
    for (const suffix of ['', '-shm', '-wal'])
      if (existsSync(database + suffix)) unlinkSync(database + suffix);
    rmdirSync(folder);
  }
});

test('banco anterior ao multiempresa recebe o primeiro negócio sem perder dados', () => {
  const folder = mkdtempSync(join(tmpdir(), 'pgi-migration-'));
  const database = join(folder, 'legacy.sqlite');
  const moduleUrl = new URL('../src/database/store.js', import.meta.url).href;
  const legacy = new DatabaseSync(database);
  legacy.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(160) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, active INT NOT NULL DEFAULT 1, created_at VARCHAR(30) NOT NULL);
    CREATE TABLE clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(160) NOT NULL, email VARCHAR(190) NOT NULL DEFAULT '',
      phone VARCHAR(40) NOT NULL DEFAULT '', document VARCHAR(40) NOT NULL DEFAULT '', notes TEXT NOT NULL,
      archived INT NOT NULL DEFAULT 0, created_at VARCHAR(30) NOT NULL);
    INSERT INTO users (name, email, password_hash, role, created_at) VALUES ('Antiga', 'antiga@example.test', 'x:y', 'admin', '2026-01-01');
    INSERT INTO clients (name, notes, created_at) VALUES ('Cliente antigo', '', '2026-01-01');
  `);
  legacy.close();
  try {
    const migrated = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const { one } = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify({ company: await one('SELECT * FROM companies'), user: await one('SELECT company_id FROM users'), client: await one('SELECT company_id FROM clients') }));`
      ],
      {
        env: { ...process.env, NODE_ENV: 'test', DB_DRIVER: 'sqlite', SQLITE_PATH: database },
        encoding: 'utf8',
        timeout: 15000
      }
    );
    assert.equal(migrated.status, 0, migrated.stderr);
    const result = JSON.parse(migrated.stdout);
    assert.equal(result.company.id, 1);
    assert.equal(result.user.company_id, 1);
    assert.equal(result.client.company_id, 1);
  } finally {
    for (const suffix of ['', '-shm', '-wal'])
      if (existsSync(database + suffix)) unlinkSync(database + suffix);
    rmdirSync(folder);
  }
});
