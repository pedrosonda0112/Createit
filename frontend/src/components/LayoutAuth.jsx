// Lado esquerdo do login/cadastro: marca, carpas, slogan e respingos
const respingos = [[6,6,9],[12,13,4],[3,20,5],[17,4,3],[8,30,3],[89,7,7],[83,15,3.5],[94,23,5],[78,4,2.5],[90,34,3],[7,84,6],[14,92,3],[86,88,7],[93,80,3]];

export default function LayoutAuth({ children }) {
  return (
    <div className="auth">
      <section className="auth-marca">
        <svg className="respingos" aria-hidden="true">
          {respingos.map(([x, y, r], i) => <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="var(--gelo)" opacity=".5" />)}
        </svg>
        <img className="logo" src="/logo-arvore.png" alt="" />
        <h1>CREATE IT</h1>
        <img className="carpas" src="/carpas.png" alt="" />
        <p className="slogan">SEJA O PRIMEIRO A QUEBRAR O CICLO</p>
      </section>
      <section className="auth-painel">{children}</section>
    </div>
  );
}
