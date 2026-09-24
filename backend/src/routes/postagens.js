import { Router } from 'express';
import { conectar, query } from '../db.js';
import { auth } from '../middleware/auth.js';
import { receberFoto } from '../middleware/foto.js';
import { apagarFoto, enviarFoto, storageConfigurado } from '../storage.js';

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
// Chega como formulário multipart por causa da foto (opcional), que vai para o Supabase Storage.
r.post('/', auth, receberFoto, async (req, res) => {
  const { id_categoria, conteudo, id_desafio } = req.body ?? {};
  if (!id_categoria || !String(conteudo || '').trim()) {
    return res.status(400).json({ erro: 'Escolha uma categoria e conte o que você fez.' });
  }

  let urlFoto = null;
  if (req.file) {
    if (!storageConfigurado()) return res.status(503).json({ erro: 'O envio de fotos ainda não foi configurado no servidor.' });
    try {
      urlFoto = await enviarFoto(`postagens/${req.userId}`, req.file);
    } catch (e) {
      console.error(e);
      return res.status(502).json({ erro: 'Não foi possível enviar a foto agora. Tente de novo.' });
    }
  }

  const client = await conectar();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO postagem (id_usuario, id_categoria, id_desafio, conteudo, url_foto)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_postagem`,
      [req.userId, id_categoria, id_desafio || null, conteudo.trim(), urlFoto]
    );
    await client.query(`UPDATE postagem SET status_validacao = 'validada' WHERE id_postagem = $1`, [rows[0].id_postagem]);
    await client.query('COMMIT');
    const post = await query(`SELECT *, false AS curtiu FROM vw_feed WHERE id_postagem = $1`, [rows[0].id_postagem]);
    const saldo = await query(`SELECT pontos_ecologicos, nivel FROM usuario WHERE id_usuario = $1`, [req.userId]);
    res.status(201).json({ postagem: post.rows[0], ...saldo.rows[0] });
  } catch (e) {
    // A postagem não foi gravada: a foto ficaria órfã no bucket.
    // Vem antes do ROLLBACK para acontecer mesmo se a conexão tiver caído.
    if (urlFoto) apagarFoto(urlFoto).catch((err) => console.error(err));
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// Uma postagem só (tela de comentários)
r.get('/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Essa postagem não existe.' });
  const { rows } = await query(
    `SELECT f.*, EXISTS (SELECT 1 FROM curtida c WHERE c.id_postagem = f.id_postagem AND c.id_usuario = $2) AS curtiu
       FROM vw_feed f WHERE f.id_postagem = $1`,
    [id, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Essa postagem não existe.' });
  res.json(rows[0]);
});

// Apagar a própria postagem. O trigger trg_estornar_pontos (05_apagar_postagem.sql)
// tira os pontos e as conquistas que ela deu; curtidas e comentários saem em cascata.
r.delete('/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Essa postagem não existe.' });
  try {
    const { rows } = await query(
      `DELETE FROM postagem WHERE id_postagem = $1 AND id_usuario = $2 RETURNING url_foto`,
      [id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Essa postagem não existe ou não é sua.' });
    if (rows[0].url_foto) apagarFoto(rows[0].url_foto).catch((err) => console.error(err));
    const saldo = await query(`SELECT pontos_ecologicos, nivel FROM usuario WHERE id_usuario = $1`, [req.userId]);
    res.json(saldo.rows[0]);
  } catch (e) {
    // CHECK (pontos_ecologicos >= 0): os pontos dessa ação já foram gastos
    if (e.code === '23514') {
      return res.status(409).json({ erro: 'Os pontos dessa ação já foram usados em resgates, então ela não pode ser apagada.' });
    }
    throw e;
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

// Comentários da postagem, com o autor de cada um (mais recentes primeiro)
r.get('/:id/comentarios', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Essa postagem não existe.' });
  const { rows } = await query(
    `SELECT c.id_comentario, c.id_usuario, c.texto, c.data_comentario, u.nome, u.usuario
       FROM comentario c JOIN usuario u ON u.id_usuario = c.id_usuario
      WHERE c.id_postagem = $1
      ORDER BY c.data_comentario DESC`,
    [id]
  );
  res.json(rows);
});

r.post('/:id/comentarios', auth, async (req, res) => {
  const id = Number(req.params.id);
  const texto = String(req.body?.texto || '').trim();
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Essa postagem não existe.' });
  if (!texto) return res.status(400).json({ erro: 'Escreva um comentário.' });
  try {
    // Devolve o comentário já com nome e @ do autor, igual à listagem
    const { rows } = await query(
      `WITH novo AS (
         INSERT INTO comentario (id_usuario, id_postagem, texto) VALUES ($1, $2, $3) RETURNING *
       )
       SELECT novo.id_comentario, novo.id_usuario, novo.texto, novo.data_comentario, u.nome, u.usuario
         FROM novo JOIN usuario u ON u.id_usuario = novo.id_usuario`,
      [req.userId, id, texto.slice(0, 500)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23503') return res.status(404).json({ erro: 'Essa postagem não existe mais.' });
    throw e;
  }
});

export default r;
