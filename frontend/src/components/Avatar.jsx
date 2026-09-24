import { iniciais } from '../util.js';

export default function Avatar({ nome, tamanho = 40 }) {
  return (
    <span className="avatar" style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.36) }}>
      {iniciais(nome)}
    </span>
  );
}
