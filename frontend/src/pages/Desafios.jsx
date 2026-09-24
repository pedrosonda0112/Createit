import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import Icone from '../components/Icone.jsx';
import { CardDesafio, CardRanking, CardSaldo } from '../components/Laterais.jsx';

const diasAte = (data) => Math.max(0, Math.ceil((new Date(data) - new Date()) / 86400000));

export default function Desafios() {
  const { abrirRegistro, ultimaPostagem } = useOutletContext();
  const [lista, setLista] = useState(null);
  useEffect(() => { api('/desafios').then(setLista).catch(() => setLista([])); }, [ultimaPostagem]);

  const [destaque, ...outros] = lista || [];
  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <h1 style={{ fontSize: 28 }}>Desafios</h1>
        {lista === null && <p className="vazio">Carregando desafios…</p>}
        {lista?.length === 0 && <p className="vazio">Nenhum desafio ativo agora. Volte em breve.</p>}
        {destaque && (
          <section className="destaque" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
            <div className="linha-entre" style={{ fontWeight: 700, fontSize: 12 }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icone nome="award" tamanho={18} />Destaque · {destaque.patrocinador || 'Comunidade'}</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 500 }}><Icone nome="clock" tamanho={16} />Termina em {diasAte(destaque.data_fim)} dias</span>
            </div>
            <h2 style={{ fontSize: 30 }}>{destaque.titulo}</h2>
            <p>{destaque.descricao}</p>
            <div className="linha-entre" style={{ fontWeight: 700, fontSize: 14 }}>
              <span>{destaque.progresso} de {destaque.meta_acoes} ações</span>
              <span style={{ fontFamily: 'var(--fonte-titulo)', fontWeight: 800 }}>+{destaque.pontos_bonus} pts bônus</span>
            </div>
            <div className="barra"><span style={{ width: `${Math.min(100, (destaque.progresso / destaque.meta_acoes) * 100)}%` }} /></div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-escuro" onClick={abrirRegistro}>REGISTRAR AÇÃO</button>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, fontWeight: 500 }}><Icone nome="users" tamanho={16} />{destaque.participantes} pessoas participando</span>
            </div>
          </section>
        )}
        {outros.length > 0 && <h2 className="card-titulo">Outros desafios</h2>}
        <div className="grade">{outros.map((d) => <CardDesafio key={d.id_desafio} desafio={d} />)}</div>
      </div>
      <aside className="coluna-lateral">
        <CardSaldo />
        <section className="card lista-card">
          <h2 className="card-titulo">Como funciona</h2>
          {['Escolha um desafio criado por um patrocinador ou pela comunidade.', 'Registre as ações pedidas e vincule ao desafio.', 'Completou? Os pontos bônus caem no seu saldo.'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span className="avatar" style={{ width: 28, height: 28, fontSize: 13, borderColor: 'var(--superficie-2)' }}>{i + 1}</span>
              <p className="texto-suave" style={{ fontSize: 13 }}>{t}</p>
            </div>
          ))}
        </section>
        <CardRanking />
      </aside>
    </div>
  );
}
