import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api.js';
import { fmt } from '../../lib/util.js';
import { cor, fonte, raio } from '../../lib/tema.js';
import Icone from '../../components/Icone.jsx';
import Postagem from '../../components/Postagem.jsx';
import Tela from '../../components/Tela.jsx';
import { Avatar, Botao, Card, Chip, s as ui, Texto, Vazio } from '../../components/ui.jsx';

function Pessoa({ p }) {
  const [seguindo, setSeguindo] = useState(p.seguindo);
  async function seguir() {
    setSeguindo(!seguindo);
    const r = await api(`/usuarios/${p.id_usuario}/seguir`, { method: 'POST' }).catch(() => ({ seguindo }));
    setSeguindo(r.seguindo);
  }
  return (
    <Card estilo={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={() => router.push(`/perfil/${p.id_usuario}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar nome={p.nome} tamanho={48} />
        <View style={{ flex: 1 }}>
          <Texto forte numberOfLines={1}>{p.nome}</Texto>
          <Texto suave estilo={{ fontSize: 12, lineHeight: 16 }}>@{p.usuario}</Texto>
          <Texto estilo={[ui.pts, { fontSize: 12 }]}>{fmt(p.pontos_ecologicos)} pts</Texto>
        </View>
      </Pressable>
      <Botao pequeno tipo={seguindo ? 'secundario' : 'primario'} onPress={seguir}>{seguindo ? 'Seguindo' : 'Seguir'}</Botao>
    </Card>
  );
}

export default function Buscar() {
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('tudo');
  const [res, setRes] = useState(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    const termo = texto.trim();
    setQ(termo);
    if (!termo) { setRes(null); return; }
    setBuscando(true);
    const r = await api(`/busca?q=${encodeURIComponent(termo)}`).catch(() => ({ pessoas: [], acoes: [], recompensas: [] }));
    setRes(r);
    setBuscando(false);
  }

  const total = res ? res.pessoas.length + res.acoes.length + res.recompensas.length : 0;
  const mostra = (tipo) => filtro === 'tudo' || filtro === tipo;

  return (
    <Tela titulo="Buscar" comVoltar>
      <View style={s.busca}>
        <Icone nome="search" tamanho={20} cor={cor.gelo} />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={buscar}
          returnKeyType="search"
          autoFocus
          autoCapitalize="none"
          placeholder="Pessoas, ações ou recompensas"
          placeholderTextColor={cor.placeholder}
          selectionColor={cor.gelo}
          style={s.input}
          accessibilityLabel="Buscar"
        />
        {texto ? (
          <Pressable onPress={() => { setTexto(''); setQ(''); setRes(null); }} hitSlop={8} accessibilityLabel="Limpar">
            <Icone nome="x" tamanho={18} cor={cor.textoSuave} />
          </Pressable>
        ) : null}
      </View>
      <View style={ui.chips}>
        {[['tudo', 'Tudo'], ['pessoas', 'Pessoas'], ['acoes', 'Ações'], ['recompensas', 'Recompensas']].map(([v, n]) => (
          <Chip key={v} ativo={filtro === v} onPress={() => setFiltro(v)}>{n}</Chip>
        ))}
      </View>

      {!q && <Vazio>Digite o nome de alguém, uma ação (como “bike”) ou uma recompensa.</Vazio>}
      {buscando && <Vazio>Buscando…</Vazio>}
      {res && !buscando && <Texto suave estilo={{ fontSize: 14 }}>{total} resultado{total === 1 ? '' : 's'} para “{q}”</Texto>}

      {res && !buscando && mostra('pessoas') && res.pessoas.length > 0 && (<>
        <Texto estilo={ui.cardTitulo}>Pessoas</Texto>
        {res.pessoas.map((p) => <Pessoa key={p.id_usuario} p={p} />)}
      </>)}
      {res && !buscando && mostra('acoes') && res.acoes.length > 0 && (<>
        <Texto estilo={ui.cardTitulo}>Ações</Texto>
        {res.acoes.map((p) => <Postagem key={p.id_postagem} post={p} />)}
      </>)}
      {res && !buscando && mostra('recompensas') && res.recompensas.length > 0 && (<>
        <Texto estilo={ui.cardTitulo}>Recompensas</Texto>
        {res.recompensas.map((r) => (
          <Pressable key={r.id_recompensa} onPress={() => router.navigate('/recompensas')}>
            <Card estilo={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: cor.superficie2, alignItems: 'center', justifyContent: 'center' }}>
                <Icone nome="gift" cor={cor.gelo} />
              </View>
              <View style={{ flex: 1 }}>
                <Texto suave estilo={{ fontSize: 12 }}>{r.patrocinador}</Texto>
                <Texto forte>{r.titulo}</Texto>
              </View>
              <Texto estilo={ui.pts}>{fmt(r.custo_pontos)} pts</Texto>
            </Card>
          </Pressable>
        ))}
      </>)}
    </Tela>
  );
}

const s = StyleSheet.create({
  busca: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14,
    borderRadius: raio.campo, borderWidth: 1, borderColor: cor.gelo, backgroundColor: cor.superficie,
  },
  input: { flex: 1, color: cor.texto, fontFamily: fonte.texto, fontSize: 16 },
});
