"use client";
import { MotionConfig } from "framer-motion";

/**
 * Configuração global de movimento.
 *
 * O `globals.css` já tem um bloco `prefers-reduced-motion` — mas ele só
 * alcança animação de CSS. O framer-motion escreve `style` inline via JS e
 * passa por cima da media query: componentes com `repeat: Infinity` continuam
 * se mexendo mesmo com o sistema pedindo menos movimento. O próprio comentário
 * no CSS aponta esta como a correção limpa, e é o que este arquivo faz.
 *
 * `reducedMotion="user"` manda o framer-motion respeitar a preferência do
 * sistema em TODA animação da árvore: ele zera transform/layout e mantém só
 * opacidade. Isso resolve de uma vez o que antes exigia `useReducedMotion()`
 * na mão em cada componente — e é também o que deixa o app leve em máquina
 * fraca, porque os laços infinitos param de gerar quadros.
 *
 * `transition` define a curva da casa como padrão: a mesma
 * `cubic-bezier(.22,1,.36,1)` do CSS. Sem isso cada componente reinventa a
 * própria curva e o app fica com meia dúzia de "sensações" diferentes.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionConfig>
  );
}
