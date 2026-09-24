import { Router } from 'express';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();

r.get('/categorias', async (_req, res) => {
  const { rows } = await query(`SELECT * FROM categoria_acao ORDER BY id_categoria`);
  res.json(rows);
});

r.get('/ranking', auth, async (_req, res) => {
  const { rows } = await query(`SELECT * FROM vw_ranking ORDER BY posicao LIMIT 10`);
  res.json(rows);
});

// Desafios ativos com o progresso do usuário logado
r.get('/desafios', auth, async (req, res) => {
  const { rows } = await query(
    `SELECT d.*, p.razao_social AS patrocinador, c.nome AS categoria,
            (SELECT count(*)::int FROM postagem po
              WHERE po.id_desafio = d.id_desafio AND po.id_usuario = $1 AND po.status_validacao = 'validada') AS progresso,
            (SELECT count(DISTINCT po.id_usuario)::int FROM postagem po WHERE po.id_desafio = d.id_desafio) AS participantes
       FROM desafio d
       JOIN categoria_acao c ON c.id_categoria = d.id_categoria
       LEFT JOIN patrocinador p ON p.id_patrocinador = d.id_patrocinador
      WHERE CURRENT_DATE BETWEEN d.data_inicio AND d.data_fim
      ORDER BY d.pontos_bonus DESC`,
    [req.userId]
  );
  res.json(rows);
});

r.get('/recompensas', auth, async (_req, res) => {
  const { rows } = await query(
    `SELECT r.*, p.razao_social AS patrocinador, p.localizacao
       FROM recompensa r JOIN patrocinador p ON p.id_patrocinador = r.id_patrocinador
      WHERE r.validade >= CURRENT_DATE
      ORDER BY r.custo_pontos`
  );
  res.json(rows);
});

// Resgate: toda a regra está na função fn_resgatar (transação no banco)
r.post('/recompensas/:id/resgatar', auth, async (req, res) => {
  try {
    const { rows } = await query(`SELECT fn_resgatar($1, $2) AS codigo`, [req.userId, Number(req.params.id)]);
    const saldo = await query(`SELECT pontos_ecologicos FROM usuario WHERE id_usuario = $1`, [req.userId]);
    res.json({ codigo: rows[0].codigo, pontos_ecologicos: saldo.rows[0].pontos_ecologicos });
  } catch (e) {
    if (e.code === 'P0001') return res.status(400).json({ erro: e.message });
    throw e;
  }
});

r.get('/resgates', auth, async (req, res) => {
  const { rows } = await query(
    `SELECT rg.*, r.titulo, p.razao_social AS patrocinador
       FROM resgate rg JOIN recompensa r ON r.id_recompensa = rg.id_recompensa
       JOIN patrocinador p ON p.id_patrocinador = r.id_patrocinador
      WHERE rg.id_usuario = $1 ORDER BY rg.data_resgate DESC`,
    [req.userId]
  );
  res.json(rows);
});

// Busca simples por pessoas, ações e recompensas
r.get('/busca', auth, async (req, res) => {
  const termo = `%${String(req.query.q || '').trim()}%`;
  const [pessoas, acoes, recompensas] = await Promise.all([
    query(`SELECT u.id_usuario, u.nome, u.usuario, u.pontos_ecologicos,
                  EXISTS (SELECT 1 FROM seguidor s WHERE s.id_seguidor = $2 AND s.id_seguido = u.id_usuario) AS seguindo
             FROM usuario u WHERE (u.nome ILIKE $1 OR u.usuario ILIKE $1) AND u.id_usuario <> $2 LIMIT 6`, [termo, req.userId]),
    query(`SELECT *, false AS curtiu FROM vw_feed WHERE conteudo ILIKE $1 OR categoria ILIKE $1 ORDER BY data_postagem DESC LIMIT 6`, [termo]),
    query(`SELECT r.*, p.razao_social AS patrocinador, p.localizacao FROM recompensa r
             JOIN patrocinador p ON p.id_patrocinador = r.id_patrocinador
            WHERE r.titulo ILIKE $1 OR p.razao_social ILIKE $1 LIMIT 6`, [termo]),
  ]);
  res.json({ pessoas: pessoas.rows, acoes: acoes.rows, recompensas: recompensas.rows });
});

export default r;
