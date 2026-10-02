// Cartões de saldo, desafio e passo a passo (equivalentes ao Laterais.jsx do web)
import { Image, StyleSheet, View } from 'react-native';
import { useAuth } from '../lib/auth.jsx';
import { fmt, PONTOS_POR_NIVEL } from '../lib/util.js';
import { cor, fonte } from '../lib/tema.js';
import Icone from './Icone.jsx';
import { Avatar, Barra, Card, s as ui, Texto } from './ui.jsx';

export function CardSaldo() {
  const { usuario } = useAuth();
  const proximo = usuario.nivel * PONTOS_POR_NIVEL;
  const falta = Math.max(0, proximo - usuario.pontos_ecologicos);
  return (
    <View style={s.saldo}>
      <View>
        <Texto forte estilo={s.saldoTexto}>Seu saldo</Texto>
        <Texto titulo estilo={s.saldoValor}>{fmt(usuario.pontos_ecologicos)} pts</Texto>
        <Texto estilo={[s.saldoTexto, { fontSize: 12 }]}>
          {falta > 0 ? `Faltam ${fmt(falta)} para o nível ${usuario.nivel + 1}` : `Nível ${usuario.nivel}`}
        </Texto>
      </View>
      <Image source={require('../../assets/carpas.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
    </View>
  );
}

export function CardDesafio({ desafio }) {
  const pct = (desafio.progresso / desafio.meta_acoes) * 100;
  return (
    <Card estilo={{ padding: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icone nome="award" tamanho={18} cor={cor.gelo} />
        <Texto forte estilo={{ fontSize: 12, color: cor.gelo }}>
          {desafio.patrocinador ? `Desafio ${desafio.patrocinador}` : 'Desafio da comunidade'}
        </Texto>
      </View>
      <Texto estilo={{ fontFamily: fonte.tituloForte, fontSize: 16 }}>{desafio.titulo}</Texto>
      <View style={ui.linhaEntre}>
        <Texto suave estilo={{ fontSize: 13 }}>{desafio.progresso} de {desafio.meta_acoes} ações</Texto>
        <Texto forte estilo={{ color: cor.gelo, fontSize: 13 }}>+{desafio.pontos_bonus} pts bônus</Texto>
      </View>
      <Barra pct={pct} />
    </Card>
  );
}

export function CardPassos({ titulo, passos }) {
  return (
    <Card estilo={{ padding: 18, gap: 12 }}>
      <Texto estilo={ui.cardTitulo}>{titulo}</Texto>
      {passos.map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Avatar nome={String(i + 1)} tamanho={28} estilo={{ borderColor: cor.superficie2 }} />
          <Texto suave estilo={{ fontSize: 13, flex: 1, lineHeight: 18 }}>{t}</Texto>
        </View>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  saldo: {
    backgroundColor: cor.gelo, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  saldoTexto: { color: cor.fundo, fontSize: 13 },
  saldoValor: { color: cor.fundo, fontSize: 30, lineHeight: 34 },
});
