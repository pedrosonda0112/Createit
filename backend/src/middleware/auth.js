import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ erro: 'Sua sessão expirou. Entre de novo.' });
  }
}

// O admin é conferido no banco a cada pedido (e não guardado no token):
// tirar o admin de alguém vale na hora, sem esperar o login expirar.
export async function ehAdmin(idUsuario) {
  const { rows } = await query('SELECT admin FROM usuario WHERE id_usuario = $1', [idUsuario]);
  return rows[0]?.admin === true;
}

// Usar depois do auth
export async function soAdmin(req, res, next) {
  if (!(await ehAdmin(req.userId))) return res.status(403).json({ erro: 'Só administradores podem fazer isso.' });
  next();
}
