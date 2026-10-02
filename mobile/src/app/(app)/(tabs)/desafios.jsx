import { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../lib/api.js';
import { useDados } from '../../../lib/useDados.js';
import { diasAte } from '../../../lib/util.js';
import { cor, fonte } from '../../../lib/tema.js';
import Icone from '../../../components/Icone.jsx';
import { CardDesafio, CardPassos, CardSaldo } from '../../../components/Cards.jsx';
import Tela from '../../../components/Tela.jsx';
import { Barra, Botao, Erro, s as ui, Texto, Vazio } from '../../../components/ui.jsx';

export default function Desafios() {
  const carregar = useCallback(() => api('/desafios'), []);
  const { dados: lista, erro, atualizando, atualizar } = useDados(carregar);
  const [destaque, ...outros] = lista || [];

  return (
    <Tela titulo="Desafios" aoAtualizar={atualizar} atualizando={atualizando}>
      <Erro>{erro}</Erro>
      {lista === null && !erro && <Vazio>Carregando desafios…</Vazio>}
      {lista?.length === 0 && <Vazio>Nenhum desafio ativo agora. Volte em breve.</Vazio>}

      {destaque && (
        <View style={{ backgroundColor: cor.gelo, borderRadius: 20, padding: 20, gap: 14 }}>
          <View style={[ui.linhaEntre, { flexWrap: 'wrap' }]}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Icone nome="award" tamanho={16} cor={cor.fundo} />
              <Texto forte estilo={{ color: cor.fundo, fontSize: 12 }}>Destaque · {destaque.patrocinador || 'Comunidade'}</Texto>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Icone nome="clock" tamanho={14} cor={cor.fundo} />
              <Texto estilo={{ color: cor.fundo, fontSize: 12 }}>Termina em {diasAte(destaque.data_fim)} dias</Texto>
            </View>
          </View>
          <Texto titulo estilo={{ color: cor.fundo, fontSize: 24 }}>{destaque.titulo}</Texto>
          {destaque.descricao ? <Texto estilo={{ color: cor.fundo }}>{destaque.descricao}</Texto> : null}
          <View style={ui.linhaEntre}>
            <Texto forte estilo={{ color: cor.fundo, fontSize: 14 }}>{destaque.progresso} de {destaque.meta_acoes} ações</Texto>
            <Texto estilo={{ color: cor.fundo, fontSize: 14, fontFamily: fonte.tituloForte }}>+{destaque.pontos_bonus} pts bônus</Texto>
          </View>
          <Barra pct={(destaque.progresso / destaque.meta_acoes) * 100} altura={10} escura />
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Botao tipo="escuro" onPress={() => router.push('/registrar')}>REGISTRAR AÇÃO</Botao>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Icone nome="users" tamanho={16} cor={cor.fundo} />
              <Texto estilo={{ color: cor.fundo, fontSize: 13 }}>{destaque.participantes} pessoas participando</Texto>
            </View>
          </View>
        </View>
      )}

      {outros.length > 0 && <Texto estilo={ui.cardTitulo}>Outros desafios</Texto>}
      {outros.map((d) => <CardDesafio key={d.id_desafio} desafio={d} />)}

      <CardSaldo />
      <CardPassos
        titulo="Como funciona"
        passos={['Escolha um desafio criado por um patrocinador ou pela comunidade.', 'Registre as ações pedidas e vincule ao desafio.', 'Completou? Os pontos bônus caem no seu saldo.']}
      />
    </Tela>
  );
}
