import { Scale } from "lucide-react";
import type { PacoteQuiz } from "./tipos";

/**
 * OPUS LAW — quiz jurídico.
 *
 * Só entram aqui regras estáveis e de manual (prazos do CDC, direitos da CLT,
 * artigos clássicos da Constituição). Nada de tese em disputa, nada de
 * jurisprudência recente: lei muda e interpretação muda mais ainda, e um quiz
 * desatualizado ensina errado com cara de certeza.
 */
export const DIREITO: PacoteQuiz = {
  key: "direito",
  titulo: "Opus",
  destaque: "Law",
  desc: "Consumidor, trabalho, Constituição e crimes",
  icone: Scale,
  accent: "danger",
  aviso:
    "As respostas aqui são para entretenimento e estudo — não substituem a orientação de um advogado. Leis mudam e cada caso real tem detalhes que um quiz não alcança.",
  perguntas: [
    // ── Consumidor ──────────────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Qual é o prazo para desistir de uma compra feita pela internet, sem precisar justificar?",
      opcoes: ["7 dias corridos", "15 dias corridos", "30 dias corridos", "Não existe esse direito"],
      correta: 0,
      explicacao: "É o direito de arrependimento (art. 49 do CDC), contado do recebimento. Vale para compras fora da loja física: internet, telefone, domicílio.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual é a garantia legal mínima de um produto durável, como uma geladeira?",
      opcoes: ["90 dias", "30 dias", "1 ano", "6 meses"],
      correta: 0,
      explicacao: "Art. 26 do CDC. A garantia do fabricante, quando existe, se soma a essa — não substitui.",
    },
    {
      tipo: "escolha",
      enunciado: "E a garantia legal de um produto não durável, como um alimento?",
      opcoes: ["30 dias", "90 dias", "7 dias", "6 meses"],
      correta: 0,
      explicacao: "Art. 26 do CDC.",
    },
    {
      tipo: "escolha",
      enunciado: "Quanto tempo a loja tem para resolver o defeito de um produto antes que o consumidor possa escolher outra saída?",
      opcoes: ["30 dias", "7 dias", "60 dias", "90 dias"],
      correta: 0,
      explicacao: "Art. 18 do CDC. Passado o prazo, o consumidor escolhe entre troca, devolução do dinheiro ou abatimento do preço.",
    },
    {
      tipo: "escolha",
      enunciado: "O consumidor pagou uma cobrança indevida. A que ele tem direito?",
      opcoes: [
        "Receber o dobro do valor pago a mais, corrigido",
        "Receber exatamente o que pagou",
        "Receber metade do valor",
        "Apenas a um pedido de desculpas",
      ],
      correta: 0,
      explicacao: "Art. 42 do CDC, salvo hipótese de engano justificável.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual lei protege as relações de consumo no Brasil?",
      opcoes: [
        "Código de Defesa do Consumidor",
        "Código Civil",
        "Marco Civil da Internet",
        "Consolidação das Leis do Trabalho",
      ],
      correta: 0,
      explicacao: "Lei 8.078/1990, criada por determinação da própria Constituição de 1988.",
    },

    // ── Trabalho ────────────────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Quantos dias de férias tem o trabalhador CLT depois de 12 meses de trabalho?",
      opcoes: ["30 dias corridos", "20 dias corridos", "15 dias corridos", "45 dias corridos"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o acréscimo mínimo da hora extra sobre a hora normal?",
      opcoes: ["50%", "20%", "30%", "100%"],
      correta: 0,
      explicacao: "Art. 7º, XVI da Constituição. Acordos e convenções coletivas podem prever mais.",
    },
    {
      tipo: "escolha",
      enunciado: "Quanto o empregador deposita por mês no FGTS do trabalhador?",
      opcoes: ["8% do salário", "11% do salário", "5% do salário", "13% do salário"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é a jornada padrão prevista na Constituição?",
      opcoes: [
        "8 horas por dia e 44 por semana",
        "8 horas por dia e 40 por semana",
        "6 horas por dia e 36 por semana",
        "10 horas por dia e 50 por semana",
      ],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o adicional noturno mínimo do trabalhador urbano?",
      opcoes: ["20%", "50%", "30%", "10%"],
      correta: 0,
      explicacao: "Art. 73 da CLT. Na cidade, o horário noturno vai das 22h às 5h — e a hora noturna é contada como 52 minutos e 30 segundos.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual é o aviso prévio mínimo na demissão sem justa causa?",
      opcoes: [
        "30 dias, mais 3 dias por ano trabalhado, até 90",
        "30 dias, sempre",
        "15 dias, mais 5 por ano trabalhado",
        "60 dias, sempre",
      ],
      correta: 0,
      explicacao: "Lei 12.506/2011.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual norma reúne as regras do trabalho com carteira assinada?",
      opcoes: ["CLT", "Código Civil", "Constituição", "Código de Processo Civil"],
      correta: 0,
      explicacao: "A Consolidação das Leis do Trabalho é de 1943 e segue sendo a base, com muitas alterações desde então.",
    },

    // ── Constituição e direitos fundamentais ────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Em qual artigo da Constituição estão os direitos e deveres individuais e coletivos?",
      opcoes: ["Artigo 5º", "Artigo 1º", "Artigo 37", "Artigo 100"],
      correta: 0,
      explicacao: "É o artigo mais citado do país — e um dos mais longos, com dezenas de incisos.",
    },
    {
      tipo: "escolha",
      enunciado: "O que significa a presunção de inocência?",
      opcoes: [
        "Ninguém é considerado culpado antes do trânsito em julgado",
        "Ninguém pode ser investigado sem provas",
        "Todo réu tem direito a ser absolvido uma vez",
        "A polícia precisa provar tudo antes de investigar",
      ],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual remédio constitucional protege a liberdade de ir e vir?",
      opcoes: ["Habeas corpus", "Mandado de segurança", "Habeas data", "Ação popular"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "A partir de que idade o voto é obrigatório no Brasil?",
      opcoes: ["18 anos", "16 anos", "21 anos", "17 anos"],
      correta: 0,
      explicacao: "É facultativo aos 16 e 17 anos, aos maiores de 70 e aos analfabetos.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual é a norma mais alta da hierarquia jurídica brasileira?",
      opcoes: ["A Constituição Federal", "O Código Civil", "As leis complementares", "Os decretos presidenciais"],
      correta: 0,
    },

    // ── Civil, penal e família ──────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Com quantos anos a pessoa se torna plenamente capaz para os atos da vida civil?",
      opcoes: ["18 anos", "16 anos", "21 anos", "19 anos"],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "Qual é a diferença central entre furto e roubo?",
      opcoes: [
        "O roubo envolve violência ou grave ameaça",
        "O furto é sempre de valor menor",
        "O roubo só acontece em via pública",
        "O furto é cometido por mais de uma pessoa",
      ],
      correta: 0,
    },
    {
      tipo: "escolha",
      enunciado: "O que caracteriza o dano moral?",
      opcoes: [
        "A lesão a direitos da personalidade, como honra e imagem",
        "Qualquer prejuízo financeiro",
        "A perda de um bem material",
        "O descumprimento de qualquer contrato",
      ],
      correta: 0,
      explicacao: "Aborrecimento comum do dia a dia, isoladamente, costuma não bastar — é preciso que atinja a dignidade da pessoa.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual é hoje a regra geral para a guarda dos filhos quando os pais se separam?",
      opcoes: ["Guarda compartilhada", "Guarda sempre com a mãe", "Guarda unilateral", "Guarda alternada semanal"],
      correta: 0,
      explicacao: "Desde a Lei 13.058/2014 a guarda compartilhada é a regra, mesmo quando não há acordo entre os pais.",
    },

    // ── Digital ─────────────────────────────────────────────────────────────
    {
      tipo: "escolha",
      enunciado: "Qual lei trata da proteção de dados pessoais no Brasil?",
      opcoes: ["LGPD", "Marco Civil da Internet", "Código de Defesa do Consumidor", "Lei Carolina Dieckmann"],
      correta: 0,
      explicacao: "Lei 13.709/2018, em vigor desde 2020.",
    },
    {
      tipo: "escolha",
      enunciado: "Qual lei estabelece princípios, garantias e deveres para o uso da internet no Brasil?",
      opcoes: ["Marco Civil da Internet", "LGPD", "Código Civil", "Lei de Acesso à Informação"],
      correta: 0,
      explicacao: "Lei 12.965/2014 — é dela que vêm a neutralidade da rede e as regras de guarda de registros de conexão.",
    },
    {
      tipo: "escolha",
      enunciado: "Pela LGPD, o titular dos dados pode exigir da empresa que:",
      opcoes: [
        "Informe quais dados tem e os exclua quando cabível",
        "Pague uma indenização automática por qualquer coleta",
        "Nunca colete dado nenhum",
        "Entregue a lista de todos os outros clientes",
      ],
      correta: 0,
    },

    // ── Direito ou Mito ─────────────────────────────────────────────────────
    {
      tipo: "vf",
      afirmacao: "Achado não é roubado.",
      verdadeiro: false,
      explicacao: "Quem encontra coisa perdida deve procurar o dono ou entregar à autoridade. Ficar com o objeto pode configurar apropriação de coisa achada (art. 169 do Código Penal).",
    },
    {
      tipo: "vf",
      afirmacao: "Comprei pela internet e me arrependi em 5 dias — posso cancelar sem dar justificativa.",
      verdadeiro: true,
      explicacao: "O art. 49 do CDC dá 7 dias para desistir de compras feitas fora da loja física, sem precisar explicar o motivo.",
    },
    {
      tipo: "vf",
      afirmacao: "A loja pode simplesmente se recusar a resolver um produto que veio com defeito.",
      verdadeiro: false,
      explicacao: "Defeito não é arrependimento. O CDC obriga o fornecedor a sanar o vício no prazo, e a placa de 'não trocamos' não vale contra isso.",
    },
    {
      tipo: "vf",
      afirmacao: "Na loja física e sem defeito, trocar porque o cliente não gostou da cor é cortesia — não obrigação legal.",
      verdadeiro: true,
      explicacao: "O direito de arrependimento do CDC vale para compras fora do estabelecimento. Na loja física, a troca por gosto é política da casa — mas se ela promete trocar, passa a valer.",
    },
    {
      tipo: "vf",
      afirmacao: "Todo trabalhador com carteira assinada tem direito ao 13º salário.",
      verdadeiro: true,
      explicacao: "Garantido desde a Lei 4.090/1962 e reforçado pela Constituição.",
    },
    {
      tipo: "vf",
      afirmacao: "O patrão pode descontar do salário qualquer prejuízo que o funcionário causar.",
      verdadeiro: false,
      explicacao: "Art. 462 da CLT: o desconto por dano exige dolo, ou culpa com previsão expressa no contrato. Não é automático.",
    },
    {
      tipo: "vf",
      afirmacao: "Se está escrito no contrato e a pessoa assinou, a cláusula vale de qualquer jeito.",
      verdadeiro: false,
      explicacao: "Nas relações de consumo, cláusulas abusivas são nulas de pleno direito (art. 51 do CDC) — a assinatura não conserta.",
    },
    {
      tipo: "vf",
      afirmacao: "O Brasil já teve mais de cinco Constituições diferentes.",
      verdadeiro: true,
      explicacao: "A de 1988 é a sétima. Antes dela vieram as de 1824, 1891, 1934, 1937, 1946 e 1967.",
    },
    {
      tipo: "vf",
      afirmacao: "Fora do flagrante, a prisão depende de ordem escrita e fundamentada de um juiz.",
      verdadeiro: true,
      explicacao: "Art. 5º, LXI da Constituição, ressalvados os casos de transgressão militar ou crime propriamente militar.",
    },
    {
      tipo: "vf",
      afirmacao: "A guarda compartilhada só é aplicada quando os pais se dão bem.",
      verdadeiro: false,
      explicacao: "Ela é a regra mesmo sem acordo. O critério é o melhor interesse da criança, não a boa convivência entre os pais.",
    },

    // ── Ordenar ─────────────────────────────────────────────────────────────
    {
      tipo: "ordem",
      enunciado: "Coloque as normas da MAIS ALTA para a MAIS BAIXA na hierarquia.",
      dicaOrdem: "mais alta primeiro",
      itens: ["Constituição Federal", "Lei ordinária", "Decreto", "Portaria"],
    },
    {
      tipo: "ordem",
      enunciado: "Coloque as leis em ordem CRONOLÓGICA.",
      dicaOrdem: "mais antiga primeiro",
      itens: [
        "Constituição Federal",
        "Código de Defesa do Consumidor",
        "Marco Civil da Internet",
        "LGPD",
      ],
      explicacao: "1988 · 1990 · 2014 · 2018.",
    },
    {
      tipo: "ordem",
      enunciado: "Coloque as etapas de um processo na ordem em que acontecem.",
      dicaOrdem: "primeira etapa primeiro",
      itens: ["Petição inicial", "Contestação", "Sentença", "Recurso"],
    },
    {
      tipo: "ordem",
      enunciado: "Coloque as instâncias da PRIMEIRA para a ÚLTIMA.",
      dicaOrdem: "primeira instância primeiro",
      itens: [
        "Juiz de primeiro grau",
        "Tribunal de Justiça",
        "Superior Tribunal de Justiça",
        "Supremo Tribunal Federal",
      ],
    },

    // ── Qual lei é essa? ────────────────────────────────────────────────────
    {
      tipo: "pistas",
      pistas: [
        "Sou de 1990 e nasci por determinação da Constituição.",
        "Falo de vício do produto, garantia e propaganda enganosa.",
        "Meu apelido tem três letras e todo consumidor já me citou numa discussão.",
      ],
      opcoes: [
        "Código de Defesa do Consumidor",
        "Código Civil",
        "Marco Civil da Internet",
        "Lei da Concorrência",
      ],
      correta: 0,
    },
    {
      tipo: "pistas",
      pistas: [
        "Sou de 2018, mas só comecei a valer em 2020.",
        "Falo de consentimento, finalidade e do direito de saber o que sabem sobre você.",
        "Criei uma autoridade nacional só para me fiscalizar.",
      ],
      opcoes: ["LGPD", "Marco Civil da Internet", "Lei de Acesso à Informação", "Código de Defesa do Consumidor"],
      correta: 0,
    },
    {
      tipo: "pistas",
      pistas: [
        "Sou de 1943 e sobrevivi a várias reformas.",
        "Trato de jornada, férias, aviso prévio e rescisão.",
        "Minha sigla tem três letras e aparece em toda carteira assinada.",
      ],
      opcoes: ["CLT", "CDC", "CPC", "CF"],
      correta: 0,
    },
    {
      tipo: "pistas",
      pistas: [
        "Sou de 2014 e cuido de como a internet funciona no país.",
        "Garanti que o provedor não pode discriminar o seu tráfego.",
        "Também defini quando um site responde pelo conteúdo de terceiros.",
      ],
      opcoes: [
        "Marco Civil da Internet",
        "LGPD",
        "Lei Carolina Dieckmann",
        "Estatuto da Criança e do Adolescente",
      ],
      correta: 0,
    },
  ],
};
