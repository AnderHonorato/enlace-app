/**
 * Perguntas rápidas da tela de memória.
 *
 * O que havia antes: 14 perguntas e `QUESTIONS[dia % 14]`. Dois problemas —
 * o ciclo fechava em duas semanas e a única ação possível era "responder
 * escrevendo". Passava a sensação de estar sempre pedindo a mesma coisa.
 *
 * O que há agora:
 *
 * 1. **Baralho grande.** Mais de cem convites, escritos para soarem como
 *    alguém puxando assunto, não como formulário.
 * 2. **Ações variadas.** Cada convite tem um `tipo` — escrever, tirar foto,
 *    gravar a voz, listar, marcar um lugar, escolher uma música, virar plano,
 *    mandar no chat, responder junto. O botão e o destino mudam com o tipo,
 *    então o card não é sempre o mesmo pedido com outro texto.
 * 3. **Sem repetir.** A escolha não é `dia % N`: o baralho é embaralhado por
 *    ciclo. Dentro de um ciclo de N dias nenhum convite se repete, e cada
 *    ciclo novo vem numa ordem diferente. Com o baralho atual isso dá mais de
 *    quatro meses sem ver o mesmo convite duas vezes.
 *
 * O embaralhamento é determinístico (mesmo dia + mesma semente ⇒ mesmo
 * resultado). Isso importa por dois motivos: os dois do casal precisam ver o
 * mesmo convite no mesmo dia, e o componente renderiza no servidor e no
 * cliente — `Math.random()` aqui quebraria a hidratação do React.
 */

export type TipoAcao =
  | "escrever"
  | "foto"
  | "voz"
  | "lista"
  | "lugar"
  | "musica"
  | "plano"
  | "conversa"
  | "juntos";

export type Convite = { t: string; k: TipoAcao };

/** Como cada tipo de ação se apresenta: rótulo, verbo do botão e destino. */
export const ACOES: Record<
  TipoAcao,
  { rotulo: string; botao: string; href: (texto: string) => string }
> = {
  escrever: {
    rotulo: "Pergunta do dia",
    botao: "Responder",
    href: (t) => `/app/novo?pergunta=${encodeURIComponent(t)}`,
  },
  foto: {
    rotulo: "Registro em foto",
    botao: "Fotografar",
    href: (t) => `/app/novo?pergunta=${encodeURIComponent(t)}&tag=foto`,
  },
  voz: {
    rotulo: "Recado de voz",
    botao: "Gravar",
    href: (t) => `/app/novo?pergunta=${encodeURIComponent(t)}&tag=voz`,
  },
  lista: {
    rotulo: "Faça uma lista",
    botao: "Listar",
    href: (t) => `/app/novo?pergunta=${encodeURIComponent(t)}&tag=lista`,
  },
  lugar: {
    rotulo: "Marque no mapa",
    botao: "Marcar",
    href: (t) => `/app/novo?pergunta=${encodeURIComponent(t)}&tag=lugar`,
  },
  musica: {
    rotulo: "Trilha de vocês",
    botao: "Escolher",
    href: () => `/app/radio`,
  },
  plano: {
    rotulo: "Virou plano",
    botao: "Planejar",
    href: () => `/app/planos`,
  },
  conversa: {
    rotulo: "Manda agora",
    botao: "Mandar",
    href: () => `/app/conversa`,
  },
  juntos: {
    rotulo: "Respondam os dois",
    botao: "Responder",
    href: (t) => `/app/novo?pergunta=${encodeURIComponent(t)}&tag=juntos`,
  },
};

export const CONVITES: Convite[] = [
  // ── escrever ──────────────────────────────────────────────────────────
  { t: "Qual foi o melhor momento do seu dia hoje?", k: "escrever" },
  { t: "O que seu amor fez recentemente que te fez sorrir?", k: "escrever" },
  { t: "Uma coisa pequena de hoje que você não quer esquecer?", k: "escrever" },
  { t: "O que você mais admira na pessoa que ama?", k: "escrever" },
  { t: "Qual foi a última vez que riram muito juntos?", k: "escrever" },
  { t: "O que te deu paz hoje?", k: "escrever" },
  { t: "Qual foi o primeiro pensamento sobre seu amor quando acordou?", k: "escrever" },
  { t: "Se hoje fosse um filme, que título teria?", k: "escrever" },
  { t: "Uma qualidade sua que floresceu nesse relacionamento?", k: "escrever" },
  { t: "O que você quer dizer, mas ainda não disse?", k: "escrever" },
  { t: "Qual cheiro te lembra a nossa casa?", k: "escrever" },
  { t: "Conte um detalhe do rosto dele(a) que só você repara.", k: "escrever" },
  { t: "Qual foi a discussão mais boba que vocês já tiveram?", k: "escrever" },
  { t: "O que mudou em você depois que se conheceram?", k: "escrever" },
  { t: "Descreva um domingo perfeito com ele(a).", k: "escrever" },
  { t: "Qual manias dele(a) você achava estranha e hoje ama?", k: "escrever" },
  { t: "Escreva sobre um dia difícil em que ele(a) segurou sua mão.", k: "escrever" },
  { t: "Se pudesse mandar um recado para vocês de cinco anos atrás?", k: "escrever" },
  { t: "Qual foi a coisa mais corajosa que vocês fizeram juntos?", k: "escrever" },
  { t: "O que você aprendeu com ele(a) esta semana?", k: "escrever" },
  { t: "Qual apelido pegou e por quê?", k: "escrever" },
  { t: "Conte a primeira conversa de vocês do jeito que você lembra.", k: "escrever" },
  { t: "Qual silêncio entre vocês é confortável?", k: "escrever" },
  { t: "O que dele(a) você levaria para uma ilha deserta?", k: "escrever" },
  { t: "Descreva o abraço dele(a) para quem nunca recebeu um.", k: "escrever" },
  { t: "Qual foi o presente mais simples que mais significou?", k: "escrever" },
  { t: "Que parte da rotina de vocês você não trocaria por nada?", k: "escrever" },
  { t: "Escreva uma desculpa que você ainda deve.", k: "escrever" },
  { t: "Qual foi o momento em que você teve certeza?", k: "escrever" },
  { t: "O que vocês fazem bem juntos que ninguém vê?", k: "escrever" },
  { t: "Uma coisa que você faz só porque sabe que ele(a) gosta.", k: "escrever" },
  { t: "Qual história de vocês você já contou mil vezes?", k: "escrever" },
  { t: "O que te fez sentir cuidado(a) recentemente?", k: "escrever" },
  { t: "Se o amor de vocês fosse um lugar, como seria?", k: "escrever" },
  { t: "Qual foi a viagem que não deu certo e virou boa lembrança?", k: "escrever" },
  { t: "O que você promete para o próximo mês?", k: "escrever" },

  // ── foto ──────────────────────────────────────────────────────────────
  { t: "Fotografe algo que está na sua frente agora e conte por quê.", k: "foto" },
  { t: "Uma foto do lugar onde vocês mais ficam juntos.", k: "foto" },
  { t: "Fotografe o que você comeu hoje pensando nele(a).", k: "foto" },
  { t: "Mostre um objeto da casa que tem história.", k: "foto" },
  { t: "Uma foto do céu de hoje, onde quer que você esteja.", k: "foto" },
  { t: "Fotografe algo da cor preferida dele(a).", k: "foto" },
  { t: "Registre a bagunça de hoje — ela também é de vocês.", k: "foto" },
  { t: "Uma foto das suas mãos. Ou das duas, se der.", k: "foto" },
  { t: "Fotografe um canto da casa que você ama.", k: "foto" },
  { t: "Mostre o que está tocando ou passando na tela agora.", k: "foto" },
  { t: "Uma foto sua agora, sem filtro, sem pose.", k: "foto" },
  { t: "Fotografe algo que faria ele(a) rir.", k: "foto" },
  { t: "Uma foto de um lugar por onde vocês passaram juntos.", k: "foto" },
  { t: "Registre o que sobrou de um dia bom.", k: "foto" },

  // ── voz ───────────────────────────────────────────────────────────────
  { t: "Grave um áudio dizendo bom dia do jeito que só você diz.", k: "voz" },
  { t: "Cante um pedacinho da música de vocês.", k: "voz" },
  { t: "Grave a sua risada. Sim, essa mesma.", k: "voz" },
  { t: "Conte em áudio como foi o seu dia, sem editar.", k: "voz" },
  { t: "Grave um 'eu te amo' para ele(a) ouvir depois.", k: "voz" },
  { t: "Mande um áudio contando uma saudade.", k: "voz" },
  { t: "Grave o som do lugar onde você está agora.", k: "voz" },
  { t: "Leia em voz alta a última memória que vocês escreveram.", k: "voz" },
  { t: "Grave um agradecimento que você nunca falou em voz alta.", k: "voz" },

  // ── lista ─────────────────────────────────────────────────────────────
  { t: "Liste três coisas pelas quais você é grato(a) hoje.", k: "lista" },
  { t: "Cinco motivos para amar ele(a) numa terça qualquer.", k: "lista" },
  { t: "Liste as manias dele(a) — todas, sem dó.", k: "lista" },
  { t: "Três lugares que vocês ainda vão conhecer.", k: "lista" },
  { t: "Liste as comidas que viraram tradição de vocês.", k: "lista" },
  { t: "Cinco músicas para a trilha sonora do relacionamento.", k: "lista" },
  { t: "Três coisas que você quer fazer mais vezes com ele(a).", k: "lista" },
  { t: "Liste os apelidos que já usaram um com o outro.", k: "lista" },
  { t: "Três séries ou filmes que vocês assistiram juntos.", k: "lista" },
  { t: "Liste o que você faria num dia livre com ele(a).", k: "lista" },
  { t: "Cinco pequenas vitórias de vocês neste ano.", k: "lista" },
  { t: "Três coisas que só vocês dois entendem.", k: "lista" },

  // ── lugar ─────────────────────────────────────────────────────────────
  { t: "Marque o lugar onde vocês se conheceram.", k: "lugar" },
  { t: "Marque onde foi o primeiro beijo.", k: "lugar" },
  { t: "Registre o lugar do primeiro encontro.", k: "lugar" },
  { t: "Marque um lugar onde vocês foram muito felizes.", k: "lugar" },
  { t: "Onde vocês costumam comer quando não querem cozinhar?", k: "lugar" },
  { t: "Marque o lugar da melhor viagem de vocês.", k: "lugar" },
  { t: "Registre um canto da cidade que virou de vocês.", k: "lugar" },
  { t: "Marque onde você está agora e por quê importa.", k: "lugar" },

  // ── música ────────────────────────────────────────────────────────────
  { t: "Escolha a música que tocaria na entrada de vocês.", k: "musica" },
  { t: "Qual música você põe quando sente saudade dele(a)?", k: "musica" },
  { t: "Coloque para tocar a música do primeiro encontro.", k: "musica" },
  { t: "Escolha uma música para acordar juntos amanhã.", k: "musica" },
  { t: "Qual música vocês cantam errado e não se importam?", k: "musica" },
  { t: "Escolha a trilha do próximo domingo de vocês.", k: "musica" },

  // ── plano ─────────────────────────────────────────────────────────────
  { t: "Transforme aquele 'um dia a gente vai' em plano com data.", k: "plano" },
  { t: "Combinem uma coisa nova para fazer neste mês.", k: "plano" },
  { t: "Escreva um desejo de vocês para o ano que vem.", k: "plano" },
  { t: "Qual meta pequena vocês conseguem cumprir esta semana?", k: "plano" },
  { t: "Planeje o próximo encontro sem celular.", k: "plano" },
  { t: "Guarde uma cápsula para abrirem daqui a um ano.", k: "plano" },

  // ── conversa ──────────────────────────────────────────────────────────
  { t: "Mande agora, sem motivo, um 'estou pensando em você'.", k: "conversa" },
  { t: "Pergunte a ele(a) como foi o dia — e espere a resposta inteira.", k: "conversa" },
  { t: "Mande um elogio que você nunca fez.", k: "conversa" },
  { t: "Conte uma coisa boba que aconteceu com você hoje.", k: "conversa" },
  { t: "Convide ele(a) para algo hoje à noite.", k: "conversa" },
  { t: "Mande a foto mais antiga que você tem dos dois.", k: "conversa" },
  { t: "Pergunte do que ele(a) está com vontade agora.", k: "conversa" },

  // ── juntos ────────────────────────────────────────────────────────────
  { t: "Respondam os dois: o que amamos fazer juntos?", k: "juntos" },
  { t: "Cada um escreve o que achou do outro no primeiro dia.", k: "juntos" },
  { t: "Os dois respondem: qual foi o nosso melhor mês?", k: "juntos" },
  { t: "Cada um conta a mesma história do jeito que lembra.", k: "juntos" },
  { t: "Respondam: o que queremos daqui a cinco anos?", k: "juntos" },
  { t: "Cada um escreve um pedido para o outro.", k: "juntos" },
  { t: "Os dois listam o que o outro faz melhor.", k: "juntos" },
  { t: "Respondam: qual foi o nosso maior aprendizado?", k: "juntos" },
  { t: "Cada um descreve o outro em três palavras.", k: "juntos" },
  { t: "Os dois contam o que sentiram falta esta semana.", k: "juntos" },
];

/** Compatibilidade: alguns lugares ainda importam só os textos. */
export const QUESTIONS = CONVITES.map((c) => c.t);

/** Hash determinístico (FNV-1a) — mesma entrada, mesma saída, sempre. */
function semente(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mdc(a: number, b: number): number {
  return b === 0 ? a : mdc(b, a % b);
}

/** O menor passo ≥ `de` que seja coprimo com `n`. */
function passoCoprimo(n: number, de: number): number {
  for (let i = 0; i < n; i++) {
    const cand = 1 + ((de + i) % (n - 1));
    if (mdc(cand, n) === 1) return cand;
  }
  return 1;
}

function numeroDoDia(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/**
 * O convite do dia.
 *
 * A escolha é `(passo · dia + deslocamento) mod n`. Como `passo` é coprimo com
 * `n`, essa conta é uma bijeção: dois dias quaisquer dentro de uma janela de
 * `n` dias sempre caem em convites diferentes. Ou seja, a garantia de "não
 * repete" vale em QUALQUER janela de 108 dias, não só numa janela alinhada.
 *
 * A primeira versão disto embaralhava o baralho a cada ciclo. Parecia melhor e
 * era pior: dentro de um ciclo não repetia, mas quem atravessasse a virada de
 * ciclo via convite repetido — o teste pegou uma repetição no 59º dia. O passo
 * coprimo não tem esse buraco.
 *
 * @param d     a data
 * @param chave identificador do casal — os dois veem o mesmo convite no mesmo
 *              dia, e casais diferentes recebem ordens diferentes.
 */
export function conviteDoDia(d = new Date(), chave = ""): Convite {
  const dia = numeroDoDia(d);
  const n = CONVITES.length;
  const s = semente(chave || "enlace");
  const passo = passoCoprimo(n, s % n);
  const desloc = s % n;
  const i = (((passo * dia + desloc) % n) + n) % n;
  return CONVITES[i];
}

/** Compatibilidade com o call site antigo, que só queria o texto. */
export function questionOfTheDay(d = new Date(), chave = ""): string {
  return conviteDoDia(d, chave).t;
}
