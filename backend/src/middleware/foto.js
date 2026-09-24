import multer from 'multer';
import { tipoImagem } from '../storage.js';

const LIMITE_MB = 5;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_MB * 1024 * 1024, files: 1 },
}).single('foto');

// Lê o campo "foto" (opcional) de um formulário multipart e confere se é mesmo uma imagem.
// Os outros campos do formulário ficam em req.body, como num JSON.
export function receberFoto(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const erro = err.code === 'LIMIT_FILE_SIZE' ? `A foto pode ter no máximo ${LIMITE_MB} MB.` : 'Não foi possível ler a foto enviada.';
      return res.status(400).json({ erro });
    }
    if (err) return next(err);
    if (req.file) {
      req.file.tipo = tipoImagem(req.file.buffer);
      if (!req.file.tipo) return res.status(400).json({ erro: 'Envie uma foto em JPG, PNG ou WEBP.' });
    }
    next();
  });
}
