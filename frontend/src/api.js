// Pequeno cliente HTTP: coloca o token e transforma erros da API em exceções legíveis
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(caminho, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('createit_token');
  const resp = await fetch(`${BASE}${caminho}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const erro = new Error(dados.erro || 'Não foi possível falar com o servidor.');
    erro.status = resp.status;
    throw erro;
  }
  return dados;
}
