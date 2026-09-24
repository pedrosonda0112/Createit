import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c search_path=createit',
});

export const query = (text, params) => pool.query(text, params);
