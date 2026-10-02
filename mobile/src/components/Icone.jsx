// Ícones de traço (mesmos do protótipo no Figma e do front-end web)
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { cor } from '../lib/tema.js';

const P = {
  home: <Path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  search: <><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></>,
  award: <><Circle cx="12" cy="9" r="6" /><Path d="M8.5 14 7 22l5-3 5 3-1.5-8" /></>,
  gift: <><Rect x="3" y="8" width="18" height="4" rx="1" /><Path d="M5 12v9h14v-9M12 8v13" /><Path d="M12 8C10 4 7 3.5 6.5 5.5S9 8 12 8zM12 8c2-4 5-4.5 5.5-2.5S15 8 12 8z" /></>,
  user: <><Circle cx="12" cy="8" r="4" /><Path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  plus: <Path d="M12 5v14M5 12h14" />,
  leaf: <><Path d="M5 20c0-9 6-15 15-15 0 9-6 15-15 15z" /><Path d="M5 20l8-8" /></>,
  heart: <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  comment: <Path d="M4 5h16v11H9l-5 4z" />,
  share: <Path d="M4 13v7h16v-7M12 3v12M7 8l5-5 5 5" />,
  camera: <><Path d="M4 8h3l2-3h6l2 3h3v11H4z" /><Circle cx="12" cy="13" r="3.5" /></>,
  image: <><Rect x="3" y="4" width="18" height="16" rx="2" /><Circle cx="9" cy="10" r="2" /><Path d="M21 16l-5-5-9 9" /></>,
  recycle: <Path d="M7 19H4l3-5M17 19h3l-3-5M9 5l3-2 3 2M8 14l-2-3.5M16 14l2-3.5M12 3v4" />,
  bus: <><Rect x="5" y="3" width="14" height="14" rx="2" /><Path d="M5 11h14M8 20v-3M16 20v-3" /></>,
  drop: <Path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  bolt: <Path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  pin: <><Path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" /><Circle cx="12" cy="9" r="2.5" /></>,
  logout: <Path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  x: <Path d="M6 6l12 12M18 6L6 18" />,
  voltar: <Path d="M19 12H5M11 6l-6 6 6 6" />,
  lixeira: <><Path d="M4 7h16M10 11v6M14 11v6" /><Path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  clock: <><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>,
  ticket: <Path d="M3 8a2 2 0 0 0 0 4 2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z" />,
  star: <Path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  users: <><Circle cx="9" cy="8" r="3.5" /><Path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><Path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.5 2.3 3.5 5.2" /></>,
  edit: <Path d="M4 20h4L19 9l-4-4L4 16z" />,
};

export default function Icone({ nome, tamanho = 20, cor: corTraco = cor.texto, preenchido = false, espessura = 1.8 }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={preenchido ? corTraco : 'none'} stroke={corTraco}
      strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round">
      {P[nome]}
    </Svg>
  );
}
