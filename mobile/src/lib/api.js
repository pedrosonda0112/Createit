// Cliente HTTP do app: o mesmo contrato do front-end web (frontend/src/api.js).
// O app nunca fala com o banco: tudo passa pela API, que conecta no Supabase
// com o usuário restrito app_createit.
import Constants from 'expo-constants';
import { lerToken } from './sessao.js';

// Em desenvolvimento, sem EXPO_PUBLIC_API_URL, usa o IP do computador que roda
// o Metro (o celular com Expo Go está na mesma rede) e a porta do backend.
function urlPadrao() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:3333/api`;
}

export const BASE = (process.env.EXPO_PUBLIC_API_URL || urlPadrao()).replace(/\/+$/, '');

export async function api(caminho, { method = 'GET', body } = {}) {
  const token = await lerToken();
  // FormData (formulário com foto) vai como está: o fetch monta o multipart
  const formulario = body instanceof FormData;
  let resp;
  try {
    resp = await fetch(`${BASE}${caminho}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !formulario ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formulario ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Confira sua internet.');
  }
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const erro = new Error(dados.erro || 'Não foi possível falar com o servidor.');
    erro.status = resp.status;
    throw erro;
  }
  return dados;
}
