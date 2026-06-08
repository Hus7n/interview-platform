import { Pool } from 'pg';
import { env } from './config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

export async function query<T>(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result;
}
