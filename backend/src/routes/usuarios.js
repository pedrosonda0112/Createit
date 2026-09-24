import { Router } from 'express';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();

// Perfil completo: dados, números, conquistas, impacto e histórico de pontos
r.get('/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    `SELECT u.id_usuario, u.nome, u.usuario, u.bio, u.cidade, u.pontos_ecologicos, u.nivel,
            (SELECT count(*)::int FROM postagem p WHERE p.id_usuario = u.id_usuario AND p.status_validacao = 'validada') AS acoes,
            (SELECT count(*)::int FROM seguidor s WHERE s.id_seguido = u.id_usuario)  AS seguidores,
            (SELECT count(*)::int FROM seguidor s WHERE s.id_seguidor = u.id_usuario) AS seguindo,
            EXISTS (SELECT 1 FROM seguidor s WHERE s.id_seguidor = $2 AND s.id_seguido = u.id_usuario) AS eu_sigo
       FROM usuario u WHERE u.id_usuario = $1`,
    [id, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const [conquistas, impacto, historico, postagens] = await Promise.all([
    query(`SELECT c.*, uc.data_obtencao FROM conquista c
             LEFT JOIN usuario_conquista uc ON uc.id_conquista = c.id_conquista AND uc.id_usuario = $1
            ORDER BY uc.data_obtencao NULLS LAST, c.id_conquista`, [id]),
    query(`SELECT * FROM vw_impacto_categoria WHERE id_usuario = $1 ORDER BY acoes DESC`, [id]),
    query(`SELECT * FROM (
             SELECT 'acao' AS tipo, conteudo AS descricao, pontos_gerados AS pontos, data_postagem AS data
               FROM postagem WHERE id_usuario = $1 AND status_validacao = 'validada'
             UNION ALL
             SELECT 'resgate', r.titulo, -rg.pontos_gastos, rg.data_resgate
               FROM resgate rg JOIN recompensa r ON r.id_recompensa = rg.id_recompensa WHERE rg.id_usuario = $1
           ) h ORDER BY data DESC LIMIT 6`, [id]),
    query(`SELECT f.*, EXISTS (SELECT 1 FROM curtida c WHERE c.id_postagem = f.id_postagem AND c.id_usuario = $2) AS curtiu
             FROM vw_feed f WHERE f.id_usuario = $1 ORDER BY f.data_postagem DESC LIMIT 20`, [id, req.userId]),
  ]);

  res.json({ ...rows[0], conquistas: conquistas.rows, impacto: impacto.rows, historico: historico.rows, postagens: postagens.rows });
});

r.post('/:id/seguir', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.userId) return res.status(400).json({ erro: 'Você não pode seguir a si mesmo.' });
  const del = await query(`DELETE FROM seguidor WHERE id_seguidor = $1 AND id_seguido = $2`, [req.userId, id]);
  if (del.rowCount === 0) await query(`INSERT INTO seguidor (id_seguidor, id_seguido) VALUES ($1, $2)`, [req.userId, id]);
  res.json({ seguindo: del.rowCount === 0 });
});

export default r;
