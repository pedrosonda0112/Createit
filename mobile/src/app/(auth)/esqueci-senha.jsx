import { useState } from 'react';
import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { api } from '../../lib/api.js';
import { mascaraCpf } from '../../lib/util.js';
import { cor } from '../../lib/tema.js';
import LayoutAuth from '../../components/LayoutAuth.jsx';
import { Botao, Campo, Erro, Texto } from '../../components/ui.jsx';

export default function EsqueciSenha() {
  const [dados, setDados] = useState({ email: '', cpf: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const mudar = (campo) => (v) => setDados({ ...dados, [campo]: campo === 'cpf' ? mascaraCpf(v) : v });

  async function enviar() {
    setErro('');
    if (dados.senha !== dados.confirmar) return setErro('As duas senhas não são iguais.');
    setEnviando(true);
    try {
      await api('/auth/redefinir-senha', { method: 'POST', body: { email: dados.email, cpf: dados.cpf, senha: dados.senha } });
      setPronto(true);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <LayoutAuth>
        <View>
          <Texto titulo estilo={{ fontSize: 26 }}>Senha alterada</Texto>
          <Texto suave estilo={{ marginTop: 8 }}>Pronto! Agora é só entrar com a nova senha.</Texto>
        </View>
        <Botao onPress={() => router.replace('/login')}>IR PARA O LOGIN</Botao>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth>
      <View>
        <Texto titulo estilo={{ fontSize: 26 }}>Esqueci minha senha</Texto>
        <Texto suave estilo={{ marginTop: 8 }}>Confirme o e-mail e o CPF da sua conta e escolha uma senha nova.</Texto>
      </View>
      <Campo rotulo="E-mail" value={dados.email} onChangeText={mudar('email')} placeholder="voce@email.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Campo rotulo="CPF" value={dados.cpf} onChangeText={mudar('cpf')} placeholder="000.000.000-00" keyboardType="number-pad" />
      <Campo rotulo="Nova senha" value={dados.senha} onChangeText={mudar('senha')} placeholder="Mínimo 8 caracteres" secureTextEntry autoComplete="new-password" />
      <Campo rotulo="Confirmar nova senha" value={dados.confirmar} onChangeText={mudar('confirmar')} placeholder="Repita a senha" secureTextEntry autoComplete="new-password" />
      <Erro>{erro}</Erro>
      <Botao onPress={enviar} carregando={enviando}>REDEFINIR SENHA</Botao>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Texto suave estilo={{ fontSize: 14 }}>Lembrou a senha?</Texto>
        <Link href="/login"><Texto forte estilo={{ color: cor.gelo, fontSize: 14 }}>Entrar</Texto></Link>
      </View>
    </LayoutAuth>
  );
}
