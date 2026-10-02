// Registrar ação (abre como modal por cima de qualquer aba)
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { iconeCategoria, reduzirFoto } from '../../lib/util.js';
import { cor, fonte, raio } from '../../lib/tema.js';
import { useAviso } from '../../components/Aviso.jsx';
import Icone from '../../components/Icone.jsx';
import Tela from '../../components/Tela.jsx';
import { Botao, Campo, Chip, Erro, s as ui, Texto } from '../../components/ui.jsx';

export default function Registrar() {
  const { atualizar } = useAuth();
  const avisar = useAviso();
  const [categorias, setCategorias] = useState([]);
  const [desafios, setDesafios] = useState([]);
  const [categoria, setCategoria] = useState(null);
  const [conteudo, setConteudo] = useState('');
  const [desafio, setDesafio] = useState(null);
  const [foto, setFoto] = useState(null);
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api('/categorias')
      .then((c) => { setCategorias(c); setCategoria(c[0]?.id_categoria); })
      .catch((e) => setErro(e.message));
    api('/desafios').then(setDesafios).catch(() => {});
  }, []);

  const selecionada = categorias.find((c) => c.id_categoria === categoria);
  const desafiosDaCategoria = desafios.filter((d) => d.id_categoria === categoria);

  async function escolherFoto(daCamera) {
    setErro('');
    const permissao = daCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setErro(daCamera ? 'Permita o uso da câmera nas configurações do celular.' : 'Permita o acesso às fotos nas configurações do celular.');
      return;
    }
    const abrir = daCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const r = await abrir({ mediaTypes: ['images'], quality: 1 });
    if (r.canceled || !r.assets?.[0]) return;
    setPreparandoFoto(true);
    try {
      setFoto(await reduzirFoto(r.assets[0]));
    } catch {
      setErro('Não foi possível abrir essa foto. Tente outra.');
    } finally {
      setPreparandoFoto(false);
    }
  }

  async function publicar() {
    setErro('');
    setEnviando(true);
    const dados = new FormData();
    dados.append('id_categoria', String(categoria));
    dados.append('conteudo', conteudo);
    if (desafio) dados.append('id_desafio', String(desafio));
    if (foto) {
      // No celular o fetch envia o arquivo pelo caminho; no navegador precisa do Blob
      if (Platform.OS === 'web') dados.append('foto', await (await fetch(foto.uri)).blob(), 'foto.jpg');
      else dados.append('foto', { uri: foto.uri, name: 'foto.jpg', type: 'image/jpeg' });
    }
    try {
      const r = await api('/postagens', { method: 'POST', body: dados });
      atualizar({ pontos_ecologicos: r.pontos_ecologicos, nivel: r.nivel });
      avisar(`Ação publicada! +${r.postagem.pontos_gerados} pts no seu saldo.`);
      router.dismissTo('/');
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <Tela
      titulo="Registrar ação"
      direita={(
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Fechar">
          <Icone nome="x" tamanho={22} />
        </Pressable>
      )}
    >
      <View style={{ gap: 8 }}>
        <Texto suave estilo={{ fontSize: 13 }}>Categoria</Texto>
        <View style={s.categorias}>
          {categorias.map((c) => {
            const ativa = c.id_categoria === categoria;
            return (
              <Pressable key={c.id_categoria} onPress={() => { setCategoria(c.id_categoria); setDesafio(null); }}
                accessibilityRole="button" accessibilityState={{ selected: ativa }} style={[s.categoria, ativa && s.categoriaAtiva]}>
                <Icone nome={iconeCategoria[c.nome] || 'leaf'} cor={ativa ? cor.fundo : cor.texto} />
                <Texto forte={ativa} estilo={[{ fontSize: 14 }, ativa && { color: cor.fundo }]}>{c.nome}</Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Campo rotulo="O que você fez?" value={conteudo} onChangeText={setConteudo} multiline maxLength={500}
        placeholder="Ex.: levei 3 kg de recicláveis ao ponto de coleta" />

      <View style={{ gap: 8 }}>
        <Texto suave estilo={{ fontSize: 13 }}>Foto (opcional)</Texto>
        {foto ? (
          <View>
            <Image source={{ uri: foto.uri }} style={s.previa} resizeMode="cover" accessibilityLabel="Prévia da foto escolhida" />
            <Pressable onPress={() => setFoto(null)} style={s.removerFoto} accessibilityLabel="Remover foto">
              <Icone nome="x" tamanho={18} cor={cor.fundo} />
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {Platform.OS !== 'web' && (
              <Pressable onPress={() => escolherFoto(true)} disabled={preparandoFoto} style={s.escolherFoto}>
                <Icone nome="camera" tamanho={22} cor={cor.textoSuave} />
                <Texto suave estilo={{ fontSize: 14 }}>{preparandoFoto ? 'Preparando…' : 'Câmera'}</Texto>
              </Pressable>
            )}
            <Pressable onPress={() => escolherFoto(false)} disabled={preparandoFoto} style={s.escolherFoto}>
              <Icone nome="image" tamanho={22} cor={cor.textoSuave} />
              <Texto suave estilo={{ fontSize: 14 }}>{preparandoFoto ? 'Preparando…' : 'Galeria'}</Texto>
            </Pressable>
          </View>
        )}
      </View>

      {desafiosDaCategoria.length > 0 && (
        <View style={{ gap: 8 }}>
          <Texto suave estilo={{ fontSize: 13 }}>Vincular a um desafio (opcional)</Texto>
          <View style={ui.chips}>
            <Chip ativo={!desafio} onPress={() => setDesafio(null)}>Nenhum</Chip>
            {desafiosDaCategoria.map((d) => (
              <Chip key={d.id_desafio} ativo={desafio === d.id_desafio} onPress={() => setDesafio(d.id_desafio)}>{d.titulo}</Chip>
            ))}
          </View>
        </View>
      )}

      <View style={s.previaPontos}>
        <View>
          <Texto suave estilo={{ fontSize: 12 }}>Você vai ganhar</Texto>
          <Texto estilo={{ fontFamily: fonte.titulo, fontSize: 22, color: cor.gelo }}>+{selecionada?.pontos_base ?? 0} pts</Texto>
        </View>
        <Texto suave estilo={{ fontSize: 12, textAlign: 'right', maxWidth: 170, lineHeight: 17 }}>Creditados assim que a ação for validada</Texto>
      </View>

      <Erro>{erro}</Erro>
      <Botao onPress={publicar} carregando={enviando} disabled={preparandoFoto || !conteudo.trim() || !categoria}>
        PUBLICAR AÇÃO
      </Botao>
    </Tela>
  );
}

const s = StyleSheet.create({
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoria: {
    flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14,
    borderRadius: raio.campo, borderWidth: 1, borderColor: cor.borda, backgroundColor: cor.fundo,
  },
  categoriaAtiva: { backgroundColor: cor.gelo, borderColor: cor.gelo },
  escolherFoto: {
    flex: 1, height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: raio.campo, borderWidth: 1, borderStyle: 'dashed', borderColor: cor.borda,
  },
  previa: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: cor.superficie2 },
  removerFoto: {
    position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: cor.texto, alignItems: 'center', justifyContent: 'center',
  },
  previaPontos: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14,
    borderRadius: raio.campo, backgroundColor: cor.superficie2,
  },
});
