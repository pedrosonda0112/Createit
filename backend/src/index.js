import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import postagensRoutes from './routes/postagens.js';
import usuariosRoutes from './routes/usuarios.js';
import geralRoutes from './routes/geral.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/saude', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/postagens', postagensRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api', geralRoutes);

// Erro não tratado: loga no servidor e devolve mensagem genérica
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Algo deu errado no servidor. Tente de novo.' });
});

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`API do Create It rodando em http://localhost:${port}`));
