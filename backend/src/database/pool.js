import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';

let pool;
export function getPool() {
  if (!pool) {
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Configuração MySQL incompleta: ${missing.join(', ')}`);
    const ssl = process.env.DB_SSL === 'true';
    const ca = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replaceAll('\\n', '\n') : process.env.DB_SSL_CA_PATH ? readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') : undefined;
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
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
