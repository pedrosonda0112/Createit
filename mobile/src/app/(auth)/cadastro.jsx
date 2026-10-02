import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { mascaraCpf } from '../../lib/util.js';
import { cor } from '../../lib/tema.js';
import LayoutAuth from '../../components/LayoutAuth.jsx';
import { Botao, Campo, Erro, Texto } from '../../components/ui.jsx';

export default function Cadastro() {
  const { entrar } = useAuth();
  const [dados, setDados] = useState({ nome: '', cpf: '', email: '', senha: '' });
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (v) => setDados({ ...dados, [campo]: campo === 'cpf' ? mascaraCpf(v) : v });

  async function enviar() {
    setErro('');
    setEnviando(true);
    try {
      await entrar(await api('/auth/cadastro', { method: 'POST', body: dados }));
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth>
      <View>
        <Texto titulo estilo={{ fontSize: 26 }}>Criar conta</Texto>
        <Texto suave estilo={{ marginTop: 8 }}>Cada ação sustentável que você registrar vira ponto. Os pontos viram benefício com os parceiros.</Texto>
      </View>
      <Campo rotulo="Nome completo" value={dados.nome} onChangeText={mudar('nome')} placeholder="Seu nome" autoComplete="name" textContentType="name" />
      <Campo rotulo="CPF" value={dados.cpf} onChangeText={mudar('cpf')} placeholder="000.000.000-00" keyboardType="number-pad" />
      <Campo rotulo="E-mail" value={dados.email} onChangeText={mudar('email')} placeholder="voce@email.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Campo rotulo="Senha" value={dados.senha} onChangeText={mudar('senha')} placeholder="Mínimo 8 caracteres" secureTextEntry
        autoComplete="new-password" textContentType="newPassword" />
      <Pressable onPress={() => setAceite(!aceite)} accessibilityRole="checkbox" accessibilityState={{ checked: aceite }}
        style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{
          width: 20, height: 20, borderRadius: 5, borderWidth: 1, marginTop: 1, alignItems: 'center', justifyContent: 'center',
          borderColor: aceite ? cor.gelo : cor.borda, backgroundColor: aceite ? cor.gelo : 'transparent',
        }}>
          {aceite && <Texto estilo={{ color: cor.fundo, fontSize: 13, lineHeight: 16 }} forte>✓</Texto>}
        </View>
        <Texto estilo={{ flex: 1, fontSize: 13, lineHeight: 19 }}>Li e aceito os termos de uso e a política de privacidade (LGPD).</Texto>
      </Pressable>
      <Erro>{erro}</Erro>
      <Botao onPress={enviar} carregando={enviando} disabled={!aceite}>CRIAR CONTA</Botao>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Texto suave estilo={{ fontSize: 14 }}>Já tem conta?</Texto>
        <Link href="/login"><Texto forte estilo={{ color: cor.gelo, fontSize: 14 }}>Entrar</Texto></Link>
      </View>
    </LayoutAuth>
  );
}
