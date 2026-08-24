// Missões do casal.
//
// Duas camadas, de propósito:
//  • DESAFIO DA SEMANA — um só, igual para os dois, gira toda semana. É o
//    "tem coisa nova hoje?" que traz a pessoa de volta.
//  • MISSÕES DO DIA — do mesmo catálogo, mas trocam diariamente, para quem
//    quer algo pra fazer sem esperar a semana virar.

export type MissionKind = "escrita" | "foto" | "conversa" | "gesto" | "plano" | "jogo" | "cuidado";
export type MissionLevel = "leve" | "média" | "ousada";

export type Mission = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  kind: MissionKind;
  level: MissionLevel;
  /** Pontos ao concluir. */
  points: number;
  /** Tag sugerida para marcar a memória e fechar a missão. */
  tag?: string;
};

/** Pontos por dificuldade — mantém a recompensa coerente. */
export const MISSION_POINTS: Record<MissionLevel, number> = { leve: 5, média: 10, ousada: 20 };

export const KIND_LABEL: Record<MissionKind, string> = {
  escrita: "Escrever",
  foto: "Fotografar",
  conversa: "Conversar",
  gesto: "Fazer",
  plano: "Planejar",
  jogo: "Brincar",
  cuidado: "Cuidar",
};

const m = (
  id: string,
  emoji: string,
  title: string,
  desc: string,
  kind: MissionKind,
  level: MissionLevel,
  tag?: string
): Mission => ({ id, emoji, title, desc, kind, level, points: MISSION_POINTS[level], tag });

export const MISSIONS: Mission[] = [
  // ── Escrita ──
  m("sonho", "💭", "Escrevam sobre um sonho", "Um sonho que vocês querem viver juntos — sem filtro de realidade.", "escrita", "leve", "sonho"),
  m("elogios", "💝", "Três elogios sinceros", "Três coisas que você admira nela ou nele. Específicas, não genéricas.", "escrita", "leve", "elogio"),
  m("comeco", "🕰️", "Relembrem o começo", "Como foi o dia em que vocês se conheceram? Conte a sua versão.", "escrita", "média", "comeco"),
  m("gratidao", "🙏", "Gratidão da semana", "Pelo que você é grato nessa semana com seu amor?", "escrita", "leve", "gratidao"),
  m("risada", "😂", "A risada da semana", "Qual foi a coisa mais engraçada que aconteceu com vocês?", "escrita", "leve", "risada"),
  m("carta", "💌", "Uma mini carta", "Escreva algo que você quer que ele ou ela leia hoje.", "escrita", "média", "carta"),
  m("medo", "🫂", "Um medo dividido", "Algo que te assusta e que você quer que a outra pessoa saiba.", "escrita", "ousada", "medo"),
  m("perdao", "🤍", "Um pedido de desculpa", "Algo pequeno que ficou entalado. Escrever é mais fácil que falar.", "escrita", "ousada", "perdao"),
  m("orgulho", "🌟", "Do que você tem orgulho", "Um momento em que você se orgulhou dela ou dele.", "escrita", "média", "orgulho"),
  m("futuro", "🔮", "Carta pro futuro", "Escreva para vocês daqui dez anos. Vale cápsula do tempo.", "escrita", "ousada", "futuro"),
  m("dia-comum", "☕", "Um dia comum", "Descreva um dia sem nada de especial. É o que dá mais saudade depois.", "escrita", "leve", "rotina"),
  m("primeira-vez", "✨", "Uma primeira vez", "A primeira viagem, o primeiro medo, a primeira briga boba.", "escrita", "média", "primeira"),

  // ── Foto ──
  m("foto-comum", "📸", "Uma foto do dia comum", "Registrem um momento simples que valeu a pena.", "foto", "leve", "rotina"),
  m("foto-antiga", "🖼️", "Uma foto antiga", "Subam uma foto de antes do Enlace e conte a história dela.", "foto", "leve", "antiga"),
  m("mesmo-lugar", "📍", "Mesmo lugar, outro dia", "Voltem a um lugar especial e refaçam a foto.", "foto", "ousada", "lugar"),
  m("maos", "🤝", "Só as mãos", "Uma foto só das mãos de vocês. Simples e desmonta qualquer um.", "foto", "leve", "maos"),
  m("comida", "🍳", "O que vocês comeram", "Fotografem uma refeição feita ou dividida por vocês.", "foto", "leve", "comida"),
  m("ceu", "🌅", "O céu de hoje", "Os dois fotografam o céu do mesmo dia, de onde estiverem.", "foto", "média", "ceu"),

  // ── Conversa ──
  m("pergunta-dificil", "🃏", "Uma pergunta difícil", "Use a Juno e levem a conversa até onde vocês não costumam ir.", "conversa", "ousada"),
  m("como-esta", "💬", 'Um "como você está?" de verdade', "Sem pressa e sem celular na mão. Depois registrem como foi.", "conversa", "média"),
  m("audio", "🎙️", "Mandem um áudio", "Grave um recado de voz na memória em vez de escrever.", "conversa", "leve", "audio"),
  m("leitura", "📖", "Leiam uma memória antiga", "Abram o diário numa memória velha e conversem sobre ela.", "conversa", "leve"),

  // ── Gesto ──
  m("surpresa", "🎁", "Uma surpresa pequena", "Nada caro. Algo que mostre que você prestou atenção.", "gesto", "média"),
  m("tarefa-do-outro", "🧹", "Faça a tarefa do outro", "Assuma hoje aquela tarefa que normalmente é dele ou dela.", "gesto", "média"),
  m("sem-celular", "📵", "Uma hora sem celular", "Uma hora inteira só vocês dois. Depois contem o que rolou.", "gesto", "ousada"),
  m("bilhete", "🗒️", "Um bilhete escondido", "Deixe um papel escrito onde a pessoa vai encontrar sozinha.", "gesto", "leve"),
  m("musica", "🎧", "Uma música pra ela ou ele", "Escolham uma música que traduza a semana e salvem na retrospectiva.", "gesto", "leve", "musica"),

  // ── Plano ──
  m("plano-dois", "🎯", "Um plano pra dois", "Escrevam um plano pros próximos meses — com data, não só vontade.", "plano", "média", "planos"),
  m("lista-desejos", "⭐", "Três desejos na lista", "Adicionem três coisas na lista de desejos de vocês.", "plano", "leve"),
  m("capsula", "⏳", "Lacrem uma cápsula", "Escrevam algo que só vai abrir numa data futura.", "plano", "ousada"),
  m("orcamento", "💰", "O plano que precisa de dinheiro", "Escolham um sonho e definam quanto guardar por mês.", "plano", "ousada"),

  m("carta-brava", "🌩️", "A carta que você não mandou", "Escreva o que ficou preso na garganta numa discussão — e leia junto depois.", "escrita", "ousada", "sinceridade"),
  m("apelido", "🏷️", "A história do apelido", "De onde saiu aquele apelido bobo que só vocês usam?", "escrita", "leve", "apelido"),
  m("manias", "🔍", "As manias dela ou dele", "Cinco manias que você já sabe de cor. Vale rir.", "escrita", "leve", "manias"),
  m("se-eu-soubesse", "🧭", "Se eu soubesse antes", "O que você diria pra você mesmo no começo do relacionamento?", "escrita", "média", "reflexao"),

  // ── Foto ──
  m("foto-dorminhoco", "😴", "Flagra dormindo", "Aquela foto proibida de quem cochilou primeiro no sofá.", "foto", "leve", "flagra"),
  m("foto-espelho", "🪞", "A selfie no espelho", "Clássica, brega e eterna. Façam uma hoje.", "foto", "leve", "selfie"),
  m("foto-detalhe", "🔎", "Um detalhe da casa", "Fotografem um cantinho da casa que conta algo sobre vocês dois.", "foto", "leve", "casa"),
  m("foto-antes-depois", "⏳", "Antes e depois", "Subam uma foto de vocês há anos e uma de hoje, lado a lado.", "foto", "média", "antesdepois"),

  // ── Conversa ──
  m("pergunta-do-dia", "🗓️", "A pergunta do dia", "Respondam juntos a pergunta do dia — cada um a sua versão.", "conversa", "leve", "pergunta"),
  m("juno-provoca", "🤖", "Deixem a IA provocar", "Peçam uma pergunta difícil a um dos personagens e encarem a resposta.", "conversa", "média"),
  m("ligacao", "📞", "Uma ligação sem motivo", "Ligue no meio do dia só para ouvir a voz. Depois registrem.", "conversa", "leve"),
  m("radio-conversa", "📻", "A música que explica", "Cada um escolhe uma música na Rádio e explica por que aquela.", "conversa", "leve", "musica"),
  m("ao-vivo", "📡", "Se achem no mapa", "Liguem a localização ao vivo e se encontrem em algum lugar novo.", "conversa", "ousada", "encontro"),

  // ── Gesto ──
  m("cafe-na-cama", "☕", "Café na cama", "Um dos dois acorda antes e leva o café. Sem avisar.", "gesto", "média"),
  m("playlist", "🎵", "Uma playlist inteira", "Montem juntos uma playlist de sete músicas na Rádio do casal.", "gesto", "média", "musica"),
  m("massagem", "💆", "Dez minutos de massagem", "Sem pressa e sem celular. Depois contem como foi.", "gesto", "leve"),
  m("cozinhar", "👩‍🍳", "Cozinhem algo novo", "Uma receita que nenhum dos dois nunca fez. Fotografem o resultado.", "gesto", "ousada", "comida"),
  m("carinho-bichinho", "🐈", "Cuidem do bichinho", "Registrem uma memória hoje para o gatinho de vocês não ficar carente.", "gesto", "leve"),

  // ── Plano ──
  m("viagem-barata", "🎒", "A viagem mais barata possível", "Planejem um rolê de fim de semana gastando quase nada.", "plano", "média", "planos"),
  m("meta-mes", "📈", "Uma meta pro mês", "Definam uma meta de casal com prazo até o fim do mês.", "plano", "leve", "meta"),
  m("mapa-novo", "🗺️", "Um lugar novo no mapa", "Escolham um lugar que vocês nunca marcaram e vão até lá.", "plano", "ousada", "lugar"),
  m("ritual", "🔁", "Inventem um ritual", "Algo que vocês passem a fazer toda semana, sempre igual.", "plano", "média", "ritual"),

  // ── Jogo ──
  m("wordle", "🎮", "A palavra de vocês", "Joguem a Palavra do dia e registrem quem acertou primeiro.", "jogo", "leve"),
  m("roleta", "🎡", "Girem a roleta", "Deixem a roleta decidir o programa e cumpram o que cair.", "jogo", "média"),
  m("quiz", "❓", "Quem conhece mais", "Respondam as perguntas da retrospectiva e comparem.", "jogo", "leve"),
  m("verdade-desafio", "🔥", "Verdade ou desafio", "Uma rodada honesta do Jogo da Verdade. Sem fugir das cartas.", "jogo", "ousada"),
  m("velha-amor", "⭕", "Melhor de três", "Jogo da Velha do Amor: quem perder paga a próxima sobremesa.", "jogo", "leve"),
  m("stop", "🅰️", "Uma rodada de Stop", "Stop/Adedonha com categorias de casal. Vale competir sério.", "jogo", "leve"),
  m("adivinhe-musica", "🎼", "Adivinhem a música", "Quem acerta mais no Adivinhe a Música paga o cinema.", "jogo", "leve"),
  m("filme-emoji", "🎬", "Filme em emojis", "Quiz de filme por emoji — descubram quem assiste mais.", "jogo", "leve"),
  m("caca-tesouro", "🗝️", "Caça ao tesouro", "Sigam as pistas escondidas nas páginas do diário até o fim.", "jogo", "ousada"),
  m("relampago", "⚡", "Desafio relâmpago", "Sessenta segundos de desafio. Sem pensar demais.", "jogo", "média"),
  m("campanha", "🏅", "Avancem uma fase", "Passem de mais uma fase do Modo Campanha juntos.", "jogo", "média"),
  m("frase", "✍️", "Completem a frase", "Cada um completa a mesma frase sem ver a do outro. Comparem.", "jogo", "leve"),

  // ── Cuidado ──
  m("check-in", "🌡️", "Check-in do casal", "De 0 a 10, como está a relação essa semana? Digam e justifiquem.", "cuidado", "média", "checkin"),
  m("limite", "🛑", "Um limite dito com calma", "Algo que te incomoda, falado sem briga. Registrem o combinado.", "cuidado", "ousada", "combinado"),
  m("obrigado", "💐", "Agradeça uma coisa invisível", "Aquele esforço que ninguém vê e você nunca agradeceu.", "cuidado", "leve", "gratidao"),
  m("descanso", "🛋️", "Um dia sem produtividade", "Nada de tarefa, meta ou planejamento. Só existir junto.", "cuidado", "média"),
  m("sozinho", "🌿", "Tempo sozinho, sem culpa", "Cada um faz algo sozinho hoje — e conta depois como foi.", "cuidado", "leve"),
  m("perdao-real", "🕊️", "Fechem uma pendência", "Aquele assunto que vocês vêm empurrando. Resolvam hoje.", "cuidado", "ousada", "combinado"),
];

/** Índice por id. */
export const missionMap = Object.fromEntries(MISSIONS.map((x) => [x.id, x]));

/** Compatibilidade com o formato antigo do card de desafio da semana. */
export const CHALLENGES = MISSIONS.map((x) => ({ emoji: x.emoji, title: x.title, desc: x.desc }));

/** Número da semana (ISO simplificado) — usado para escolher o desafio. */
export function weekNumber(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

export function challengeOfTheWeek(d = new Date()) {
  const week = weekNumber(d);
  const mission = MISSIONS[week % MISSIONS.length];
  return { emoji: mission.emoji, title: mission.title, desc: mission.desc, week, mission };
}

/**
 * Missões sugeridas para hoje: variadas em tipo, estáveis durante o dia
 * (recarregar a página não troca as missões).
 */
export function missionsOfTheDay(d = new Date(), count = 3): Mission[] {
  const seed = Number(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`);
  const out: Mission[] = [];
  const usedKinds = new Set<MissionKind>();
  for (let step = 0; step < MISSIONS.length && out.length < count; step++) {
    const cand = MISSIONS[(seed + step * 7) % MISSIONS.length];
    if (usedKinds.has(cand.kind) || out.includes(cand)) continue;
    usedKinds.add(cand.kind);
    out.push(cand);
  }
  // completa se a variedade não deu conta
  for (let step = 0; step < MISSIONS.length && out.length < count; step++) {
    const cand = MISSIONS[(seed + step * 3) % MISSIONS.length];
    if (!out.includes(cand)) out.push(cand);
  }
  return out;
}

/** Início da semana atual (domingo, 00:00). */
export function startOfWeek(d = new Date()): Date {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}
