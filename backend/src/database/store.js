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
      sqlite.exec(
        schema
          .replaceAll('INT PRIMARY KEY AUTO_INCREMENT', 'INTEGER PRIMARY KEY AUTOINCREMENT')
          .replace('INSERT IGNORE INTO', 'INSERT OR IGNORE INTO')
      );
    } else {
      for (const statement of schema
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean))
        await getPool().query(statement);
    }
  })();
  try {
    await initialized;
  } catch (error) {
    initialized = undefined;
    throw error;
  }
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
