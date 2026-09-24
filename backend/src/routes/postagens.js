import { Router } from 'express';
import { conectar, query } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();

// Feed: "seguindo" = quem eu sigo + eu; "alta" = mais curtidas dos últimos 7 dias
r.get('/feed', auth, async (req, res) => {
  const filtro = req.query.filtro === 'alta' ? 'alta' : 'seguindo';
  const sql = filtro === 'alta'
    ? `SELECT f.*, EXISTS (SELECT 1 FROM curtida c WHERE c.id_postagem = f.id_postagem AND c.id_usuario = $1) AS curtiu
         FROM vw_feed f
        WHERE f.status_validacao <> 'recusada' AND f.data_postagem > now() - interval '7 days'
        ORDER BY f.curtidas DESC, f.data_postagem DESC LIMIT 30`
    : `SELECT f.*, EXISTS (SELECT 1 FROM curtida c WHERE c.id_postagem = f.id_postagem AND c.id_usuario = $1) AS curtiu
         FROM vw_feed f
        WHERE f.status_validacao <> 'recusada'
          AND (f.id_usuario = $1 OR f.id_usuario IN (SELECT id_seguido FROM seguidor WHERE id_seguidor = $1))
        ORDER BY f.data_postagem DESC LIMIT 30`;
  const { rows } = await query(sql, [req.userId]);
  res.json(rows);
});

// Registrar ação. No MVP a validação é automática (depois vira moderação).
// A postagem entra como 'pendente' e o UPDATE para 'validada' dispara o trigger que dá os pontos.
r.post('/', auth, async (req, res) => {
  const { id_categoria, conteudo, id_desafio } = req.body;
  if (!id_categoria || !String(conteudo || '').trim()) {
    return res.status(400).json({ erro: 'Escolha uma categoria e conte o que você fez.' });
  }
  const client = await conectar();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO postagem (id_usuario, id_categoria, id_desafio, conteudo)
       VALUES ($1, $2, $3, $4) RETURNING id_postagem`,
      [req.userId, id_categoria, id_desafio || null, conteudo.trim()]
    );
    await client.query(`UPDATE postagem SET status_validacao = 'validada' WHERE id_postagem = $1`, [rows[0].id_postagem]);
    await client.query('COMMIT');
    const post = await query(`SELECT *, false AS curtiu FROM vw_feed WHERE id_postagem = $1`, [rows[0].id_postagem]);
    const saldo = await query(`SELECT pontos_ecologicos, nivel FROM usuario WHERE id_usuario = $1`, [req.userId]);
    res.status(201).json({ postagem: post.rows[0], ...saldo.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// Curtir / descurtir
r.post('/:id/curtir', auth, async (req, res) => {
  const id = Number(req.params.id);
  const del = await query(`DELETE FROM curtida WHERE id_usuario = $1 AND id_postagem = $2`, [req.userId, id]);
  if (del.rowCount === 0) {
    await query(`INSERT INTO curtida (id_usuario, id_postagem) VALUES ($1, $2)`, [req.userId, id]);
  }
  const { rows } = await query(`SELECT count(*)::int AS curtidas FROM curtida WHERE id_postagem = $1`, [id]);
  res.json({ curtiu: del.rowCount === 0, curtidas: rows[0].curtidas });
});

r.post('/:id/comentarios', auth, async (req, res) => {
  const texto = String(req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'Escreva um comentário.' });
  const { rows } = await query(
    `INSERT INTO comentario (id_usuario, id_postagem, texto) VALUES ($1, $2, $3) RETURNING *`,
    [req.userId, Number(req.params.id), texto.slice(0, 500)]
  );
  res.status(201).json(rows[0]);
});

export default r;
