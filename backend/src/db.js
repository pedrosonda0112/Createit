import mysql from 'mysql2/promise';

// DATABASE_URL no formato mysql://usuario:senha@host:porta/banco
// (Aiven: a porta não é a 3306; copie o "Service URI" do painel e troque o banco para createit)
const url = new URL(process.env.DATABASE_URL || 'mysql://localhost:3306/createit');
const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
// Bancos na nuvem (Aiven etc.) exigem SSL; no MySQL local não precisa.
// Com DB_SSL_CA (conteúdo do ca.pem) a conexão também confere o certificado do servidor.
const usarSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : !local;
const ssl = !usarSsl
  ? undefined
  : process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true }
    : { rejectUnauthorized: false };

export const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, '') || 'createit',
  ssl,
  charset: 'utf8mb4',
  timezone: 'Z',                       // os DATETIME ficam em UTC
  connectionLimit: 5,
  flags: ['+FOUND_ROWS'],              // rowCount = linhas encontradas, como no Postgres
  // BOOLEAN do MySQL é TINYINT(1): devolve true/false para o front-end
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      const v = field.string();
      return v === null ? null : v === '1';
    }
    return next();
  },
});

// O código das rotas escreve $1, $2... (como no Postgres). Aqui vira "?" e os parâmetros
// são repetidos na ordem em que aparecem, porque o mesmo $n pode ser usado mais de uma vez.
function converter(sql, params = []) {
  const valores = [];
  const texto = sql.replace(/\$(\d+)/g, (_, n) => {
    valores.push(params[Number(n) - 1]);
    return '?';
  });
  return [texto, valores];
}

// Devolve { rows, rowCount, insertId } para qualquer tipo de comando
function resultado(r) {
  if (Array.isArray(r)) {
    // CALL devolve [linhas, cabeçalho]; SELECT devolve só as linhas
    const rows = Array.isArray(r[0]) ? r[0] : r;
    return { rows, rowCount: rows.length, insertId: 0 };
  }
  return { rows: [], rowCount: r.affectedRows, insertId: r.insertId };
}

// Conexão própria para transação (BEGIN / COMMIT / ROLLBACK). Lembre de chamar release().
export async function conectar() {
  const conn = await pool.getConnection();
  return {
    async query(sql, params) {
      const [texto, valores] = converter(sql, params);
      const [r] = await conn.query(texto, valores);
      return resultado(r);
    },
    release: () => conn.release(),
  };
}

export async function query(sql, params) {
  const [texto, valores] = converter(sql, params);
  const [r] = await pool.query(texto, valores);
  return resultado(r);
}

// Códigos de erro do MySQL/MariaDB usados nas rotas
export const ERRO = {
  duplicado: (e) => e.errno === 1062,                       // UNIQUE
  checkViolado: (e) => e.errno === 3819 || e.errno === 4025, // CHECK (MySQL 8 / MariaDB)
  fkViolada: (e) => e.errno === 1452,                       // FOREIGN KEY
  regra: (e) => e.errno === 1644,                           // SIGNAL da sp_resgatar
};
