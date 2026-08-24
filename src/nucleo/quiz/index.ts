// Registro das categorias de conhecimento.
//
// Adicionar uma categoria nova = criar o arquivo de perguntas e incluir aqui.
// O hub de jogos monta os cards a partir desta lista, então nenhum componente
// precisa ser editado.

import { GEOGRAFIA } from "./geografia";
import { ASTRONOMIA } from "./astronomia";
import { HISTORIA } from "./historia";
import { CIENCIA } from "./ciencia";
import { DIREITO } from "./direito";
import { PORTUGUES } from "./portugues";
import type { PacoteQuiz } from "./tipos";

export const PACOTES: PacoteQuiz[] = [GEOGRAFIA, ASTRONOMIA, HISTORIA, CIENCIA, DIREITO, PORTUGUES];

export * from "./tipos";
