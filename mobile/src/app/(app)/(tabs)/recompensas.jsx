import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { useDados } from '../../../lib/useDados.js';
import { fmt } from '../../../lib/util.js';
import { cor } from '../../../lib/tema.js';
import { useAviso } from '../../../components/Aviso.jsx';
import Icone from '../../../components/Icone.jsx';
import { CardPassos, CardSaldo } from '../../../components/Cards.jsx';
import Tela from '../../../components/Tela.jsx';
import { Barra, Botao, Card, Erro, s as ui, Texto, Vazio } from '../../../components/ui.jsx';

export default function Recompensas() {
  const { usuario, atualizar } = useAuth();
  const avisar = useAviso();
  const [resgatando, setResgatando] = useState(null);
  const carregar = useCallback(async () => {
    const [lista, resgates] = await Promise.all([api('/recompensas'), api('/resgates').catch(() => [])]);
    return { lista, resgates };
  }, []);
  const { dados, erro, atualizando, atualizar: recarregar } = useDados(carregar);

  function confirmar(r) {
    Alert.alert('Resgatar recompensa', `Trocar ${fmt(r.custo_pontos)} pts por "${r.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resgatar', onPress: () => resgatar(r) },
    ]);
  }

  async function resgatar(r) {
    setResgatando(r.id_recompensa);
    try {
      const res = await api(`/recompensas/${r.id_recompensa}/resgatar`, { method: 'POST' });
      atualizar({ pontos_ecologicos: res.pontos_ecologicos });
      Alert.alert('Resgatado!', `Seu código é ${res.codigo}. Mostre no parceiro antes da validade.`);
      recarregar();
    } catch (e) {
      avisar(e.message);
    } finally {
      setResgatando(null);
    }
  }

  const saldo = usuario.pontos_ecologicos;
  const lista = dados?.lista;
  const destaque = lista?.length ? lista[lista.length - 1] : null; // a mais cara vira o destaque
  const grade = lista?.slice(0, -1) || [];

  return (
    <Tela titulo="Recompensas" aoAtualizar={recarregar} atualizando={atualizando}>
      <CardSaldo />
      <Erro>{erro}</Erro>
      {!dados && !erro && <Vazio>Carregando recompensas…</Vazio>}

      {destaque && (
        <View style={{ backgroundColor: cor.gelo, borderRadius: 20, padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Icone nome="star" tamanho={16} cor={cor.fundo} />
            <Texto forte estilo={{ color: cor.fundo, fontSize: 12 }}>Destaque · {destaque.patrocinador}</Texto>
          </View>
          <Texto titulo estilo={{ color: cor.fundo, fontSize: 22 }}>{destaque.titulo}</Texto>
          <View style={ui.linhaEntre}>
            <Texto forte estilo={{ color: cor.fundo, fontSize: 13 }}>Você tem {fmt(saldo)} de {fmt(destaque.custo_pontos)} pts</Texto>
            {saldo < destaque.custo_pontos && <Texto estilo={{ color: cor.fundo, fontSize: 13 }}>Faltam {fmt(destaque.custo_pontos - saldo)}</Texto>}
          </View>
          <Barra pct={(saldo / destaque.custo_pontos) * 100} altura={10} escura />
          <Botao tipo="escuro" pequeno estilo={{ alignSelf: 'flex-start' }} carregando={resgatando === destaque.id_recompensa}
            disabled={saldo < destaque.custo_pontos || destaque.estoque === 0 || !!resgatando} onPress={() => confirmar(destaque)}>
            {destaque.estoque === 0 ? 'ESGOTADO' : 'RESGATAR'}
          </Botao>
        </View>
      )}

      {grade.length > 0 && <Texto estilo={ui.cardTitulo}>Disponíveis para você</Texto>}
      {grade.map((r) => {
        const pode = saldo >= r.custo_pontos && r.estoque > 0;
        return (
          <Card key={r.id_recompensa} estilo={{ padding: 14, flexDirection: 'row', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: cor.superficie2, alignItems: 'center', justifyContent: 'center' }}>
              <Icone nome="gift" tamanho={28} cor={cor.gelo} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Texto suave estilo={{ fontSize: 12 }}>{r.patrocinador}</Texto>
              <Texto forte estilo={{ lineHeight: 20 }}>{r.titulo}</Texto>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Icone nome="pin" tamanho={13} cor={cor.textoSuave} />
                <Texto suave estilo={{ fontSize: 12 }} numberOfLines={1}>{r.localizacao}</Texto>
              </View>
              <View style={[ui.linhaEntre, { marginTop: 6 }]}>
                <Texto estilo={[ui.pts, !pode && { color: cor.textoSuave }]}>{fmt(r.custo_pontos)} pts</Texto>
                {pode
                  ? <Botao pequeno carregando={resgatando === r.id_recompensa} disabled={!!resgatando} onPress={() => confirmar(r)}>Resgatar</Botao>
                  : <Texto suave estilo={{ fontSize: 12 }}>{r.estoque === 0 ? 'Esgotado' : `Faltam ${fmt(r.custo_pontos - saldo)} pts`}</Texto>}
              </View>
            </View>
          </Card>
        );
      })}

      {dados && (
        <Card estilo={{ padding: 18, gap: 12 }}>
          <Texto estilo={ui.cardTitulo}>Meus resgates</Texto>
          {dados.resgates.length === 0 && <Texto suave estilo={{ fontSize: 13 }}>Você ainda não trocou pontos. Quando trocar, o código aparece aqui.</Texto>}
          {dados.resgates.map((r) => (
            <View key={r.id_resgate} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: cor.superficie2, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
              <Icone nome="ticket" cor={r.status === 'ativo' ? cor.gelo : cor.textoSuave} />
              <View style={{ flex: 1 }}>
                <Texto forte estilo={{ fontSize: 13, lineHeight: 18 }}>{r.titulo}</Texto>
                <Texto suave selectable estilo={{ fontSize: 12, lineHeight: 16 }}>
                  {r.codigo_voucher} · {r.status === 'ativo' ? 'Ativo' : r.status === 'usado' ? 'Usado' : 'Expirado'}
                </Texto>
              </View>
            </View>
          ))}
        </Card>
      )}

      <CardPassos
        titulo="Como trocar"
        passos={['Escolha a recompensa e toque em Resgatar.', 'Os pontos saem do saldo na hora e você recebe um código.', 'Mostre o código no parceiro antes da validade.']}
      />
    </Tela>
  );
}
