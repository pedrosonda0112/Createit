import { Router } from 'express';
import { conectar, query } from '../db.js';
import { auth, soAdmin } from '../middleware/auth.js';
import { apagarFoto } from '../storage.js';

// Painel de administração: tudo aqui exige login de admin (usuario.admin, ver 07_admin.sql)
const r = Router();
r.use(auth, soAdmin);

const CAMPOS = 'id_usuario, nome, usuario, email, bio, cidade, pontos_ecologicos, nivel, admin, data_cadastro';

// Usuários: busca por nome, @ ou e-mail (os mais novos primeiro)
r.get('/usuarios', async (req, res) => {
  const q = String(req.query.q || '').trim().replace(/^@/, '');
  const { rows } = await query(
    `SELECT ${CAMPOS},
            (SELECT count(*)::int FROM postagem p WHERE p.id_usuario = u.id_usuario) AS postagens
       FROM usuario u
      WHERE $1 = '' OR u.nome ILIKE '%' || $1 || '%' OR u.usuario ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'
      ORDER BY u.admin DESC, u.data_cadastro DESC
      LIMIT 50`,
    [q]
  );
  res.json(rows);
});

r.get('/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  const { rows } = await query(`SELECT ${CAMPOS} FROM usuario WHERE id_usuario = $1`, [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(rows[0]);
});

// Editar qualquer usuário, inclusive pontos, nível e se é admin
r.put('/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  const nome = String(b.nome || '').trim();
  const usuario = String(b.usuario || '').trim().replace(/^@/, '').toLowerCase();
  const email = String(b.email || '').trim().toLowerCase();
  const bio = String(b.bio || '').trim();
  const cidade = String(b.cidade || '').trim();
  const pontos = Number(b.pontos_ecologicos);
  const nivel = Number(b.nivel);
  const admin = b.admin === true;

  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (!nome || nome.length > 120) return res.status(400).json({ erro: 'O nome é obrigatório e pode ter até 120 caracteres.' });
  if (!/^[a-z0-9._]{3,40}$/.test(usuario)) {
    return res.status(400).json({ erro: 'O @ precisa ter de 3 a 40 caracteres: letras, números, ponto ou _.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return res.status(400).json({ erro: 'Confira o e-mail.' });
  if (bio.length > 280) return res.status(400).json({ erro: 'A bio pode ter no máximo 280 caracteres.' });
  if (cidade.length > 80) return res.status(400).json({ erro: 'A cidade pode ter no máximo 80 caracteres.' });
  if (!Number.isInteger(pontos) || pontos < 0) return res.status(400).json({ erro: 'Os pontos precisam ser um número inteiro, 0 ou mais.' });
  if (!Number.isInteger(nivel) || nivel < 1) return res.status(400).json({ erro: 'O nível precisa ser um número inteiro, 1 ou mais.' });
  // Sem isso um admin poderia se trancar fora do painel
  if (id === req.userId && !admin) return res.status(400).json({ erro: 'Você não pode tirar o seu próprio acesso de admin.' });

  try {
    const { rows } = await query(
      `UPDATE usuario
          SET nome = $1, usuario = $2, email = $3, bio = $4, cidade = $5, pontos_ecologicos = $6, nivel = $7, admin = $8
        WHERE id_usuario = $9
        RETURNING ${CAMPOS}`,
      [nome, usuario, email, bio || null, cidade || null, pontos, nivel, admin, id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe outra conta com esse @ ou e-mail.' });
    throw e;
  }
});

// Apagar a conta: postagens, comentários, curtidas, seguidores, conquistas e resgates
// saem em cascata (ON DELETE CASCADE). Não dá para desfazer.
r.delete('/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (id === req.userId) return res.status(400).json({ erro: 'Você não pode apagar a sua própria conta pelo painel.' });

  const client = await conectar();
  let fotos;
  try {
    await client.query('BEGIN');
    // Moderação: o estorno das postagens apagadas em cascata não esbarra no saldo
    await client.query(`SET LOCAL createit.moderacao = 'on'`);
    fotos = await client.query(`SELECT url_foto FROM postagem WHERE id_usuario = $1 AND url_foto IS NOT NULL`, [id]);
    const { rowCount } = await client.query(`DELETE FROM usuario WHERE id_usuario = $1`, [id]);
    await client.query('COMMIT');
    if (!rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  // As fotos ficam no Storage, fora do banco: apaga depois do COMMIT
  for (const { url_foto } of fotos.rows) apagarFoto(url_foto).catch((err) => console.error(err));
  res.json({ ok: true });
});

export default r;
