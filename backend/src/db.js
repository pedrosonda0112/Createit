import pg from 'pg';

const url = process.env.DATABASE_URL || '';
// O Supabase exige conexão com SSL; no Postgres local não precisa
const usarSsl = process.env.DB_SSL === 'true' || url.includes('supabase.co') || url.includes('supabase.com');

// As tabelas ficam no schema "createit". O usuário do banco usado pela API
// (app_createit, criado no 03_seguranca.sql) já tem search_path apontando para ele.
export const pool = new pg.Pool({
  connectionString: url,
  ssl: usarSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

export const query = (text, params) => pool.query(text, params);
