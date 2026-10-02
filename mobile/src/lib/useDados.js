import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

// Carrega os dados sempre que a tela ganha o foco (ex.: ao voltar de outra tela
// ou depois de registrar uma ação) e oferece o "puxar para atualizar".
// "carregar" precisa vir de um useCallback para não recarregar a cada render.
export function useDados(carregar) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  const buscar = useCallback(async (puxou = false) => {
    if (puxou) setAtualizando(true);
    try {
      setDados(await carregar());
      setErro('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtualizando(false);
    }
  }, [carregar]);

  useFocusEffect(useCallback(() => { buscar(); }, [buscar]));

  return { dados, setDados, erro, atualizando, atualizar: () => buscar(true) };
}
