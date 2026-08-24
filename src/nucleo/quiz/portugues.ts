import { SpellCheck } from "lucide-react";
import type { PacoteQuiz } from "./tipos";

export const PORTUGUES: PacoteQuiz = {
  key: "portugues",
  titulo: "Batalha das",
  destaque: "Palavras",
  desc: "Ortografia, sentido, ditados e pegadinhas da língua",
  icone: SpellCheck,
  accent: "accent2",
  perguntas: [
    // ── Sentido das palavras ────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "O que significa 'efêmero'?",
      opcoes: ["Que dura pouco", "Que é enorme", "Que é secreto", "Que se repete sempre"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o antônimo de 'escasso'?",
      opcoes: ["Abundante", "Raro", "Pequeno", "Difícil"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "O que significa 'prescindir'?",
      opcoes: ["Dispensar, passar sem", "Precisar muito", "Antecipar algo", "Insistir"],
      correta: 0,
      explicacao: "Muita gente usa achando que é o contrário. 'Prescindir de ajuda' é dispensar a ajuda.",
    },
    {
      tipo: "escolha",
      enunciado: "O que significa 'inócuo'?",
      opcoes: ["Inofensivo", "Venenoso", "Inevitável", "Incompleto"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "'Ratificar' quer dizer:",
      opcoes: ["Confirmar", "Corrigir", "Cancelar", "Adiar"],
      correta: 0,
      explicacao: "Quem corrige é 'retificar', com E. Ratificar é confirmar.",
    },
    {
      tipo: "escolha",
      enunciado: "O que significa 'ojeriza'?",
      opcoes: ["Antipatia forte", "Saudade", "Curiosidade", "Cansaço"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o coletivo de lobos?",
      opcoes: ["Alcateia", "Matilha", "Manada", "Cardume"],
      correta: 0,
      explicacao: "Matilha é de cães.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o feminino de 'cônsul'?",
      opcoes: ["Consulesa", "Consulina", "Cônsula", "Consular"],
      correta: 0,
    },

    // ── Ortografia ──────────────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Qual grafia está correta?",
      opcoes: ["Exceção", "Exceçao", "Excessão", "Esceção"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual grafia está correta?",
      opcoes: ["Privilégio", "Previlégio", "Privilegio", "Previlegio"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual grafia está correta?",
      opcoes: ["Beneficente", "Beneficiente", "Benificente", "Benefissente"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual grafia está correta?",
      opcoes: ["Meteorologia", "Metereologia", "Meteriologia", "Metiorologia"],
      correta: 0,
      explicacao: "Vem de 'meteoro'. Não existe o 'r' extra que quase todo mundo fala.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o plural de 'cidadão'?",
      opcoes: ["Cidadãos", "Cidadões", "Cidadães", "Cidadãs"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o plural de 'pão'?",
      opcoes: ["Pães", "Pãos", "Pões", "Pãoes"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o plural de 'guarda-chuva'?",
      opcoes: ["Guarda-chuvas", "Guardas-chuvas", "Guardas-chuva", "Guarda-chuva"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual destas palavras é proparoxítona?",
      opcoes: ["Médico", "Café", "Fácil", "Você"],
      correta: 0,
      explicacao: "Toda proparoxítona é acentuada — é a única regra de acentuação sem exceção.",
    },

    // ── Pegadinhas ──────────────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Complete: 'Eu queria muito ir, ___ não deu.'",
      opcoes: ["mas", "mais", "más", "maz"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Complete: 'Ele acordou ___ humorado hoje.'",
      opcoes: ["mal", "mau", "mall", "máu"],
      correta: 0,
      explicacao: "'Mal' é o contrário de 'bem'; 'mau' é o contrário de 'bom'. Aqui cabe 'bem-humorado', então é 'mal'.",
    },
    {
      tipo: "escolha",
      enunciado: "Complete: 'Cheguei ___ dois dias.'",
      opcoes: ["há", "a", "à", "ha"],
      correta: 0,
      explicacao: "Tempo passado pede 'há'. Tempo futuro pede 'a': 'daqui a dois dias'.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual está correto?",
      opcoes: [
        "Faz dois anos que não nos vemos",
        "Fazem dois anos que não nos vemos",
        "Fazem dois anos que não nos vêmos",
        "Fais dois anos que não nos vemos",
      ],
      correta: 0,
      explicacao: "'Fazer' no sentido de tempo decorrido não tem sujeito — fica sempre no singular.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual está correto?",
      opcoes: [
        "Trouxe o livro para eu ler",
        "Trouxe o livro para mim ler",
        "Trouxe o livro pra mim ler",
        "Trouxe o livro por mim ler",
      ],
      correta: 0,
      explicacao: "Se a palavra vai praticar a ação do verbo, é 'eu'. 'Mim' não faz nada — mim não conjuga.",
    },
    {
      tipo: "escolha",
      enunciado: "Complete: '___ você vai com tanta pressa?'",
      opcoes: ["Aonde", "Onde", "Àonde", "Aondi"],
      correta: 0,
      explicacao: "Verbo de movimento pede 'aonde' (a + onde). 'Onde' é para lugar parado: 'onde você mora?'.",
    },

    // ── Ditados e expressões ────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "O que significa a expressão 'engolir sapo'?",
      opcoes: [
        "Aguentar calado algo desagradável",
        "Fazer algo nojento por dinheiro",
        "Aceitar um desafio difícil",
        "Comer com muita pressa",
      ],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "O que significa 'chutar o balde'?",
      opcoes: [
        "Perder a paciência e largar tudo",
        "Errar feio numa decisão",
        "Começar algo do zero",
        "Fazer uma aposta arriscada",
      ],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "O ditado 'quem não tem cão caça com gato' quer dizer que a pessoa:",
      opcoes: [
        "Se vira com o que tem",
        "Prefere companhia a solidão",
        "Não sabe escolher aliados",
        "Desiste quando falta recurso",
      ],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Receber algo 'de mão beijada' significa receber:",
      opcoes: ["Sem nenhum esforço", "Com muito atraso", "Em segredo", "Pela metade do preço"],
      correta: 0,
    },

    // ── Palavra intrusa e anagrama ──────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Qual é a palavra intrusa?",
      opcoes: ["Alface", "Maçã", "Banana", "Uva"],
      correta: 0,
      explicacao: "Alface é hortaliça; as outras três são frutas.",
    },
    {
      tipo: "escolha",
      enunciado: "Reorganizando as letras de AMOR, qual delas é a capital de um país?",
      opcoes: ["ROMA", "RAMO", "MORA", "OMAR"],
      correta: 0,
      explicacao: "Todas são anagramas de AMOR — mas só Roma é capital.",
    },

    // ── Verdade ou mito ─────────────────────────────────────────────────────
    {
      tipo: "vf",
      afirmacao: "Toda palavra proparoxítona é acentuada.",
      verdadeiro: true,
      explicacao: "É a única regra de acentuação do português sem nenhuma exceção: médico, câmara, lâmpada, ridículo.",
    },
    {
      tipo: "vf",
      afirmacao: "A palavra 'você' nasceu de 'Vossa Mercê'.",
      verdadeiro: true,
      explicacao: "O caminho foi Vossa Mercê → vosmecê → você. Levou séculos.",
    },
    {
      tipo: "vf",
      afirmacao: "'Menas' existe e pode ser usada em contexto informal.",
      verdadeiro: false,
      explicacao: "'Menos' é invariável — não flexiona em gênero nem em número. 'Menas' não existe em nenhum registro.",
    },
    {
      tipo: "vf",
      afirmacao: "A grafia correta é 'advinhar'.",
      verdadeiro: false,
      explicacao: "É 'adivinhar', com i. Vem de 'adivinho'.",
    },
    {
      tipo: "vf",
      afirmacao: "O trema deixou de ser usado nas palavras portuguesas.",
      verdadeiro: true,
      explicacao: "O Acordo Ortográfico o aboliu. Sobrevive só em nomes próprios estrangeiros e seus derivados, como Müller.",
    },
    {
      tipo: "vf",
      afirmacao: "O plural de 'qualquer' é 'qualqueres'.",
      verdadeiro: false,
      explicacao: "É 'quaisquer' — o plural vai no meio da palavra, porque ela nasceu de 'qual' + 'quer'.",
    },
    {
      tipo: "vf",
      afirmacao: "O acento que diferenciava 'pára' (verbo) de 'para' (preposição) foi abolido.",
      verdadeiro: true,
      explicacao: "O Acordo Ortográfico derrubou quase todos os acentos diferenciais. Sobraram poucos, como 'pôde' e 'pôr'.",
    },
    {
      tipo: "vf",
      afirmacao: "'Fazem cinco anos' é a forma correta.",
      verdadeiro: false,
      explicacao: "É 'faz cinco anos'. No sentido de tempo decorrido, o verbo fazer não tem sujeito e não vai para o plural.",
    },
    {
      tipo: "vf",
      afirmacao: "O português é a língua mais falada da América do Sul.",
      verdadeiro: true,
      explicacao: "O Brasil sozinho tem mais falantes que todos os países hispanofalantes do continente somados.",
    },
    {
      tipo: "vf",
      afirmacao: "'Mau' é o contrário de 'bem'.",
      verdadeiro: false,
      explicacao: "'Mau' é o contrário de 'bom' (os dois com O). O contrário de 'bem' é 'mal' — os dois com L.",
    },

    // ── Ordenar ─────────────────────────────────────────────────────────────
    {
      tipo: "ordem",
      enunciado: "Coloque em ordem ALFABÉTICA.",
      dicaOrdem: "primeira do dicionário primeiro",
      itens: ["Cear", "Chá", "Cidade", "Corda"],
      explicacao: "A segunda letra decide: e, h, i, o.",
    },
    {
      tipo: "ordem",
      enunciado: "Coloque da palavra com MENOS letras para a com MAIS letras.",
      dicaOrdem: "menos letras primeiro",
      itens: ["Ar", "Céu", "Chuva", "Tempestade"],
    },
    {
      tipo: "ordem",
      enunciado: "Coloque em ordem CRESCENTE de número de sílabas.",
      dicaOrdem: "menos sílabas primeiro",
      itens: ["Pá", "Casa", "Caneta", "Refrigerante"],
      explicacao: "1 · 2 · 3 · 5 sílabas.",
    },
    {
      tipo: "ordem",
      enunciado: "Coloque as fases da língua em ordem CRONOLÓGICA.",
      dicaOrdem: "mais antiga primeiro",
      itens: ["Latim", "Galego-português", "Português arcaico", "Português moderno"],
    },

    // ── Pistas ──────────────────────────────────────────────────────────────
    {
      tipo: "pistas",
      pistas: [
        "Sou uma figura de linguagem.",
        "Vivo do exagero proposital.",
        "Quem diz 'morri de rir' está me usando.",
      ],
      opcoes: ["Hipérbole", "Metáfora", "Ironia", "Eufemismo"],
      correta: 0,
    },
    {
      tipo: "pistas",
      pistas: [
        "Fui um sinal gráfico do português.",
        "Servia para avisar que o 'u' devia ser pronunciado.",
        "Aparecia em 'lingüiça' e 'freqüente' até o Acordo Ortográfico.",
      ],
      opcoes: ["Trema", "Cedilha", "Til", "Circunflexo"],
      correta: 0,
    },
    {
      tipo: "pistas",
      pistas: [
        "Sou uma figura de linguagem que suaviza.",
        "Troco a palavra dura por uma mais gentil.",
        "Quem diz 'ele nos deixou' em vez de 'morreu' está me usando.",
      ],
      opcoes: ["Eufemismo", "Hipérbole", "Metonímia", "Antítese"],
      correta: 0,
    },
    {
      tipo: "pistas",
      pistas: [
        "Sou um tempo verbal que muita gente evita.",
        "Apareço em 'se eu fosse' e 'quando eu vier'.",
        "Meu nome sugere que dependo de outra coisa para acontecer.",
      ],
      opcoes: ["Subjuntivo", "Indicativo", "Imperativo", "Particípio"],
      correta: 0,
    },
  ],
};
