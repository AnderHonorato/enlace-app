import "server-only";
import { prisma } from "./prisma";
import { callAI } from "./ia";
import { resolveProvider } from "./chave-ia";
import { getCoupleFacts, formatCoupleFactsBlock, formatAvoidRepeatBlock } from "./ai/contexto";

export type Vibe = "positive" | "neutral" | "attention";
export type SummaryResult = {
  vibe: Vibe;
  title: string;
  message: string;
  tip: string | null;
  /** "ai" = escrito pela IA agora; "offline" = texto local (sem chave/erro). */
  source: "ai" | "offline";
};

export type EntryLite = {
  authorName: string;
  moodLabel: string | null;
  moodKey: string | null;
  date: string;
  text: string;
};

export function dayKeyFor(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type SummaryPeriod = "day" | "week" | "month";

export function periodKeyFor(period: SummaryPeriod, d = new Date()): string {
  if (period === "day") return dayKeyFor(d);
  if (period === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  // semana ISO simplificada
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(week).padStart(2, "0")}`;
}

export const PERIOD_WINDOW_DAYS: Record<SummaryPeriod, number> = { day: 3, week: 7, month: 31 };
export const PERIOD_LABEL: Record<SummaryPeriod, string> = {
  day: "de hoje",
  week: "da semana",
  month: "do mês",
};

const POSITIVE = new Set(["radiante", "feliz", "apaixonado", "grato", "calmo", "animado"]);
const NEGATIVE = new Set(["triste", "ansioso", "chateado", "saudade", "cansado"]);

function extractJson(s: string): any {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function normVibe(v: any): Vibe {
  return v === "positive" || v === "attention" ? v : "neutral";
}
const str = (v: any, fb: string) => (typeof v === "string" && v.trim() ? v.trim() : fb);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Vozes possíveis do oráculo. Sortear uma a cada chamada é o que garante que
 * clicar em "gerar" duas vezes não devolva o mesmo texto.
 */
const VOZES = [
  "com um tom poético e delicado, usando imagens da natureza",
  "de forma direta e bem-humorada, como um amigo sem filtro (mas gentil)",
  "com leveza e um toque de nostalgia, como quem folheia um álbum antigo",
  "como um trecho de carta de amor escrita à mão",
  "com a calma de um conselho dado na cozinha, tarde da noite",
  "de um jeito divertido e descontraído, com um toque de deboche carinhoso",
  "como uma previsão astrológica, mas sem clichês de horóscopo",
  "como a narração de um curta-metragem sobre os dois",
  "com poucas palavras e muito peso, no estilo de um haiku expandido",
  "como o comentário de quem observa o casal de longe e se comove",
] as const;

/** Ângulos de leitura — muda o QUE a IA nota, não só o COMO ela escreve. */
const ANGULOS = [
  "destaque um detalhe pequeno e concreto que apareceu nas anotações",
  "aponte o que os dois estão construindo juntos sem perceber",
  "note o contraste (ou a harmonia) entre o que cada um escreveu",
  "comente o ritmo do casal — corrido, tranquilo, oscilante",
  "encontre o fio que liga as anotações mais recentes",
  "repare no cuidado que um demonstrou pelo outro",
] as const;

export async function generateSummary(
  user: any,
  entries: EntryLite[],
  names: { a: string; b: string | null },
  period: SummaryPeriod = "day"
): Promise<SummaryResult> {
  const { provider, apiKey } = resolveProvider(user);
  if (!apiKey || entries.length === 0) return fallback(entries);

  const digest = entries
    .map((e) => `- [${e.date}] ${e.authorName} (${e.moodLabel || "sem humor"}): ${e.text.slice(0, 300)}`)
    .join("\n");

  const nomes = names.b ? `${names.a} e ${names.b}` : names.a;
  const janela = period === "day" ? "nos últimos dias" : period === "week" ? "nesta semana" : "neste mês";

  const voz = pick(VOZES);
  const angulo = pick(ANGULOS);
  const semente = Math.floor(Math.random() * 999999) + 1;

  // Fatos do casal (nível, sequência, como se conheceram, planos em aberto) —
  // o mesmo contexto usado no chat e na análise de memórias, para o oráculo
  // enxergar o casal de verdade, não só o texto solto das últimas anotações.
  const facts = await getCoupleFacts(user).catch(() => null);

  // O antídoto real contra repetição: mostrar ao modelo os próprios resumos
  // anteriores deste casal (mesmo período) e proibir reciclar título/abertura.
  // A "voz" e o "ângulo" sorteados acima dão variação de tom; isto aqui é o
  // que impede o CONTEÚDO de voltar sempre ao mesmo lugar.
  let avoidBlock = "";
  if (user.coupleId) {
    const past = await prisma.dailySummary
      .findMany({
        where: { coupleId: user.coupleId, period },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { title: true, message: true },
      })
      .catch(() => []);
    avoidBlock = formatAvoidRepeatBlock(
      past.map((p) => `${p.title} — ${p.message}`),
      `Títulos e resumos que você já escreveu para ${nomes} (${janela})`
    );
  }

  const system = [
    `Você é o oráculo do amor do app "Enlace", um diário para casais.`,
    `Leia as anotações recentes de ${nomes}. Cada anotação é um recado carinhoso de um para o outro.`,
    `Escreva um resumo curto sobre como o relacionamento está ${janela}.`,
    `Voz desta resposta: ${voz}.`,
    `Nesta resposta especificamente, ${angulo}.`,
    `Regras: seja específico ao que foi realmente escrito e cite detalhes concretos das anotações.`,
    `Nunca invente fatos, nomes, lugares ou acontecimentos que não estejam no texto.`,
    `Se algo delicado apareceu (briga, cansaço, saudade, distância), acolha com cuidado em vez de fingir que está tudo ótimo.`,
    `Não repita estruturas óbvias como "vocês estão" ou "o amor de vocês" no título.`,
    `Escreva em português do Brasil, sem emojis no título.`,
    `A "tip" é uma sugestão prática, pequena e possível de fazer hoje — nada genérico como "conversem mais".`,
    facts ? formatCoupleFactsBlock(facts) : "",
    avoidBlock,
    `Responda APENAS um JSON válido, sem markdown e sem cercas de código:`,
    `{"vibe":"positive|neutral|attention","title":"<3 a 5 palavras>","message":"<2 a 4 frases>","tip":"<1 sugestão curta>"}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const reply = await callAI({
      provider,
      apiKey,
      model: user.aiModel || undefined,
      system,
      messages: [{ role: "user", content: digest }],
      // Folga suficiente para o JSON completo mesmo em modelos que raciocinam.
      maxTokens: 700,
      temperature: 1.15,
      seed: semente,
    });
    const parsed = extractJson(reply);
    if (!parsed) return fallback(entries);
    return {
      vibe: normVibe(parsed.vibe),
      title: str(parsed.title, "Um retrato de vocês"),
      message: str(parsed.message, ""),
      tip: parsed.tip ? str(parsed.tip, "") || null : null,
      source: "ai",
    };
  } catch {
    return fallback(entries);
  }
}

/**
 * Texto local, usado quando não há chave de IA ou a chamada falhou.
 * Sorteia entre variações para que "gerar de novo" mude algo mesmo offline.
 */
function fallback(entries: EntryLite[]): SummaryResult {
  const off = (v: Vibe, t: string, m: string, tip: string): SummaryResult => ({
    vibe: v,
    title: t,
    message: m,
    tip,
    source: "offline",
  });

  if (entries.length === 0) {
    return pick([
      off(
        "neutral",
        "Um dia em branco",
        "Faz um tempinho que vocês não registram nada por aqui. As melhores histórias começam com uma frase — que tal escrever um momento de hoje?",
        "Escreva uma memória rápida pra manter a chama acesa."
      ),
      off(
        "neutral",
        "A página espera",
        "Nenhuma anotação nova por enquanto. Nem todo dia precisa virar história, mas os pequenos costumam ser os que mais dão saudade depois.",
        "Registre uma coisa boba que aconteceu hoje."
      ),
      off(
        "neutral",
        "Silêncio confortável",
        "O diário está quieto. Às vezes a vida corre e escrever fica para depois — e está tudo bem. Ele continua aqui quando vocês voltarem.",
        "Mande uma foto de hoje para o seu amor."
      ),
    ]);
  }

  const pos = entries.filter((e) => e.moodKey && POSITIVE.has(e.moodKey)).length;
  const neg = entries.filter((e) => e.moodKey && NEGATIVE.has(e.moodKey)).length;
  const quem = entries[0]?.authorName;

  if (neg > pos) {
    return pick([
      off(
        "attention",
        "Merece um carinho",
        "Os últimos registros trazem um tom mais sensível. Pode ser um ótimo momento para conversar com calma e se ouvir de verdade.",
        'Mandem um "como você está?" sincero um para o outro hoje.'
      ),
      off(
        "attention",
        "Dias mais pesados",
        "As anotações recentes têm um peso diferente. Isso não é sinal de problema — é sinal de honestidade. Cuidar disso junto costuma aliviar.",
        "Reserve dez minutos sem celular só para conversar."
      ),
      off(
        "attention",
        "Um abraço faria bem",
        `${quem ? `${quem} escreveu` : "Vocês escreveram"} de um lugar mais cansado ultimamente. Vale desacelerar e dividir o que está apertando.`,
        "Pergunte o que ele ou ela precisa de você agora."
      ),
    ]);
  }

  if (pos > 0) {
    return pick([
      off(
        "positive",
        "Vocês estão brilhando",
        "As memórias recentes respiram carinho e cumplicidade. Tem muito amor circulando por aqui — continuem regando isso!",
        "Registrem juntos o melhor momento do dia."
      ),
      off(
        "positive",
        "Fase boa, aproveitem",
        "Dá para sentir a leveza nas últimas anotações. Esse tipo de dia é o que vira lembrança boa daqui a alguns anos.",
        "Tire uma foto agora — o futuro de vocês vai agradecer."
      ),
      off(
        "positive",
        "Riso nas entrelinhas",
        "As anotações estão cheias de coisas simples e boas. Não é sorte: é atenção diária de um com o outro.",
        "Escreva o que você mais gostou nele ou nela esta semana."
      ),
    ]);
  }

  return pick([
    off(
      "neutral",
      "No ritmo de vocês",
      "A rotina segue com seus altos e baixos, e está tudo bem. São os pequenos gestos que mantêm a conexão viva.",
      "Deixe um comentário fofo numa memória do seu amor."
    ),
    off(
      "neutral",
      "Rotina, sem drama",
      "Nada de extraordinário nas últimas anotações — e isso também é bonito. Relacionamento é feito muito mais de terças-feiras do que de datas especiais.",
      "Combine uma coisa pequena para fazer juntos amanhã."
    ),
    off(
      "neutral",
      "Passo constante",
      "Vocês seguem registrando a vida como ela é. Esse hábito quieto é o que faz o diário virar história.",
      "Releia uma memória antiga de vocês hoje."
    ),
  ]);
}
