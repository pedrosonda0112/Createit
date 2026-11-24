export default function LayoutAuth({ children }) {
  return <div className="auth">
    <section className="auth-marca">
      <img className="logo" src="/marca-arvore-verde.png" alt="" />
      <h1>CREATE IT</h1>
      <p className="slogan">O FUTURO NAS SUAS MÃOS</p>
    </section>
    <section className="auth-painel">{children}</section>
  </div>;
}
