import { Router } from 'express';
import { conectar, query, ERRO } from '../db.js';
import { auth, soAdmin } from '../middleware/auth.js';
import { apagarFoto } from '../storage.js';

// Painel de administração: tudo aqui exige login de admin (usuario.admin, ver 07_admin.sql)
const r = Router();
r.use(auth, soAdmin);

const CAMPOS = `id_usuario, nome, usuario, email, bio, cidade, pontos_ecologicos, nivel, admin, data_cadastro, id_patrocinador,
                (SELECT razao_social FROM patrocinador pt WHERE pt.id_patrocinador = u.id_patrocinador) AS patrocinador`;

// Usuários: busca por nome, @ ou e-mail (os mais novos primeiro)
r.get('/usuarios', async (req, res) => {
  const q = String(req.query.q || '').trim().replace(/^@/, '');
  const { rows } = await query(
    `SELECT ${CAMPOS},
            (SELECT count(*) FROM postagem p WHERE p.id_usuario = u.id_usuario) AS postagens
       FROM usuario u
      WHERE $1 = '' OR u.nome LIKE CONCAT('%', $1, '%') OR u.usuario LIKE CONCAT('%', $1, '%') OR u.email LIKE CONCAT('%', $1, '%')
      ORDER BY u.admin DESC, u.data_cadastro DESC
      LIMIT 50`,
    [q]
  );
  res.json(rows);
});

r.get('/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  const { rows } = await query(`SELECT ${CAMPOS} FROM usuario u WHERE id_usuario = $1`, [id]);
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
  const idPatrocinador = b.id_patrocinador === null || b.id_patrocinador === '' || b.id_patrocinador === undefined
    ? null : Number(b.id_patrocinador);

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
  if (idPatrocinador !== null && !Number.isInteger(idPatrocinador)) return res.status(400).json({ erro: 'Escolha um patrocinador da lista.' });
  // Sem isso um admin poderia se trancar fora do painel
  if (id === req.userId && !admin) return res.status(400).json({ erro: 'Você não pode tirar o seu próprio acesso de admin.' });

  try {
    const upd = await query(
      `UPDATE usuario
          SET nome = $1, usuario = $2, email = $3, bio = $4, cidade = $5, pontos_ecologicos = $6, nivel = $7, admin = $8,
              id_patrocinador = $9
        WHERE id_usuario = $10`,
      [nome, usuario, email, bio || null, cidade || null, pontos, nivel, admin, idPatrocinador, id]
    );
    if (!upd.rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    const { rows } = await query(`SELECT ${CAMPOS} FROM usuario u WHERE id_usuario = $1`, [id]);
    res.json(rows[0]);
  } catch (e) {
    if (ERRO.duplicado(e)) return res.status(409).json({ erro: 'Já existe outra conta com esse @ ou e-mail.' });
    if (ERRO.fkViolada(e)) return res.status(400).json({ erro: 'Esse patrocinador não existe mais.' });
    throw e;
  }
});

// Empresas parceiras: lista (com quantas contas cada uma tem) e cadastro de uma nova
r.get('/patrocinadores', async (_req, res) => {
  const { rows } = await query(
    `SELECT pt.*, CAST((SELECT COUNT(*) FROM usuario u WHERE u.id_patrocinador = pt.id_patrocinador) AS SIGNED) AS contas
       FROM patrocinador pt ORDER BY pt.razao_social`
  );
  res.json(rows);
});

r.post('/patrocinadores', async (req, res) => {
  const b = req.body ?? {};
  const razao = String(b.razao_social || '').trim();
  const cnpj = String(b.cnpj || '').replace(/\D/g, '');
  const porte = String(b.porte || '');
  const localizacao = String(b.localizacao || '').trim();
  if (razao.length < 2 || razao.length > 120) return res.status(400).json({ erro: 'A razão social precisa ter de 2 a 120 caracteres.' });
  if (cnpj.length !== 14) return res.status(400).json({ erro: 'O CNPJ precisa ter 14 números.' });
  if (!['micro', 'pequeno', 'medio', 'grande'].includes(porte)) return res.status(400).json({ erro: 'Escolha o porte da empresa.' });
  if (localizacao.length > 120) return res.status(400).json({ erro: 'A localização pode ter no máximo 120 caracteres.' });
  try {
    const nova = await query(
      'INSERT INTO patrocinador (razao_social, cnpj, porte, localizacao) VALUES ($1, $2, $3, $4)',
      [razao, cnpj, porte, localizacao || null]
    );
    const { rows } = await query('SELECT *, 0 AS contas FROM patrocinador WHERE id_patrocinador = $1', [nova.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (ERRO.duplicado(e)) return res.status(409).json({ erro: 'Já existe um patrocinador com esse CNPJ.' });
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
    // No MySQL a cascata não dispara trigger, então o estorno nem roda aqui. A conta some junto.
    await client.query(`SET @createit_moderacao = 'on'`);
    fotos = await client.query(`SELECT url_foto FROM postagem WHERE id_usuario = $1 AND url_foto IS NOT NULL`, [id]);
    const { rowCount } = await client.query(`DELETE FROM usuario WHERE id_usuario = $1`, [id]);
    await client.query('COMMIT');
    if (!rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.query('SET @createit_moderacao = NULL').catch(() => {});
    client.release();
  }
  // As fotos ficam no Storage, fora do banco: apaga depois do COMMIT
  for (const { url_foto } of fotos.rows) apagarFoto(url_foto).catch((err) => console.error(err));
  res.json({ ok: true });
});

export default r;
