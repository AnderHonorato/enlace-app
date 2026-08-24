// Ícones próprios da retrospectiva.
//
// Por que não usar a lucide aqui: a retrospectiva é uma experiência de marca,
// em tela cheia, e ícones de biblioteca entregam "aparência de app genérico".
// Estes são desenhados com o mesmo vocabulário do resto do Enlace — traço
// arredondado, cantos macios, e um coração escondido onde dá — para a tela ter
// identidade própria em vez de parecer o padrão do navegador.

type IconProps = {
  size?: number;
  className?: string;
  /** Espessura do traço. O padrão combina com textos em tela cheia. */
  weight?: number;
};

// O desenho base é o mesmo do conjunto do site (Icones.tsx) — manter duas
// cópias fazia os dois conjuntos divergirem em espessura e alinhamento com o
// tempo. Aqui ficam só os ícones exclusivos da retrospectiva.
import { Svg } from "./Icones";

/** Pausa — duas pétalas em vez de dois retângulos duros. */
export function IconPause(p: IconProps) {
  return (
    <Svg {...p} filled>
      <path d="M8.4 3.6c1.2 0 2 .9 2 2.1v12.6c0 1.2-.8 2.1-2 2.1s-2-.9-2-2.1V5.7c0-1.2.8-2.1 2-2.1Z" />
      <path d="M15.6 3.6c1.2 0 2 .9 2 2.1v12.6c0 1.2-.8 2.1-2 2.1s-2-.9-2-2.1V5.7c0-1.2.8-2.1 2-2.1Z" />
    </Svg>
  );
}

/** Play — triângulo com cantos arredondados. */
export function IconPlay(p: IconProps) {
  return (
    <Svg {...p} filled>
      <path d="M8.2 4.3c-1 .6-1.7 1.4-1.7 2.5v10.4c0 1.7 1.8 2.7 3.2 1.9l8.1-4.9c1.4-.9 1.4-2.9 0-3.8L9.7 5.5c-.5-.3-1-.5-1.5-1.2Z" />
    </Svg>
  );
}

/** Fechar — dois traços com pontas macias. */
export function IconClose(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" />
    </Svg>
  );
}

/** Música — nota dupla com a cabeça em forma de coração. */
export function IconMusic(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 18V6.6c0-.5.3-.9.8-1l7-1.5c.6-.2 1.2.3 1.2 1V14" />
      <path d="M10 18a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" fill="currentColor" stroke="none" />
      <path d="M19 14a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Filme — claquete simplificada, para "baixar em vídeo". */
export function IconFilm(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2.6" y="6.4" width="18.8" height="12.4" rx="3.2" />
      <path d="M2.6 10.6h18.8" />
      <path d="M7.4 6.6 9 10.4M12.4 6.6 14 10.4M17.2 6.6 18.8 10.4" />
    </Svg>
  );
}

/** Imagem — moldura com sol e horizonte. */
export function IconPicture(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4.4" width="18" height="15.2" rx="3.4" />
      <circle cx="8.6" cy="9.6" r="1.7" fill="currentColor" stroke="none" />
      <path d="M4.2 17.4l4.3-4a2 2 0 0 1 2.7 0l2.2 2.1a2 2 0 0 0 2.7.1l2.6-2.3" />
    </Svg>
  );
}

/** Rever — seta circular. */
export function IconReplay(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 11.6a8 8 0 1 1-2.6-5.6" />
      <path d="M20.4 4.2v4.6h-4.6" />
    </Svg>
  );
}

/** Busca — lupa com cabo curto. */
export function IconSearch(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="M15.6 15.6 20 20" />
    </Svg>
  );
}

/** Carregando — arco. Aplique `animate-spin` no className. */
export function IconSpinner(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.4a8.6 8.6 0 1 0 8.6 8.6" opacity="0.95" />
    </Svg>
  );
}

/** Compartilhar — nó com três pontos. */
export function IconShare(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="17.6" cy="5.8" r="2.6" />
      <circle cx="6.4" cy="12" r="2.6" />
      <circle cx="17.6" cy="18.2" r="2.6" />
      <path d="M8.8 10.7 15.2 7.1M8.8 13.3l6.4 3.6" />
    </Svg>
  );
}

/** Coração — usado em contagens e no fim da retrospectiva. */
export function IconHeart({ filled = true, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...p} filled={filled}>
      <path d="M12 20.4c-.4 0-.8-.2-1-.4l-6.6-6.5a5.9 5.9 0 0 1 0-8.2 5.6 5.6 0 0 1 7.6 0 5.6 5.6 0 0 1 7.6 0 5.9 5.9 0 0 1 0 8.2L13 20a1.4 1.4 0 0 1-1 .4Z" />
    </Svg>
  );
}

/** Seta para avançar/voltar entre perguntas. */
export function IconChevron({ dir = "right", ...p }: IconProps & { dir?: "left" | "right" }) {
  return (
    <Svg {...p}>
      <path d={dir === "right" ? "M9.4 5.6 16 12l-6.6 6.4" : "M14.6 5.6 8 12l6.6 6.4"} />
    </Svg>
  );
}

/** Check — confirmação de resposta escolhida. */
export function IconCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.8 12.6l4.4 4.4L19.2 7" />
    </Svg>
  );
}

/** Balão de conversa — cabeçalho das perguntas. */
export function IconBubble(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.6 11.4c0 4-3.9 7.2-8.6 7.2-.9 0-1.8-.1-2.6-.3l-4.4 2 1.3-3.6a6.9 6.9 0 0 1-2.9-5.3c0-4 3.8-7.2 8.6-7.2s8.6 3.2 8.6 7.2Z" />
    </Svg>
  );
}
