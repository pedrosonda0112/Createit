// Peças básicas de interface, equivalentes às classes .btn, .campo, .chip, .card e .barra do web
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { iniciais } from '../lib/util.js';
import { cor, fonte, raio } from '../lib/tema.js';

export function Texto({ estilo, suave, forte, titulo, children, ...resto }) {
  return (
    <Text style={[s.texto, suave && s.suave, forte && s.forte, titulo && s.titulo, estilo]} {...resto}>
      {children}
    </Text>
  );
}

// tipo: primario | secundario | escuro | perigo
export function Botao({ tipo = 'primario', pequeno, carregando, disabled, onPress, children, icone, estilo }) {
  const desligado = disabled || carregando;
  const t = tiposBotao[tipo];
  return (
    <Pressable
      onPress={onPress}
      disabled={desligado}
      accessibilityRole="button"
      accessibilityState={{ disabled: desligado }}
      style={({ pressed }) => [s.btn, pequeno && s.btnPequeno, t.caixa, pressed && t.pressionado, desligado && s.desligado, estilo]}
    >
      {carregando ? <ActivityIndicator color={t.texto.color} /> : (<>
        {icone}
        <Text style={[s.btnTexto, pequeno && s.btnTextoPequeno, t.texto]}>{children}</Text>
      </>)}
    </Pressable>
  );
}

export function Campo({ rotulo, dica, prefixo, multiline, estilo, ...resto }) {
  return (
    <View style={[s.campo, estilo]}>
      {rotulo ? <Text style={s.rotulo}>{rotulo}</Text> : null}
      <View style={[s.entrada, multiline && s.entradaMulti]}>
        {prefixo ? <Text style={s.prefixo}>{prefixo}</Text> : null}
        <TextInput
          placeholderTextColor={cor.placeholder}
          selectionColor={cor.gelo}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[s.input, multiline && s.inputMulti]}
          {...resto}
        />
      </View>
      {dica ? <Text style={s.dica}>{dica}</Text> : null}
    </View>
  );
}

export function Chip({ ativo, onPress, children }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: ativo }} style={[s.chip, ativo && s.chipAtivo]}>
      <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>{children}</Text>
    </Pressable>
  );
}

export const Card = ({ estilo, children }) => <View style={[s.card, estilo]}>{children}</View>;

export function Barra({ pct, altura = 8, escura }) {
  return (
    <View style={[s.barra, { height: altura }, escura && { backgroundColor: 'rgba(11,11,12,.15)' }]}>
      <View style={[s.barraCheia, { width: `${Math.max(0, Math.min(100, pct))}%` }, escura && { backgroundColor: cor.fundo }]} />
    </View>
  );
}

export function Avatar({ nome, tamanho = 40, estilo }) {
  return (
    <View style={[s.avatar, { width: tamanho, height: tamanho }, estilo]}>
      <Text style={[s.avatarTexto, { fontSize: Math.round(tamanho * 0.36) }]}>{iniciais(nome)}</Text>
    </View>
  );
}

export const Vazio = ({ children }) => <Text style={s.vazio}>{children}</Text>;
export const Erro = ({ children }) => (children ? <Text style={s.erro} accessibilityRole="alert">{children}</Text> : null);

const tiposBotao = {
  primario: { caixa: { backgroundColor: cor.gelo }, pressionado: { backgroundColor: cor.geloClaro }, texto: { color: cor.fundo } },
  secundario: { caixa: { borderColor: cor.borda }, pressionado: { borderColor: cor.textoSuave }, texto: { color: cor.texto, fontFamily: fonte.textoForte, letterSpacing: 0 } },
  escuro: { caixa: { backgroundColor: cor.fundo }, pressionado: { opacity: 0.85 }, texto: { color: cor.gelo } },
  perigo: { caixa: { backgroundColor: cor.erro }, pressionado: { backgroundColor: '#f5bcb6' }, texto: { color: cor.fundo } },
};

export const s = StyleSheet.create({
  texto: { color: cor.texto, fontFamily: fonte.texto, fontSize: 15, lineHeight: 22 },
  suave: { color: cor.textoSuave },
  forte: { fontFamily: fonte.textoForte },
  titulo: { fontFamily: fonte.titulo, lineHeight: undefined },
  btn: {
    height: 48, paddingHorizontal: 20, borderRadius: raio.campo, borderWidth: 1, borderColor: 'transparent',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnPequeno: { height: 36, paddingHorizontal: 14 },
  btnTexto: { fontFamily: fonte.tituloForte, fontSize: 14, letterSpacing: 0.4 },
  btnTextoPequeno: { fontSize: 13 },
  desligado: { opacity: 0.5 },
  campo: { gap: 6 },
  rotulo: { color: cor.textoSuave, fontFamily: fonte.texto, fontSize: 13 },
  entrada: {
    minHeight: 48, borderRadius: raio.campo, borderWidth: 1, borderColor: cor.borda, backgroundColor: cor.fundo,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  entradaMulti: { alignItems: 'flex-start', paddingVertical: 10 },
  prefixo: { color: cor.textoSuave, fontFamily: fonte.texto, fontSize: 15 },
  input: { flex: 1, color: cor.texto, fontFamily: fonte.texto, fontSize: 15, paddingVertical: 10 },
  inputMulti: { minHeight: 84, paddingVertical: 0 },
  dica: { color: cor.textoSuave, fontFamily: fonte.texto, fontSize: 12 },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: cor.borda, justifyContent: 'center' },
  chipAtivo: { backgroundColor: cor.gelo, borderColor: cor.gelo },
  chipTexto: { color: cor.texto, fontFamily: fonte.textoMedio, fontSize: 13 },
  chipTextoAtivo: { color: cor.fundo, fontFamily: fonte.textoForte },
  card: { backgroundColor: cor.superficie, borderWidth: 1, borderColor: cor.borda, borderRadius: raio.card },
  barra: { borderRadius: 5, backgroundColor: cor.superficie2, overflow: 'hidden' },
  barraCheia: { height: '100%', backgroundColor: cor.gelo, borderRadius: 5 },
  avatar: { borderRadius: 999, backgroundColor: cor.superficie2, borderWidth: 1, borderColor: cor.gelo, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cor.gelo, fontFamily: fonte.tituloForte },
  vazio: { padding: 32, textAlign: 'center', color: cor.textoSuave, fontFamily: fonte.texto, fontSize: 15 },
  erro: { color: cor.erro, fontFamily: fonte.texto, fontSize: 14 },
  cardTitulo: { color: cor.texto, fontFamily: fonte.tituloForte, fontSize: 14, letterSpacing: 0.3 },
  pts: { color: cor.gelo, fontFamily: fonte.tituloForte },
  linhaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
