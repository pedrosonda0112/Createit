import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { cor } from '../../lib/tema.js';
import LayoutAuth from '../../components/LayoutAuth.jsx';
import { Botao, Campo, Erro, Texto } from '../../components/ui.jsx';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro('');
    setEnviando(true);
    try {
      // Ao entrar, o layout (auth) redireciona para o feed
      await entrar(await api('/auth/login', { method: 'POST', body: { email, senha } }));
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth>
      <View>
        <Texto titulo estilo={{ fontSize: 26 }}>Entrar</Texto>
        <Texto suave estilo={{ marginTop: 8 }}>Registre suas ações, ganhe pontos e troque por benefícios.</Texto>
      </View>
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} placeholder="••••••••" secureTextEntry
        autoComplete="current-password" textContentType="password" onSubmitEditing={enviar} returnKeyType="go" />
      <Link href="/esqueci-senha" style={{ alignSelf: 'flex-end' }}>
        <Texto forte estilo={{ color: cor.gelo, fontSize: 14 }}>Esqueci minha senha</Texto>
      </Link>
      <Erro>{erro}</Erro>
      <Botao onPress={enviar} carregando={enviando} disabled={!email || !senha}>ENTRAR</Botao>
      <Texto suave estilo={{ textAlign: 'center', fontSize: 13 }}>ou</Texto>
      <Link href="/cadastro" asChild>
        <Botao tipo="secundario">Criar conta</Botao>
      </Link>
      <Texto suave estilo={{ textAlign: 'center', fontSize: 12 }}>
        Ao entrar, você concorda com os termos de uso e a política de privacidade (LGPD).
      </Texto>
    </LayoutAuth>
  );
}
