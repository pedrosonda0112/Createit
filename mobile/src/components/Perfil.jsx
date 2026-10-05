// Perfil de qualquer pessoa. Usado pela aba "Perfil" (o meu) e pela rota /perfil/[id].
import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useDados } from '../lib/useDados.js';
import { fmt, iconeCategoria, nomeNivel, PONTOS_POR_NIVEL, tempo } from '../lib/util.js';
import { cor, fonte } from '../lib/tema.js';
import { useAviso } from './Aviso.jsx';
import Icone from './Icone.jsx';
import Postagem from './Postagem.jsx';
import Tela from './Tela.jsx';
import { Avatar, Barra, Botao, Card, Chip, Erro, s as ui, Texto, Vazio } from './ui.jsx';

const iconeConquista = { 'Primeira ação': 'leaf', Reciclador: 'recycle', 'Sem carro': 'bus', 'Poupa água': 'drop', 'Energia limpa': 'bolt' };

export default function Perfil({ id, comVoltar }) {
  const { usuario, sair } = useAuth();
  const avisar = useAviso();
  const idPerfil = Number(id || usuario.id_usuario);
  const meu = idPerfil === usuario.id_usuario;
  const [aba, setAba] = useState('acoes');
  const carregar = useCallback(() => api(`/usuarios/${idPerfil}`), [idPerfil]);
  const { dados: p, setDados: setP, erro, atualizando, atualizar } = useDados(carregar);

  async function seguir() {
    try {
      const r = await api(`/usuarios/${idPerfil}/seguir`, { method: 'POST' });
      setP((x) => ({ ...x, eu_sigo: r.seguindo, seguidores: x.seguidores + (r.seguindo ? 1 : -1) }));
    } catch (e) {
      avisar(e.message);
    }
  }

  function confirmarSair() {
    Alert.alert('Sair da conta?', '', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: sair }]);
  }

  const direita = meu && !comVoltar ? (
    <Pressable onPress={confirmarSair} hitSlop={8} accessibilityLabel="Sair" style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <Icone nome="logout" tamanho={20} cor={cor.textoSuave} />
      <Texto suave estilo={{ fontSize: 14 }}>Sair</Texto>
    </Pressable>
  ) : null;

  if (!p) {
    return (
      <Tela titulo="Perfil" comVoltar={comVoltar} direita={direita}>
        {erro ? <Erro>{erro}</Erro> : <Vazio>Carregando perfil…</Vazio>}
      </Tela>
    );
  }

  const inicioNivel = (p.nivel - 1) * PONTOS_POR_NIVEL;
  const fimNivel = p.nivel * PONTOS_POR_NIVEL;
  const pct = ((p.pontos_ecologicos - inicioNivel) / PONTOS_POR_NIVEL) * 100;
  const maxImpacto = Math.max(1, ...p.impacto.map((i) => i.acoes));

  return (
    <Tela titulo="Perfil" comVoltar={comVoltar} direita={direita} aoAtualizar={atualizar} atualizando={atualizando}>
      <Card estilo={{ overflow: 'hidden' }}>
        <View style={{ height: 80, backgroundColor: cor.gelo }} />
        <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40 }}>
            <View style={{ borderRadius: 999, borderWidth: 4, borderColor: cor.superficie }}>
              <Avatar nome={p.nome} tamanho={80} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {usuario.admin && (
                <Botao pequeno tipo="secundario" icone={<Icone nome="escudo" tamanho={16} cor={cor.texto} />}
                  onPress={() => router.push(meu ? '/admin' : `/admin/${p.id_usuario}`)}>
                  {meu ? 'Admin' : 'Gerenciar'}
                </Botao>
              )}
              {meu
                ? <Botao pequeno icone={<Icone nome="edit" tamanho={16} cor={cor.fundo} />} onPress={() => router.push('/editar-perfil')}>Editar perfil</Botao>
                : <Botao pequeno tipo={p.eu_sigo ? 'secundario' : 'primario'} onPress={seguir}>{p.eu_sigo ? 'Seguindo' : 'Seguir'}</Botao>}
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Texto titulo estilo={{ fontSize: 22 }}>{p.nome}</Texto>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', gap: 6, alignItems: 'center', backgroundColor: cor.superficie2, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
              <Icone nome="star" tamanho={14} cor={cor.gelo} />
              <Texto forte estilo={{ color: cor.gelo, fontSize: 12, lineHeight: 16 }}>Nível {p.nivel} · {nomeNivel(p.nivel)}</Texto>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Texto suave estilo={{ fontSize: 14 }}>@{p.usuario}</Texto>
              {p.cidade ? (<>
                <Texto suave estilo={{ fontSize: 14 }}>·</Texto>
                <Icone nome="pin" tamanho={14} cor={cor.textoSuave} />
                <Texto suave estilo={{ fontSize: 14 }}>{p.cidade}</Texto>
              </>) : null}
            </View>
          </View>
          {p.bio ? <Texto>{p.bio}</Texto> : null}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: cor.borda, paddingTop: 14 }}>
            {[[fmt(p.pontos_ecologicos), 'pontos'], [p.acoes, 'ações'], [p.seguidores, 'seguidores'], [p.seguindo, 'seguindo']].map(([n, l]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center' }}>
                <Texto titulo estilo={{ fontSize: 20 }}>{n}</Texto>
                <Texto suave estilo={{ fontSize: 12 }}>{l}</Texto>
              </View>
            ))}
          </View>
          <View style={{ gap: 8 }}>
            <View style={ui.linhaEntre}>
              <Texto forte estilo={{ fontSize: 13, flex: 1 }}>Próximo nível: {p.nivel + 1} · {nomeNivel(p.nivel + 1)}</Texto>
              <Texto suave estilo={{ fontSize: 13 }}>{fmt(p.pontos_ecologicos)} / {fmt(fimNivel)}</Texto>
            </View>
            <Barra pct={pct} altura={10} />
          </View>
        </View>
      </Card>

      <View style={ui.chips}>
        <Chip ativo={aba === 'acoes'} onPress={() => setAba('acoes')}>{meu ? 'Minhas ações' : 'Ações'}</Chip>
        <Chip ativo={aba === 'conquistas'} onPress={() => setAba('conquistas')}>Conquistas</Chip>
        <Chip ativo={aba === 'impacto'} onPress={() => setAba('impacto')}>Impacto</Chip>
      </View>

      {aba === 'acoes' && (p.postagens.length
        ? p.postagens.map((x) => (
          <Postagem key={x.id_postagem} post={x} aoApagar={(idPost) => setP((v) => ({ ...v, postagens: v.postagens.filter((y) => y.id_postagem !== idPost) }))} />
        ))
        : <Vazio>Nenhuma ação registrada ainda.</Vazio>)}

      {aba === 'conquistas' && p.conquistas.map((c) => (
        <Card key={c.id_conquista} estilo={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', opacity: c.data_obtencao ? 1 : 0.6 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.data_obtencao ? cor.gelo : cor.borda, backgroundColor: cor.superficie2, alignItems: 'center', justifyContent: 'center' }}>
            <Icone nome={iconeConquista[c.nome] || 'award'} cor={c.data_obtencao ? cor.gelo : cor.textoSuave} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto forte>{c.nome}</Texto>
            <Texto suave estilo={{ fontSize: 12, lineHeight: 17 }}>{c.descricao}</Texto>
          </View>
          <Texto suave estilo={{ fontSize: 12 }}>{c.data_obtencao ? 'Liberada' : 'Bloqueada'}</Texto>
        </Card>
      ))}

      {aba === 'impacto' && (<>
        <Card estilo={{ padding: 18, gap: 12 }}>
          <Texto estilo={ui.cardTitulo}>Impacto por categoria</Texto>
          {p.impacto.length === 0 && <Texto suave estilo={{ fontSize: 13 }}>As ações validadas aparecem aqui por categoria.</Texto>}
          {p.impacto.map((i) => (
            <View key={i.categoria} style={{ gap: 6 }}>
              <View style={ui.linhaEntre}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icone nome={iconeCategoria[i.categoria] || 'leaf'} tamanho={16} cor={cor.gelo} />
                  <Texto>{i.categoria}</Texto>
                </View>
                <Texto forte estilo={{ color: cor.gelo }}>{i.acoes} {i.acoes === 1 ? 'ação' : 'ações'}</Texto>
              </View>
              <Barra pct={(i.acoes / maxImpacto) * 100} />
            </View>
          ))}
        </Card>
        {meu && (
          <Card estilo={{ padding: 18, gap: 12 }}>
            <Texto estilo={ui.cardTitulo}>Histórico de pontos</Texto>
            {p.historico.length === 0 && <Texto suave estilo={{ fontSize: 13 }}>Seus pontos ganhos e gastos aparecem aqui.</Texto>}
            {p.historico.map((h, idx) => (
              <View key={idx} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: cor.superficie2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icone nome={h.tipo === 'resgate' ? 'gift' : 'leaf'} tamanho={17} cor={cor.gelo} />
                </View>
                <View style={{ flex: 1 }}>
                  <Texto numberOfLines={1} estilo={{ fontSize: 13, lineHeight: 18 }}>{h.tipo === 'resgate' ? `Resgate: ${h.descricao}` : h.descricao}</Texto>
                  <Texto suave estilo={{ fontSize: 12, lineHeight: 16 }}>{tempo(h.data)}</Texto>
                </View>
                <Texto estilo={{ fontFamily: fonte.tituloForte, fontSize: 13, color: h.pontos < 0 ? cor.textoSuave : cor.gelo }}>
                  {h.pontos > 0 ? '+' : '−'}{fmt(Math.abs(h.pontos))}
                </Texto>
              </View>
            ))}
          </Card>
        )}
      </>)}
    </Tela>
  );
}
