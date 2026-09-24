import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt } from '../util.js';
import Icone from '../components/Icone.jsx';
import { CardSaldo } from '../components/Laterais.jsx';

export default function Recompensas() {
  const { usuario, atualizar } = useAuth();
  const { avisar } = useOutletContext();
  const [lista, setLista] = useState(null);
  const [resgates, setResgates] = useState([]);
  const [resgatando, setResgatando] = useState(null);

  const carregar = () => {
    api('/recompensas').then(setLista).catch(() => setLista([]));
    api('/resgates').then(setResgates).catch(() => {});
  };
  useEffect(carregar, []);

  async function resgatar(r) {
    if (!confirm(`Trocar ${fmt(r.custo_pontos)} pts por "${r.titulo}"?`)) return;
    setResgatando(r.id_recompensa);
    try {
      const res = await api(`/recompensas/${r.id_recompensa}/resgatar`, { method: 'POST' });
      atualizar({ pontos_ecologicos: res.pontos_ecologicos });
      avisar(`Resgatado! Seu código é ${res.codigo}.`);
      carregar();
    } catch (e) {
      avisar(e.message);
    } finally {
      setResgatando(null);
    }
  }

  const saldo = usuario.pontos_ecologicos;
  const destaque = lista?.length ? lista[lista.length - 1] : null; // a mais cara vira o destaque
  const grade = lista?.slice(0, -1) || [];

  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <h1 style={{ fontSize: 28 }}>Recompensas</h1>
        {lista === null && <p className="vazio">Carregando recompensas…</p>}
        {destaque && (
          <section className="destaque">
            <div className="imagem"><Icone nome="gift" tamanho={56} /></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, fontWeight: 700 }}><Icone nome="star" tamanho={16} />Destaque · {destaque.patrocinador}</span>
              <h2>{destaque.titulo}</h2>
              <div className="linha-entre" style={{ fontWeight: 700 }}>
                <span>Você tem {fmt(saldo)} de {fmt(destaque.custo_pontos)} pts</span>
                {saldo < destaque.custo_pontos && <span style={{ fontWeight: 500 }}>Faltam {fmt(destaque.custo_pontos - saldo)}</span>}
              </div>
              <div className="barra"><span style={{ width: `${Math.min(100, (saldo / destaque.custo_pontos) * 100)}%` }} /></div>
              <div><button className="btn btn-escuro btn-pequeno" disabled={saldo < destaque.custo_pontos || resgatando} onClick={() => resgatar(destaque)}>RESGATAR</button></div>
            </div>
          </section>
        )}
        {grade.length > 0 && <h2 className="card-titulo">Disponíveis para você</h2>}
        <div className="grade">
          {grade.map((r) => {
            const pode = saldo >= r.custo_pontos && r.estoque > 0;
            return (
              <article key={r.id_recompensa} className="card recompensa">
                <div className="imagem"><Icone nome="gift" tamanho={32} /></div>
                <small className="texto-suave">{r.patrocinador}</small>
                <h3>{r.titulo}</h3>
                <small className="texto-suave" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icone nome="pin" tamanho={13} />{r.localizacao}</small>
                <div className="rodape">
                  <span className="pts" style={{ color: pode ? 'var(--gelo)' : 'var(--texto-suave)' }}>{fmt(r.custo_pontos)} pts</span>
                  {pode
                    ? <button className="btn btn-primario btn-pequeno" disabled={resgatando === r.id_recompensa} onClick={() => resgatar(r)}>{resgatando === r.id_recompensa ? '…' : 'Resgatar'}</button>
                    : <span className="btn btn-secundario btn-pequeno" style={{ fontSize: 12, cursor: 'default' }}>{r.estoque === 0 ? 'Esgotado' : `Faltam ${fmt(r.custo_pontos - saldo)} pts`}</span>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <aside className="coluna-lateral">
        <CardSaldo />
        <section className="card lista-card">
          <h2 className="card-titulo">Meus resgates</h2>
          {resgates.length === 0 && <p className="texto-suave" style={{ fontSize: 13 }}>Você ainda não trocou pontos. Quando trocar, o código aparece aqui.</p>}
          {resgates.map((r) => (
            <div key={r.id_resgate} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--superficie-2)', borderRadius: 12, padding: '10px 12px' }}>
              <Icone nome="ticket" style={{ color: r.status === 'ativo' ? 'var(--gelo)' : 'var(--texto-suave)' }} />
              <div style={{ lineHeight: 1.35 }}>
                <strong style={{ fontSize: 13 }}>{r.titulo}</strong><br />
                <small className="texto-suave">{r.codigo_voucher} · {r.status === 'ativo' ? 'Ativo' : r.status === 'usado' ? 'Usado' : 'Expirado'}</small>
              </div>
            </div>
          ))}
        </section>
        <section className="card lista-card">
          <h2 className="card-titulo">Como trocar</h2>
          {['Escolha a recompensa e toque em Resgatar.', 'Os pontos saem do saldo na hora e você recebe um código.', 'Mostre o código no parceiro antes da validade.'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span className="avatar" style={{ width: 28, height: 28, fontSize: 13, borderColor: 'var(--superficie-2)' }}>{i + 1}</span>
              <p className="texto-suave" style={{ fontSize: 13 }}>{t}</p>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}
