// Vocabulário de perguntas do motor de quiz.
//
// A ideia central: categorias como Geografia, Astronomia, História, Ciência,
// Português, Direito ou Excel são o MESMO jogo por baixo — muda só o conteúdo.
// Em vez de um componente por categoria (que foi como os quizzes antigos
// nasceram), cada categoria vira um arquivo de dados tipado e o
// `MotorQuiz` cuida de sorteio, cronologia da revelação, XP e placar.
//
// Para criar uma categoria nova: escreva um arquivo de perguntas, exporte um
// `PacoteQuiz` e registre em `./index.ts`. Nenhum componente precisa mudar.

import type { LucideIcon } from "lucide-react";

/** Cor semântica do jogo — sempre um token de tema, nunca um hex cravado. */
export type AccentToken = "accent" | "accent2" | "warning" | "success" | "danger";

/** Múltipla escolha. O formato mais comum: bandeiras, capitais, datas, funções. */
export type PerguntaEscolha = {
  tipo: "escolha";
  enunciado: string;
  /** Emoji ou símbolo exibido grande acima do enunciado (bandeira, planeta…). */
  simbolo?: string;
  /**
   * A ordem aqui é irrelevante: o motor embaralha as opções na hora de montar a
   * rodada e recalcula o índice da correta. Pode deixar a resposta em primeiro.
   */
  opcoes: string[];
  correta: number;
  explicacao?: string;
};

/** "Mito ou Fato?", "Direito ou Mito?" — afirmação para julgar verdadeira ou falsa. */
export type PerguntaVF = {
  tipo: "vf";
  afirmacao: string;
  simbolo?: string;
  verdadeiro: boolean;
  /** Obrigatória: o valor deste formato está na explicação que vem depois. */
  explicacao: string;
};

/** "Quem veio primeiro?", "Ordem Cósmica" — colocar itens na sequência certa. */
export type PerguntaOrdem = {
  tipo: "ordem";
  enunciado: string;
  /** Já na ordem correta — o motor embaralha para o jogador reorganizar. */
  itens: string[];
  /** O que significa "primeiro" aqui (ex.: "mais antigo", "maior"). */
  dicaOrdem?: string;
  explicacao?: string;
};

/** "Personagem Misterioso", "Adivinhe em 3 pistas" — quanto menos pistas, mais XP. */
export type PerguntaPistas = {
  tipo: "pistas";
  /** Reveladas uma a uma, na ordem escrita: da mais vaga para a mais óbvia. */
  pistas: string[];
  opcoes: string[];
  correta: number;
  explicacao?: string;
};

export type Pergunta = PerguntaEscolha | PerguntaVF | PerguntaOrdem | PerguntaPistas;

export type PacoteQuiz = {
  /** Identificador estável — vira a chave do jogo no hub. */
  key: string;
  /** Parte sem destaque do título ("Viagem no"). Pode ser vazia. */
  titulo: string;
  /** Parte com gradiente do título ("Tempo"). */
  destaque: string;
  /** Frase curta no card do hub. */
  desc: string;
  icone: LucideIcon;
  accent: AccentToken;
  /**
   * Aviso exibido antes da primeira pergunta. Existe para categorias que
   * precisam de ressalva — Direito, por exemplo, é entretenimento e não
   * substitui orientação profissional.
   */
  aviso?: string;
  perguntas: Pergunta[];
};
