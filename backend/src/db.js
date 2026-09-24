import pg from 'pg';

const url = process.env.DATABASE_URL || '';
// O Supabase exige conexão com SSL; no Postgres local não precisa
const usarSsl = process.env.DB_SSL === 'true' || url.includes('supabase.co') || url.includes('supabase.com');

export const pool = new pg.Pool({
  connectionString: url,
  ssl: usarSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

// As tabelas ficam no schema "createit". Cada conexão nova recebe
// "SET search_path" uma vez antes de ser usada, seja qual for o usuário.
const prontas = new WeakSet();

export async function conectar() {
  const client = await pool.connect();
  if (!prontas.has(client)) {
    try {
      await client.query('SET search_path TO createit, public');
      prontas.add(client);
    } catch (e) {
      client.release(e);
      throw e;
    }
  }
  return client;
}

export async function query(text, params) {
  const client = await conectar();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
