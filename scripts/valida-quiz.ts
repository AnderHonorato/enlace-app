/**
 * Valida os pacotes de quiz e simula partidas completas.
 *
 * Rode depois de escrever uma categoria nova: `npm run quiz:check`.
 *
 * Existe porque o conteúdo é a parte que mais cresce e a que erra em silêncio —
 * um índice `correta` apontando para a opção errada não quebra nada, só ensina
 * a coisa errada para quem está jogando.
 */

import { PACOTES } from "../src/nucleo/quiz";
import type { Pergunta } from "../src/nucleo/quiz";
import {
  conferirOrdem,
  gabaritoDaOrdem,
  montarRodada,
  xpDaPergunta,
  POR_RODADA,
  XP_ESCOLHA,
  XP_RODADA_PERFEITA,
  type Preparada,
} from "../src/nucleo/quiz/motor";

let erros = 0;
const falha = (msg: string) => {
  erros++;
  console.log("  \x1b[31m✗\x1b[0m " + msg);
};
const ok = (msg: string) => console.log("  \x1b[32m✓\x1b[0m " + msg);

/** Texto da resposta certa, do jeito que foi escrito no arquivo de dados. */
function gabaritoOriginal(q: Pergunta): string | null {
  if (q.tipo === "escolha" || q.tipo === "pistas") return q.opcoes[q.correta];
  if (q.tipo === "vf") return q.verdadeiro ? "Verdade" : "Mito";
  return null;
}

// ── 1. Integridade dos dados ────────────────────────────────────────────────
console.log("\n\x1b[1mIntegridade dos pacotes\x1b[0m");

for (const pacote of PACOTES) {
  const contagem: Record<string, number> = {};

  pacote.perguntas.forEach((q, n) => {
    contagem[q.tipo] = (contagem[q.tipo] ?? 0) + 1;
    const onde = `${pacote.key}[${n}] (${q.tipo})`;

    if (q.tipo === "escolha" || q.tipo === "pistas") {
      if (q.opcoes.length < 2) falha(`${onde}: menos de 2 opções`);
      if (q.correta < 0 || q.correta >= q.opcoes.length) falha(`${onde}: 'correta' fora do intervalo`);
      if (new Set(q.opcoes).size !== q.opcoes.length) falha(`${onde}: opções repetidas`);
      if (q.opcoes.some((o) => !o.trim())) falha(`${onde}: opção vazia`);
      if (q.tipo === "pistas" && q.pistas.length < 2) falha(`${onde}: menos de 2 pistas`);
    }

    if (q.tipo === "vf" && !q.explicacao.trim()) falha(`${onde}: explicação vazia`);

    if (q.tipo === "ordem") {
      if (q.itens.length < 3) falha(`${onde}: menos de 3 itens`);
      // A correção compara por texto — item repetido tornaria a ordem ambígua.
      if (new Set(q.itens).size !== q.itens.length) falha(`${onde}: itens repetidos`);
    }
  });

  if (pacote.perguntas.length < POR_RODADA * 3) {
    falha(`${pacote.key}: só ${pacote.perguntas.length} perguntas — repete rápido demais`);
  }

  // "Verdade" fica sempre no primeiro botão, então um pacote desequilibrado
  // ensina a chutar: basta responder sempre Verdade para acertar a maioria.
  const vf = pacote.perguntas.filter((q) => q.tipo === "vf");
  const verdades = vf.filter((q) => q.tipo === "vf" && q.verdadeiro).length;
  const proporcao = verdades / vf.length;
  if (vf.length > 0 && (proporcao < 0.35 || proporcao > 0.65)) {
    falha(
      `${pacote.key}: ${verdades}/${vf.length} afirmações verdadeiras (${Math.round(proporcao * 100)}%) — chutar "Verdade" acerta demais`
    );
  }

  ok(`${pacote.key}: ${pacote.perguntas.length} perguntas ${JSON.stringify(contagem)} · ${verdades}V/${vf.length - verdades}M`);
}

const chaves = PACOTES.map((p) => p.key);
if (new Set(chaves).size !== chaves.length) falha("chaves de pacote repetidas");

// ── 2. Partidas simuladas ───────────────────────────────────────────────────
const RODADAS = 300;
console.log(`\n\x1b[1mSimulação — ${RODADAS} rodadas por pacote\x1b[0m`);

/** Joga uma rodada acertando tudo. Devolve o XP somado. */
function jogarPerfeito(rodada: Preparada[]): number {
  let xp = 0;
  for (const item of rodada) {
    if (item.q.tipo === "ordem") {
      const montada = gabaritoDaOrdem(item);
      if (!conferirOrdem(item, montada)) {
        falha("ordenação correta foi reprovada pela conferência");
        continue;
      }
      xp += xpDaPergunta(item.q, 1);
    } else {
      if (item.opcoes[item.correta] !== gabaritoOriginal(item.q)) {
        falha(`embaralhar perdeu o gabarito (${item.q.tipo})`);
        continue;
      }
      xp += xpDaPergunta(item.q, 1);
    }
  }
  return xp + XP_RODADA_PERFEITA;
}

for (const pacote of PACOTES) {
  /** Em que posição a resposta certa caiu — se sempre for a mesma, o embaralhamento é decorativo. */
  const posicoes = new Map<number, number>();
  let ordemJaResolvida = 0;
  let erradasAceitas = 0;
  let xpTotal = 0;

  for (let r = 0; r < RODADAS; r++) {
    const rodada = montarRodada(pacote.perguntas, true);

    if (rodada.length !== Math.min(POR_RODADA, pacote.perguntas.length)) {
      falha(`${pacote.key}: rodada com ${rodada.length} perguntas`);
    }
    const enunciados = rodada.map((i) => JSON.stringify(i.q));
    if (new Set(enunciados).size !== enunciados.length) {
      falha(`${pacote.key}: pergunta repetida dentro da mesma rodada`);
    }

    for (const item of rodada) {
      if (item.q.tipo === "ordem") {
        // Sair já resolvido daria o ponto de graça.
        if (item.embaralhados.every((v, i) => v === (item.q as { itens: string[] }).itens[i])) {
          ordemJaResolvida++;
        }
        // Uma ordem trocada tem de ser reprovada.
        const trocada = gabaritoDaOrdem(item).slice();
        [trocada[0], trocada[1]] = [trocada[1], trocada[0]];
        if (conferirOrdem(item, trocada)) erradasAceitas++;
      } else if (item.opcoes.length === 4) {
        // Só perguntas de 4 opções entram na conta: verdadeiro/falso tem a
        // ordem fixa (Verdade, Mito) de propósito e enviesaria a medição.
        posicoes.set(item.correta, (posicoes.get(item.correta) ?? 0) + 1);
      }
    }

    xpTotal += jogarPerfeito(rodada);
  }

  if (ordemJaResolvida > 0) falha(`${pacote.key}: ${ordemJaResolvida}x uma ordenação nasceu já resolvida`);
  if (erradasAceitas > 0) falha(`${pacote.key}: ${erradasAceitas}x uma ordem errada passou como certa`);

  const espalhamento = [...posicoes.entries()].sort((a, b) => a[0] - b[0]);
  if (espalhamento.length !== 4) {
    falha(`${pacote.key}: a resposta certa só caiu em ${espalhamento.length} das 4 posições`);
  }

  // Com o embaralhamento funcionando, cada posição fica perto de 1/4 do total.
  // Um desvio grande aqui significa que o gabarito está previsível.
  const total = [...posicoes.values()].reduce((s, n) => s + n, 0);
  const esperado = total / 4;
  for (const [posicao, n] of espalhamento) {
    const desvio = Math.abs(n - esperado) / esperado;
    if (desvio > 0.2) {
      falha(
        `${pacote.key}: alternativa ${String.fromCharCode(65 + posicao)} é a correta ${Math.round((n / total) * 100)}% das vezes (esperado ~25%)`
      );
    }
  }

  ok(
    `${pacote.key}: gabarito por posição ${espalhamento.map(([p, n]) => `${String.fromCharCode(65 + p)}:${Math.round((n / total) * 100)}%`).join(" ")} · XP médio da rodada perfeita ${Math.round(xpTotal / RODADAS)}`
  );
}

// ── 3. Escala de XP das pistas ──────────────────────────────────────────────
console.log("\n\x1b[1mXP por pistas abertas\x1b[0m");
const comPistas = PACOTES.flatMap((p) => p.perguntas).find((q) => q.tipo === "pistas");
if (!comPistas) {
  falha("nenhuma pergunta de pistas encontrada");
} else {
  const escala = [1, 2, 3, 4].map((n) => xpDaPergunta(comPistas, n));
  const sempreCaindo = escala.every((v, i) => i === 0 || v <= escala[i - 1]);
  if (!sempreCaindo) falha(`XP de pistas não é decrescente: ${escala.join(" → ")}`);
  if (escala[0] <= XP_ESCOLHA) {
    falha(`acertar com 1 pista (${escala[0]}) deveria valer mais que uma múltipla escolha comum (${XP_ESCOLHA})`);
  }
  if (escala[escala.length - 1] > XP_ESCOLHA) {
    falha("abrir todas as pistas ainda vale mais que uma múltipla escolha — não há custo em pedir ajuda");
  }
  ok(`1→4 pistas: ${escala.join(" → ")} XP (múltipla escolha comum: ${XP_ESCOLHA})`);
}

console.log(
  erros === 0
    ? "\n\x1b[32m✓ Motor e pacotes válidos\x1b[0m\n"
    : `\n\x1b[31m✗ ${erros} problema(s)\x1b[0m\n`
);
process.exit(erros === 0 ? 0 : 1);
