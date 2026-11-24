import { Router } from 'express';
import { query } from '../db.js';
import { auth, soPatrocinador } from '../middleware/auth.js';

// Painel do patrocinador: a conta com usuario.id_patrocinador cria e gerencia
// os desafios e as recompensas da própria empresa (nunca os de outra).
const r = Router();
r.use(auth, soPatrocinador);

const LIMITE = { titulo: 120, descricao: 1000, meta: 100, bonus: 5000, custo: 100000, estoque: 100000 };
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // AAAA-MM-DD

const inteiro = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const dataValida = (v) => DATA.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());
const idValido = (req) => (Number.isInteger(Number(req.params.id)) ? Number(req.params.id) : null);

// Confere e limpa os campos de um desafio. Devolve { erro } ou { dados }.
async function lerDesafio(b, novo) {
  const titulo = String(b.titulo || '').trim();
  const descricao = String(b.descricao || '').trim();
  const idCategoria = inteiro(b.id_categoria);
  const meta = inteiro(b.meta_acoes);
  const bonus = inteiro(b.pontos_bonus);
  const inicio = String(b.data_inicio || '');
  const fim = String(b.data_fim || '');

  if (titulo.length < 3 || titulo.length > LIMITE.titulo) return { erro: 'O título precisa ter de 3 a 120 caracteres.' };
  if (descricao.length > LIMITE.descricao) return { erro: 'A descrição pode ter no máximo 1000 caracteres.' };
  if (!Number.isInteger(meta) || meta < 1 || meta > LIMITE.meta) return { erro: 'A meta precisa ser de 1 a 100 ações.' };
  if (!Number.isInteger(bonus) || bonus < 0 || bonus > LIMITE.bonus) return { erro: 'O bônus precisa ser de 0 a 5.000 pontos.' };
  if (!dataValida(inicio) || !dataValida(fim)) return { erro: 'Confira as datas de início e de fim.' };
  if (fim < inicio) return { erro: 'A data de fim não pode ser antes da data de início.' };
  if (novo && fim < hoje()) return { erro: 'A data de fim não pode estar no passado.' };
  const cat = await query('SELECT 1 FROM categoria_acao WHERE id_categoria = $1', [idCategoria]);
  if (!cat.rows[0]) return { erro: 'Escolha uma categoria.' };
  return { dados: [idCategoria, titulo, descricao || null, meta, bonus, inicio, fim] };
}

function lerRecompensa(b, novo) {
  const titulo = String(b.titulo || '').trim();
  const descricao = String(b.descricao || '').trim();
  const custo = inteiro(b.custo_pontos);
  const estoque = inteiro(b.estoque);
  const validade = String(b.validade || '');

  if (titulo.length < 3 || titulo.length > LIMITE.titulo) return { erro: 'O título precisa ter de 3 a 120 caracteres.' };
  if (descricao.length > LIMITE.descricao) return { erro: 'A descrição pode ter no máximo 1000 caracteres.' };
  if (!Number.isInteger(custo) || custo < 1 || custo > LIMITE.custo) return { erro: 'O custo precisa ser de 1 a 100.000 pontos.' };
  if (!Number.isInteger(estoque) || estoque < 0 || estoque > LIMITE.estoque) return { erro: 'O estoque precisa ser de 0 a 100.000 unidades.' };
  if (!dataValida(validade)) return { erro: 'Confira a data de validade.' };
  if (novo && validade < hoje()) return { erro: 'A validade não pode estar no passado.' };
  return { dados: [titulo, descricao || null, custo, estoque, validade] };
}

// Empresa + números gerais do painel
r.get('/', async (req, res) => {
  const [empresa, desafios, recompensas] = await Promise.all([
    query('SELECT id_patrocinador, razao_social, porte, localizacao FROM patrocinador WHERE id_patrocinador = $1', [req.idPatrocinador]),
    query(`SELECT * FROM vw_desafio_painel WHERE id_patrocinador = $1
            ORDER BY FIELD(situacao, 'ativo', 'agendado', 'encerrado'), data_fim DESC`, [req.idPatrocinador]),
    query(`SELECT * FROM vw_recompensa_painel WHERE id_patrocinador = $1
            ORDER BY FIELD(situacao, 'ativa', 'esgotada', 'encerrada'), validade DESC`, [req.idPatrocinador]),
  ]);
  res.json({ empresa: empresa.rows[0], desafios: desafios.rows, recompensas: recompensas.rows });
});

// ---------------------------------------------------------------- desafios
const umDesafio = async (id) => (await query('SELECT * FROM vw_desafio_painel WHERE id_desafio = $1', [id])).rows[0];

r.post('/desafios', async (req, res) => {
  const { erro, dados } = await lerDesafio(req.body ?? {}, true);
  if (erro) return res.status(400).json({ erro });
  const novo = await query(
    `INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [req.idPatrocinador, ...dados]
  );
  res.status(201).json(await umDesafio(novo.insertId));
});

r.put('/desafios/:id', async (req, res) => {
  const id = idValido(req);
  const { erro, dados } = await lerDesafio(req.body ?? {}, false);
  if (erro) return res.status(400).json({ erro });
  const upd = await query(
    `UPDATE desafio SET id_categoria = $1, titulo = $2, descricao = $3, meta_acoes = $4, pontos_bonus = $5,
            data_inicio = $6, data_fim = $7
      WHERE id_desafio = $8 AND id_patrocinador = $9`,
    [...dados, id, req.idPatrocinador]
  );
  if (!upd.rowCount) return res.status(404).json({ erro: 'Esse desafio não existe ou não é da sua empresa.' });
  res.json(await umDesafio(id));
});

// Encerrar: o desafio some da lista de ativos, mas as ações ligadas a ele continuam.
// No MySQL o SET vai da esquerda para a direita: data_inicio já compara com a data_fim nova.
r.post('/desafios/:id/encerrar', async (req, res) => {
  const id = idValido(req);
  const upd = await query(
    `UPDATE desafio SET data_fim = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), data_inicio = LEAST(data_inicio, data_fim)
      WHERE id_desafio = $1 AND id_patrocinador = $2`,
    [id, req.idPatrocinador]
  );
  if (!upd.rowCount) return res.status(404).json({ erro: 'Esse desafio não existe ou não é da sua empresa.' });
  res.json(await umDesafio(id));
});

// Apagar só desafio sem nenhuma ação registrada (senão, encerre)
r.delete('/desafios/:id', async (req, res) => {
  const id = idValido(req);
  const { rows } = await query(
    `SELECT (SELECT COUNT(*) FROM postagem p WHERE p.id_desafio = d.id_desafio) AS acoes
       FROM desafio d WHERE d.id_desafio = $1 AND d.id_patrocinador = $2`,
    [id, req.idPatrocinador]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Esse desafio não existe ou não é da sua empresa.' });
  if (Number(rows[0].acoes) > 0) {
    return res.status(409).json({ erro: 'Esse desafio já tem ações registradas. Use "Encerrar" para tirá-lo do ar.' });
  }
  await query('DELETE FROM desafio WHERE id_desafio = $1 AND id_patrocinador = $2', [id, req.idPatrocinador]);
  res.json({ ok: true });
});

// ------------------------------------------------------------ recompensas
const umaRecompensa = async (id) => (await query('SELECT * FROM vw_recompensa_painel WHERE id_recompensa = $1', [id])).rows[0];

r.post('/recompensas', async (req, res) => {
  const { erro, dados } = lerRecompensa(req.body ?? {}, true);
  if (erro) return res.status(400).json({ erro });
  const nova = await query(
    `INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.idPatrocinador, ...dados]
  );
  res.status(201).json(await umaRecompensa(nova.insertId));
});

r.put('/recompensas/:id', async (req, res) => {
  const id = idValido(req);
  const { erro, dados } = lerRecompensa(req.body ?? {}, false);
  if (erro) return res.status(400).json({ erro });
  const upd = await query(
    `UPDATE recompensa SET titulo = $1, descricao = $2, custo_pontos = $3, estoque = $4, validade = $5
      WHERE id_recompensa = $6 AND id_patrocinador = $7`,
    [...dados, id, req.idPatrocinador]
  );
  if (!upd.rowCount) return res.status(404).json({ erro: 'Essa recompensa não existe ou não é da sua empresa.' });
  res.json(await umaRecompensa(id));
});

// Encerrar: sai da vitrine na hora; os vouchers já resgatados continuam valendo no histórico
r.post('/recompensas/:id/encerrar', async (req, res) => {
  const id = idValido(req);
  const upd = await query(
    `UPDATE recompensa SET validade = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      WHERE id_recompensa = $1 AND id_patrocinador = $2`,
    [id, req.idPatrocinador]
  );
  if (!upd.rowCount) return res.status(404).json({ erro: 'Essa recompensa não existe ou não é da sua empresa.' });
  res.json(await umaRecompensa(id));
});

// Apagar só recompensa que ninguém resgatou (a FK de resgate também barra)
r.delete('/recompensas/:id', async (req, res) => {
  const id = idValido(req);
  try {
    const del = await query('DELETE FROM recompensa WHERE id_recompensa = $1 AND id_patrocinador = $2', [id, req.idPatrocinador]);
    if (!del.rowCount) return res.status(404).json({ erro: 'Essa recompensa não existe ou não é da sua empresa.' });
    res.json({ ok: true });
  } catch (e) {
    if (e.errno === 1451) {
      return res.status(409).json({ erro: 'Essa recompensa já foi resgatada. Use "Encerrar" para tirá-la da vitrine.' });
    }
    throw e;
  }
});

// Vouchers emitidos pela empresa (para conferir no balcão)
r.get('/resgates', async (req, res) => {
  const { rows } = await query(
    `SELECT rg.id_resgate, rg.codigo_voucher, rg.status, rg.pontos_gastos, rg.data_resgate,
            r.titulo, u.nome, u.usuario
       FROM resgate rg
       JOIN recompensa r ON r.id_recompensa = rg.id_recompensa
       JOIN usuario u    ON u.id_usuario = rg.id_usuario
      WHERE r.id_patrocinador = $1
      ORDER BY rg.data_resgate DESC LIMIT 50`,
    [req.idPatrocinador]
  );
  res.json(rows);
});

// Dar baixa no voucher quando o cliente usa no balcão
r.post('/resgates/:codigo/usar', async (req, res) => {
  const codigo = String(req.params.codigo || '').trim().toUpperCase();
  const { rows } = await query(
    `SELECT rg.id_resgate, rg.status FROM resgate rg JOIN recompensa r ON r.id_recompensa = rg.id_recompensa
      WHERE rg.codigo_voucher = $1 AND r.id_patrocinador = $2`,
    [codigo, req.idPatrocinador]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Nenhum voucher da sua empresa tem esse código.' });
  if (rows[0].status !== 'ativo') return res.status(409).json({ erro: `Esse voucher já está ${rows[0].status}.` });
  await query(`UPDATE resgate SET status = 'usado' WHERE id_resgate = $1`, [rows[0].id_resgate]);
  res.json({ ok: true });
});

export default r;
