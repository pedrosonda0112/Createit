import { useCallback, useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt } from '../util.js';
import Icone from '../components/Icone.jsx';
import { FormDesafio, FormRecompensa } from '../components/FormPatrocinador.jsx';

// Painel do patrocinador: a empresa cria e acompanha os próprios desafios e recompensas
// e dá baixa nos vouchers que os clientes apresentam no balcão.

const dataBR = (v) => (v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '');
const ROTULO = {
  ativo: 'Ativo', agendado: 'Agendado', encerrado: 'Encerrado',
  ativa: 'Ativa', esgotada: 'Esgotada', encerrada: 'Encerrada',
  usado: 'Usado', expirado: 'Expirado',
};
const plural = (n, um, varios) => `${fmt(n)} ${Number(n) === 1 ? um : varios}`;
const Situacao = ({ valor }) => <span className={`situacao situacao-${valor}`}>{ROTULO[valor] || valor}</span>;

export default function Patrocinador() {
  const { usuario } = useAuth();
  const { avisar } = useOutletContext();
  const [painel, setPainel] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('desafios');
  const [form, setForm] = useState(null); // { tipo: 'desafio' | 'recompensa', item? }
  const [vouchers, setVouchers] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const fechar = useCallback(() => setForm(null), []);

  const carregar = useCallback(() => {
    api('/patrocinador').then(setPainel).catch((e) => setErro(e.message));
  }, []);
  const carregarVouchers = useCallback(() => {
    api('/patrocinador/resgates').then(setVouchers).catch(() => setVouchers([]));
  }, []);

  useEffect(() => { if (usuario.id_patrocinador) carregar(); }, [usuario.id_patrocinador, carregar]);
  useEffect(() => { if (aba === 'vouchers' && usuario.id_patrocinador) carregarVouchers(); }, [aba, usuario.id_patrocinador, carregarVouchers]);

  if (!usuario.id_patrocinador) return <Navigate to="/" replace />;

  function salvo(tipo) {
    return (_item, novo) => {
      setForm(null);
      carregar();
      avisar(novo ? `${tipo === 'desafio' ? 'Desafio publicado' : 'Recompensa publicada'}!` : 'Alterações salvas.');
    };
  }

  async function acao(caminho, metodo, pergunta, mensagem) {
    if (pergunta && !confirm(pergunta)) return;
    setOcupado(caminho);
    try {
      await api(caminho, { method: metodo });
      avisar(mensagem);
      carregar();
    } catch (e) {
      avisar(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function darBaixa(e) {
    e.preventDefault();
    const c = codigo.trim().toUpperCase();
    if (!c) return;
    setOcupado('voucher');
    try {
      await api(`/patrocinador/resgates/${encodeURIComponent(c)}/usar`, { method: 'POST' });
      avisar(`Voucher ${c} marcado como usado.`);
      setCodigo('');
      carregarVouchers();
      carregar();
    } catch (err) {
      avisar(err.message);
    } finally {
      setOcupado(null);
    }
  }

  const desafios = painel?.desafios || [];
  const recompensas = painel?.recompensas || [];
  const ativos = desafios.filter((d) => d.situacao === 'ativo').length;
  const participantes = desafios.reduce((t, d) => t + Number(d.participantes), 0);
  const resgates = recompensas.reduce((t, r) => t + Number(r.resgates), 0);
  const pontos = recompensas.reduce((t, r) => t + Number(r.pontos_trocados), 0);

  return (
    <div className="conteudo patrocinador">
      <div className="coluna-principal">
        <div className="cabecalho-pagina">
          <div>
            <small className="sobretitulo">Painel do patrocinador</small>
            <h1>{painel?.empresa?.razao_social || 'Sua empresa'}</h1>
            <p className="texto-suave">Crie desafios e recompensas para a comunidade e acompanhe o engajamento.</p>
          </div>
        </div>

        {erro && <p className="erro">{erro}</p>}
        {!painel && !erro && <p className="vazio">Carregando…</p>}

        {painel && (<>
          <section className="impacto-grade" aria-label="Resumo">
            <div><Icone nome="award" /><strong>{fmt(ativos)}</strong><small>{ativos === 1 ? 'Desafio ativo' : 'Desafios ativos'}</small></div>
            <div><Icone nome="users" /><strong>{fmt(participantes)}</strong><small>Participantes nos desafios</small></div>
            <div><Icone nome="ticket" /><strong>{fmt(resgates)}</strong><small>Vouchers resgatados</small></div>
            <div><Icone nome="leaf" /><strong>{fmt(pontos)}</strong><small>Pontos trocados com você</small></div>
          </section>

          <div className="linha-entre painel-abas">
            <div className="chips" role="tablist">
              {[['desafios', 'Desafios'], ['recompensas', 'Recompensas'], ['vouchers', 'Vouchers']].map(([id, nome]) => (
                <button key={id} type="button" className="chip" role="tab" aria-pressed={aba === id} aria-selected={aba === id} onClick={() => setAba(id)}>{nome}</button>
              ))}
            </div>
            {aba === 'desafios' && <button className="btn btn-primario btn-pequeno" onClick={() => setForm({ tipo: 'desafio' })}><Icone nome="plus" tamanho={16} />Novo desafio</button>}
            {aba === 'recompensas' && <button className="btn btn-primario btn-pequeno" onClick={() => setForm({ tipo: 'recompensa' })}><Icone nome="plus" tamanho={16} />Nova recompensa</button>}
          </div>

          {aba === 'desafios' && (desafios.length === 0
            ? <p className="vazio">Você ainda não criou desafios. Que tal o primeiro?</p>
            : <div className="painel-lista">
              {desafios.map((d) => {
                const caminho = `/patrocinador/desafios/${d.id_desafio}`;
                return (
                  <article key={d.id_desafio} className="card painel-item">
                    <div className="linha-entre"><Situacao valor={d.situacao} /><small className="texto-suave">{dataBR(d.data_inicio)} a {dataBR(d.data_fim)}</small></div>
                    <h3>{d.titulo}</h3>
                    {d.descricao && <p className="texto-suave">{d.descricao}</p>}
                    <small className="texto-suave">{d.categoria} · meta de {plural(d.meta_acoes, 'ação', 'ações')} · +{fmt(d.pontos_bonus)} pts de bônus</small>
                    <div className="painel-numeros">
                      <span><strong>{fmt(d.participantes)}</strong> {Number(d.participantes) === 1 ? 'participante' : 'participantes'}</span>
                      <span><strong>{fmt(d.acoes_validadas)}</strong> {Number(d.acoes_validadas) === 1 ? 'ação validada' : 'ações validadas'}</span>
                      <span><strong>{fmt(d.concluintes)}</strong> {Number(d.concluintes) === 1 ? 'concluiu' : 'concluíram'}</span>
                    </div>
                    <div className="painel-acoes">
                      <button className="btn btn-secundario btn-pequeno" onClick={() => setForm({ tipo: 'desafio', item: d })}><Icone nome="edit" tamanho={16} />Editar</button>
                      {d.situacao !== 'encerrado' && (
                        <button className="btn btn-secundario btn-pequeno" disabled={ocupado === `${caminho}/encerrar`}
                          onClick={() => acao(`${caminho}/encerrar`, 'POST', `Encerrar "${d.titulo}"? Ele sai da lista de desafios na hora.`, 'Desafio encerrado.')}>Encerrar</button>
                      )}
                      {Number(d.participantes) === 0 && (
                        <button className="btn btn-secundario btn-pequeno painel-apagar" disabled={ocupado === caminho}
                          onClick={() => acao(caminho, 'DELETE', `Apagar "${d.titulo}"? Não dá para desfazer.`, 'Desafio apagado.')}><Icone nome="lixeira" tamanho={16} />Apagar</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>)}

          {aba === 'recompensas' && (recompensas.length === 0
            ? <p className="vazio">Você ainda não criou recompensas.</p>
            : <div className="painel-lista">
              {recompensas.map((r) => {
                const caminho = `/patrocinador/recompensas/${r.id_recompensa}`;
                return (
                  <article key={r.id_recompensa} className="card painel-item">
                    <div className="linha-entre"><Situacao valor={r.situacao} /><small className="texto-suave">Válida até {dataBR(r.validade)}</small></div>
                    <h3>{r.titulo}</h3>
                    {r.descricao && <p className="texto-suave">{r.descricao}</p>}
                    <small className="texto-suave">{fmt(r.custo_pontos)} pts · {fmt(r.estoque)} em estoque</small>
                    <div className="painel-numeros">
                      <span><strong>{fmt(r.resgates)}</strong> {Number(r.resgates) === 1 ? 'resgate' : 'resgates'}</span>
                      <span><strong>{fmt(r.usados)}</strong> {Number(r.usados) === 1 ? 'usado' : 'usados'} no balcão</span>
                      <span><strong>{fmt(r.pontos_trocados)}</strong> pts trocados</span>
                    </div>
                    <div className="painel-acoes">
                      <button className="btn btn-secundario btn-pequeno" onClick={() => setForm({ tipo: 'recompensa', item: r })}><Icone nome="edit" tamanho={16} />Editar</button>
                      {r.situacao !== 'encerrada' && (
                        <button className="btn btn-secundario btn-pequeno" disabled={ocupado === `${caminho}/encerrar`}
                          onClick={() => acao(`${caminho}/encerrar`, 'POST', `Tirar "${r.titulo}" da vitrine? Quem já resgatou continua com o voucher.`, 'Recompensa encerrada.')}>Encerrar</button>
                      )}
                      {Number(r.resgates) === 0 && (
                        <button className="btn btn-secundario btn-pequeno painel-apagar" disabled={ocupado === caminho}
                          onClick={() => acao(caminho, 'DELETE', `Apagar "${r.titulo}"? Não dá para desfazer.`, 'Recompensa apagada.')}><Icone nome="lixeira" tamanho={16} />Apagar</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>)}

          {aba === 'vouchers' && (<>
            <form className="card painel-voucher" onSubmit={darBaixa}>
              <label className="campo">
                Código apresentado pelo cliente
                <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="CRT-XXXX" maxLength={12} spellCheck={false} />
              </label>
              <button className="btn btn-primario" disabled={!codigo.trim() || ocupado === 'voucher'}>{ocupado === 'voucher' ? '…' : 'DAR BAIXA'}</button>
            </form>
            {vouchers === null && <p className="vazio">Carregando…</p>}
            {vouchers?.length === 0 && <p className="vazio">Nenhum voucher resgatado ainda.</p>}
            {vouchers?.length > 0 && (
              <section className="card admin-lista" aria-label="Vouchers">
                {vouchers.map((v) => (
                  <div className="admin-linha" key={v.id_resgate}>
                    <Icone nome="ticket" />
                    <div className="admin-linha-corpo">
                      <strong>{v.codigo_voucher} · {v.titulo}</strong>
                      <small className="texto-suave">{v.nome} (@{v.usuario}) · {new Date(v.data_resgate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small>
                    </div>
                    <Situacao valor={v.status} />
                  </div>
                ))}
              </section>
            )}
          </>)}
        </>)}
      </div>

      <aside className="coluna-lateral">
        <section className="card lista-card">
          <h2 className="card-titulo">Como funciona</h2>
          {[
            'Crie um desafio: a comunidade registra ações da categoria e vincula ao seu desafio.',
            'Crie recompensas: as pessoas trocam pontos por elas e recebem um código.',
            'No balcão, digite o código na aba Vouchers para dar baixa.',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span className="avatar" style={{ width: 28, height: 28, fontSize: 13, borderColor: 'var(--superficie-2)' }}>{i + 1}</span>
              <p className="texto-suave" style={{ fontSize: 13 }}>{t}</p>
            </div>
          ))}
        </section>
        <section className="card lista-card">
          <h2 className="card-titulo">Encerrar ou apagar?</h2>
          <p className="texto-suave" style={{ fontSize: 13 }}>
            <strong>Encerrar</strong> tira do ar na hora e mantém o histórico. <strong>Apagar</strong> só aparece enquanto ninguém participou ou resgatou.
          </p>
        </section>
      </aside>

      {form?.tipo === 'desafio' && <FormDesafio desafio={form.item} aoFechar={fechar} aoSalvar={salvo('desafio')} />}
      {form?.tipo === 'recompensa' && <FormRecompensa recompensa={form.item} aoFechar={fechar} aoSalvar={salvo('recompensa')} />}
    </div>
  );
}
