// Painel admin: editar qualquer conta (dados, pontos, nível e acesso de admin) ou apagá-la
import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { limparUsuario } from '../../../lib/util.js';
import { cor } from '../../../lib/tema.js';
import { useAviso } from '../../../components/Aviso.jsx';
import Icone from '../../../components/Icone.jsx';
import Tela from '../../../components/Tela.jsx';
import { Botao, Campo, Card, Erro, Texto, Vazio } from '../../../components/ui.jsx';

export default function EditarUsuarioAdmin() {
  const { id } = useLocalSearchParams();
  const { usuario, atualizar } = useAuth();
  const avisar = useAviso();
  const eu = Number(id) === usuario.id_usuario;
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (v) => setDados((d) => ({ ...d, [campo]: campo === 'usuario' ? limparUsuario(v) : v }));

  useEffect(() => {
    if (!usuario.admin) return;
    api(`/admin/usuarios/${id}`)
      .then((u) => setDados({
        nome: u.nome, usuario: u.usuario, email: u.email, cidade: u.cidade || '', bio: u.bio || '',
        pontos_ecologicos: String(u.pontos_ecologicos), nivel: String(u.nivel), admin: u.admin,
      }))
      .catch((e) => setErro(e.message));
  }, [id, usuario.admin]);

  if (!usuario.admin) return <Redirect href="/" />;

  async function salvar() {
    setErro('');
    setEnviando(true);
    try {
      const u = await api(`/admin/usuarios/${id}`, {
        method: 'PUT',
        body: { ...dados, pontos_ecologicos: Number(dados.pontos_ecologicos), nivel: Number(dados.nivel) },
      });
      if (eu) atualizar(u);
      avisar(`@${u.usuario} atualizado.`);
      router.back();
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  }

  async function apagar() {
    setEnviando(true);
    try {
      await api(`/admin/usuarios/${id}`, { method: 'DELETE' });
      avisar(`Conta de @${dados.usuario} apagada.`);
      router.back();
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  }

  function confirmarApagar() {
    Alert.alert(
      `Apagar a conta de @${dados.usuario}?`,
      'Postagens, comentários, curtidas, seguidores, conquistas e resgates dela também são apagados. Não dá para desfazer.',
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar conta', style: 'destructive', onPress: apagar }],
    );
  }

  return (
    <Tela titulo="Editar usuário" comVoltar>
      {!dados && (erro ? <Erro>{erro}</Erro> : <Vazio>Carregando…</Vazio>)}
      {dados && (<>
        <Campo rotulo="Nome" value={dados.nome} onChangeText={mudar('nome')} maxLength={120} />
        <Campo rotulo="Usuário" prefixo="@" value={dados.usuario} onChangeText={mudar('usuario')} maxLength={40}
          autoCapitalize="none" autoCorrect={false} />
        <Campo rotulo="E-mail" value={dados.email} onChangeText={mudar('email')} maxLength={160}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Campo rotulo="Cidade" value={dados.cidade} onChangeText={mudar('cidade')} maxLength={80} />
        <Campo rotulo={`Bio · ${dados.bio.length}/280`} value={dados.bio} onChangeText={mudar('bio')} maxLength={280} multiline />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Campo estilo={{ flex: 1 }} rotulo="Pontos" value={dados.pontos_ecologicos} keyboardType="number-pad"
            onChangeText={(v) => mudar('pontos_ecologicos')(v.replace(/\D/g, ''))} />
          <Campo estilo={{ flex: 1 }} rotulo="Nível" value={dados.nivel} keyboardType="number-pad"
            onChangeText={(v) => mudar('nivel')(v.replace(/\D/g, ''))} />
        </View>
        <Card estilo={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto forte>Administrador</Texto>
            <Texto suave estilo={{ fontSize: 12, lineHeight: 16 }}>
              {eu ? 'Você não pode tirar o seu próprio acesso.' : 'Pode apagar postagens, comentários e curtidas e editar ou apagar contas.'}
            </Texto>
          </View>
          <Switch value={dados.admin} onValueChange={mudar('admin')} disabled={eu}
            trackColor={{ true: cor.gelo, false: cor.borda }} thumbColor={cor.texto} accessibilityLabel="Administrador" />
        </Card>

        <Erro>{erro}</Erro>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Botao tipo="secundario" onPress={() => router.back()}>Cancelar</Botao>
          <Botao estilo={{ flex: 1 }} onPress={salvar} carregando={enviando}>SALVAR</Botao>
        </View>
        {!eu && (
          <Botao tipo="perigo" icone={<Icone nome="lixeira" tamanho={16} cor={cor.fundo} />} onPress={confirmarApagar} disabled={enviando}>
            APAGAR CONTA
          </Botao>
        )}
      </>)}
    </Tela>
  );
}
