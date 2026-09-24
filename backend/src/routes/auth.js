import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();
const PUBLICO = 'id_usuario, nome, usuario, email, bio, cidade, pontos_ecologicos, nivel';
const gerarToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

r.post('/cadastro', async (req, res) => {
  const { nome, cpf, email, senha } = req.body;
  const cpfLimpo = String(cpf || '').replace(/\D/g, '');
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
  if (cpfLimpo.length !== 11) return res.status(400).json({ erro: 'O CPF precisa ter 11 números.' });
  if (senha.length < 8) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' });

  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30) || 'usuario';
  const usuario = `${base}${Math.floor(Math.random() * 900 + 100)}`;
  const hash = await bcrypt.hash(senha, 10);
  try {
    const { rows } = await query(
      `INSERT INTO usuario (nome, cpf, email, senha_hash, usuario)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${PUBLICO}`,
      [nome.trim(), cpfLimpo, email.trim().toLowerCase(), hash, usuario]
    );
    res.status(201).json({ token: gerarToken(rows[0].id_usuario), usuario: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail ou CPF.' });
    throw e;
  }
});

r.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const { rows } = await query(`SELECT ${PUBLICO}, senha_hash FROM usuario WHERE email = $1`, [String(email || '').trim().toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(senha || '', u.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }
  delete u.senha_hash;
  res.json({ token: gerarToken(u.id_usuario), usuario: u });
});

r.get('/eu', auth, async (req, res) => {
  const { rows } = await query(`SELECT ${PUBLICO} FROM usuario WHERE id_usuario = $1`, [req.userId]);
  if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(rows[0]);
});

export default r;
