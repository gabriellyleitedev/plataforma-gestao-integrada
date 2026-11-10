import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getPool } from './pool.js';

const backendDir = fileURLToPath(new URL('../../', import.meta.url));
export const driver = process.env.DB_DRIVER || (process.env.NODE_ENV === 'production' ? 'mysql' : 'sqlite');
if (!['mysql', 'sqlite'].includes(driver)) throw new Error('DB_DRIVER deve ser mysql ou sqlite.');
if (process.env.NODE_ENV === 'production' && driver !== 'mysql') throw new Error('Produção exige MySQL.');
const context = new AsyncLocalStorage();
let sqlite;
let initialized;
let queue = Promise.resolve();

function serialize(work) {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
}

export async function initializeStore() {
  if (initialized) return initialized;
  initialized = (async () => {
    const schema = readFileSync(
      new URL('../../../database/migrations/001-schema.mysql.sql', import.meta.url),
      'utf8'
    );
    if (driver === 'sqlite') {
      const path =
        process.env.SQLITE_PATH === ':memory:'
          ? ':memory:'
          : resolve(backendDir, process.env.SQLITE_PATH || 'data/platform.sqlite');
      if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
      sqlite = new DatabaseSync(path);
      sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
      sqlite.exec(schema.replaceAll('INT PRIMARY KEY AUTO_INCREMENT', 'INTEGER PRIMARY KEY AUTOINCREMENT'));
    } else {
      for (const statement of schema
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean))
        await getPool().query(statement);
    }
    await migrateCompanies();
  })();
  try {
    await initialized;
  } catch (error) {
    initialized = undefined;
    throw error;
  }
}

const tenantTables = [
  'users',
  'clients',
  'categories',
  'suppliers',
  'items',
  'sales',
  'stock_movements',
  'appointments'
];

async function raw(sql, values = []) {
  if (driver === 'sqlite') return sqlite.prepare(sql).all(...values);
  const [rows] = await getPool().query(sql, values);
  return rows;
}

async function hasColumn(table, column) {
  if (driver === 'sqlite')
    return (await raw(`PRAGMA table_info(${table})`)).some((row) => row.name === column);
  const rows = await raw(
    'SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    [table, column]
  );
  return Number(rows[0].total) > 0;
}

async function migrateCompanies() {
  let migrated = false;
  for (const table of tenantTables) {
    if (await hasColumn(table, 'company_id')) continue;
    const statement = `ALTER TABLE ${table} ADD COLUMN company_id INT NOT NULL DEFAULT 1`;
    if (driver === 'sqlite') sqlite.exec(statement);
    else await getPool().query(statement);
    migrated = true;
  }
  if (!migrated || !(await raw('SELECT id FROM users LIMIT 1')).length) return;
  if ((await raw('SELECT id FROM companies WHERE id = 1')).length) return;
  const statement = 'INSERT INTO companies (id, name, created_at) VALUES (1, ?, ?)';
  const values = ['Meu negócio', new Date().toISOString()];
  if (driver === 'sqlite') sqlite.prepare(statement).run(...values);
  else await getPool().query(statement, values);
}

async function execute(sql, values = []) {
  const current = context.getStore();
  if (driver === 'mysql') {
    const [result] = await (current || getPool()).execute(sql, values);
    return {
      rows: Array.isArray(result) ? result : [],
      insertId: result.insertId,
      changes: result.affectedRows
    };
  }
  const statement = sqlite.prepare(sql);
  if (/^\s*(SELECT|WITH|PRAGMA)/i.test(sql)) return { rows: statement.all(...values) };
  const result = statement.run(...values);
  return { rows: [], insertId: Number(result.lastInsertRowid), changes: Number(result.changes) };
}

export async function query(sql, values = []) {
  await initializeStore();
  if (driver === 'sqlite' && !context.getStore()) return serialize(() => execute(sql, values));
  return execute(sql, values);
}

export async function transaction(work) {
  await initializeStore();
  if (context.getStore()) return work();
  if (driver === 'sqlite')
    return serialize(() =>
      context.run(true, async () => {
        sqlite.exec('BEGIN IMMEDIATE');
        try {
          const result = await work();
          sqlite.exec('COMMIT');
          return result;
        } catch (error) {
          sqlite.exec('ROLLBACK');
          throw error;
        }
      })
    );
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await context.run(connection, work);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export const lock = driver === 'mysql' ? ' FOR UPDATE' : '';
export async function one(sql, values = []) {
  return (await query(sql, values)).rows[0];
}
export async function insert(table, fields) {
  const keys = Object.keys(fields);
  const result = await query(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(fields)
  );
  return result.insertId;
}
