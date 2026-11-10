import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { databaseOptions } from '../config/database.js';

let pool;
export function getPool() {
  if (!pool) {
    const options = databaseOptions();
    const ssl = process.env.DB_SSL === 'true';
    const ca = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replaceAll('\\n', '\n') : process.env.DB_SSL_CA_PATH ? readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') : undefined;
    pool = mysql.createPool({
      ...options,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 20,
      connectTimeout: 10000,
      charset: 'utf8mb4',
      ...(ssl ? { ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) } } : {})
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) { await pool.end(); pool = undefined; }
}
