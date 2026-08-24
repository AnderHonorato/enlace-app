import { NextResponse } from "next/server";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";

export const dynamic = "force-dynamic";

type GuessEntry = { userId: string; userName: string; guess: string; states: string[]; timestamp: string };
const TIMER_SECONDS = 60;

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.coupleId) return NextResponse.json({ game: null });

  const game = await prisma.wordleGame.findUnique({ where: { coupleId: user.coupleId } });
  if (!game) return NextResponse.json({ game: null });

  const remaining = game.timerEndsAt
    ? Math.max(0, Math.ceil((game.timerEndsAt.getTime() - Date.now()) / 1000))
    : 0;

  return NextResponse.json({
    game: {
      id: game.id,
      word: game.word,
      category: game.category,
      emoji: game.emoji,
      locked: game.locked,
      lockedBy: game.lockedBy,
      currentTurn: game.currentTurn,
      skipReqBy: game.skipReqBy,
      remainingSeconds: remaining,
      guesses: JSON.parse(game.guesses) as GuessEntry[],
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.coupleId) return NextResponse.json({ error: "Sem casal" }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }); }

  const { action } = body;
  if (!action) return NextResponse.json({ error: "Ação obrigatória" }, { status: 400 });

  let game = await prisma.wordleGame.findUnique({ where: { coupleId: user.coupleId } });
  const userName = user.displayName || user.name;

  const now = () => new Date(Date.now() + TIMER_SECONDS * 1000);

  switch (action) {
    case "start": {
      const { word, category, emoji } = body;
      if (!word) return NextResponse.json({ error: "Palavra obrigatória" }, { status: 400 });
      game = await prisma.wordleGame.upsert({
        where: { coupleId: user.coupleId },
        create: { coupleId: user.coupleId, word: word.toUpperCase(), category: category || "", emoji: emoji || "", currentTurn: user.id, guesses: "[]", timerEndsAt: now() },
        update: { word: word.toUpperCase(), category: category || "", emoji: emoji || "", locked: false, lockedBy: null, currentTurn: user.id, skipReqBy: null, guesses: "[]", timerEndsAt: now() },
      });
      break;
    }

    case "guess": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      if (game.locked && game.lockedBy !== user.id) return NextResponse.json({ error: "Bloqueado" }, { status: 403 });
      // Verifica timeout
      if (game.timerEndsAt && new Date() > game.timerEndsAt) return NextResponse.json({ error: "Tempo esgotado!" }, { status: 403 });

      const { guess } = body;
      if (!guess || guess.length !== 5) return NextResponse.json({ error: "Palpite inválido" }, { status: 400 });

      const secreta = game.word;
      const g = guess.toUpperCase();
      const states = calcularEstados(g, secreta);
      const guesses = JSON.parse(game.guesses) as GuessEntry[];
      guesses.push({ userId: user.id, userName, guess: g, states, timestamp: new Date().toISOString() });

      const won = g === secreta;
      const myCount = guesses.filter((x) => x.userId === user.id).length;

      let nextTurn = game.currentTurn;
      let nextTimer = game.timerEndsAt;
      if (won || myCount >= 6) {
        // Passa a vez
        const members = await prisma.user.findMany({ where: { coupleId: user.coupleId, id: { not: user.id } }, select: { id: true } });
        const other = members[0];
        if (other) {
          const otherCount = guesses.filter((x) => x.userId === other.id).length;
          const otherWon = guesses.some((x) => x.userId === other.id && x.guess === secreta);
          if (otherWon || otherCount >= 6) {
            nextTurn = "";
            nextTimer = null;
          } else {
            nextTurn = other.id;
            nextTimer = now();
          }
        } else {
          nextTurn = "";
          nextTimer = null;
        }
      }

      game = await prisma.wordleGame.update({
        where: { id: game.id },
        data: { guesses: JSON.stringify(guesses), currentTurn: nextTurn, timerEndsAt: nextTimer, skipReqBy: null, locked: false, lockedBy: null },
      });
      break;
    }

    case "timeout": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      const guesses = JSON.parse(game.guesses) as GuessEntry[];
      // Passa a vez pro outro
      const members = await prisma.user.findMany({ where: { coupleId: user.coupleId, id: { not: user.id } }, select: { id: true } });
      const other = members[0];
      let nextTurn = "";
      let nextTimer = null;
      if (other) {
        const otherWon = guesses.some((x) => x.userId === other.id && x.guess === game!.word);
        const otherCount = guesses.filter((x) => x.userId === other.id).length;
        if (!otherWon && otherCount < 6) { nextTurn = other.id; nextTimer = now(); }
      }
      game = await prisma.wordleGame.update({
        where: { id: game.id },
        data: { currentTurn: nextTurn, timerEndsAt: nextTimer, locked: false, lockedBy: null },
      });
      break;
    }

    case "lock": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      game = await prisma.wordleGame.update({ where: { id: game.id }, data: { locked: true, lockedBy: user.id } });
      break;
    }

    case "unlock": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      if (game.lockedBy && game.lockedBy !== user.id) return NextResponse.json({ error: "Só quem bloqueou pode desbloquear" }, { status: 403 });
      game = await prisma.wordleGame.update({ where: { id: game.id }, data: { locked: false, lockedBy: null } });
      break;
    }

    case "skip-req": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      game = await prisma.wordleGame.update({ where: { id: game.id }, data: { skipReqBy: user.id } });
      break;
    }

    case "skip-accept": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      if (!game.skipReqBy || game.skipReqBy === user.id) return NextResponse.json({ error: "Nenhuma solicitação pendente" }, { status: 400 });
      const entry = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
      game = await prisma.wordleGame.update({
        where: { id: game.id },
        data: { word: entry.word.toUpperCase(), category: entry.category, emoji: entry.emoji, locked: false, lockedBy: null, currentTurn: user.id, skipReqBy: null, guesses: "[]", timerEndsAt: now() },
      });
      break;
    }

    case "skip-reject": {
      if (!game) return NextResponse.json({ error: "Nenhum jogo ativo" }, { status: 400 });
      game = await prisma.wordleGame.update({ where: { id: game.id }, data: { skipReqBy: null } });
      break;
    }

    default:
      return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  }

  const postRemaining = game!.timerEndsAt
    ? Math.max(0, Math.ceil((game!.timerEndsAt.getTime() - Date.now()) / 1000))
    : 0;

  return NextResponse.json({
    game: {
      id: game!.id, word: game!.word, category: game!.category, emoji: game!.emoji,
      locked: game!.locked, lockedBy: game!.lockedBy, currentTurn: game!.currentTurn,
      skipReqBy: game!.skipReqBy, remainingSeconds: postRemaining,
      guesses: JSON.parse(game!.guesses) as GuessEntry[],
    },
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user?.coupleId) return NextResponse.json({ error: "Sem casal" }, { status: 400 });
  const game = await prisma.wordleGame.findUnique({ where: { coupleId: user.coupleId } });
  if (game) await prisma.wordleGame.delete({ where: { id: game.id } });
  return NextResponse.json({ ok: true });
}

function calcularEstados(chute: string, secreta: string): string[] {
  const result: string[] = Array(5).fill("ausente");
  const restantes = secreta.split("");
  for (let i = 0; i < 5; i++) { if (chute[i] === secreta[i]) { result[i] = "certa"; restantes[i] = ""; } }
  for (let i = 0; i < 5; i++) { if (result[i] === "certa") continue; const idx = restantes.indexOf(chute[i]); if (idx !== -1) { result[i] = "presente"; restantes[idx] = ""; } }
  return result;
}

const PALAVRAS = [
  { word: "amora", category: "fruta", emoji: "🫐" }, { word: "beijo", category: "carinho", emoji: "💋" },
  { word: "calma", category: "sentimento", emoji: "😌" }, { word: "sonho", category: "abstrato", emoji: "💭" },
  { word: "festa", category: "evento", emoji: "🎉" }, { word: "noite", category: "tempo", emoji: "🌙" },
  { word: "praia", category: "lugar", emoji: "🏖️" }, { word: "carta", category: "objeto", emoji: "💌" },
  { word: "filme", category: "entretenimento", emoji: "🎬" }, { word: "livro", category: "objeto", emoji: "📖" },
  { word: "flora", category: "natureza", emoji: "🌺" }, { word: "mundo", category: "lugar", emoji: "🌍" },
  { word: "dança", category: "ação", emoji: "💃" }, { word: "areia", category: "natureza", emoji: "🏝️" },
  { word: "barco", category: "transporte", emoji: "⛵" }, { word: "claro", category: "adjetivo", emoji: "💡" },
  { word: "forte", category: "adjetivo", emoji: "💪" }, { word: "bicho", category: "animal", emoji: "🐾" },
  { word: "tigre", category: "animal", emoji: "🐯" }, { word: "águia", category: "animal", emoji: "🦅" },
  { word: "peixe", category: "animal", emoji: "🐟" }, { word: "arroz", category: "comida", emoji: "🍚" },
  { word: "carne", category: "comida", emoji: "🥩" }, { word: "fruta", category: "comida", emoji: "🍎" },
  { word: "leite", category: "comida", emoji: "🥛" }, { word: "massa", category: "comida", emoji: "🍝" },
  { word: "pizza", category: "comida", emoji: "🍕" }, { word: "torta", category: "comida", emoji: "🥧" },
  { word: "caixa", category: "objeto", emoji: "📦" }, { word: "chave", category: "objeto", emoji: "🔑" },
  { word: "hotel", category: "lugar", emoji: "🏨" }, { word: "chuva", category: "natureza", emoji: "🌧️" },
  { word: "vento", category: "natureza", emoji: "💨" }, { word: "pedra", category: "natureza", emoji: "🪨" },
  { word: "nuvem", category: "natureza", emoji: "☁️" }, { word: "terra", category: "natureza", emoji: "🌎" },
  { word: "verde", category: "cor", emoji: "🟢" }, { word: "preto", category: "cor", emoji: "⚫" },
  { word: "jogar", category: "ação", emoji: "🎮" }, { word: "ganha", category: "ação", emoji: "🏆" },
  { word: "viaja", category: "ação", emoji: "✈️" }, { word: "fácil", category: "adjetivo", emoji: "👍" },
  { word: "ótimo", category: "adjetivo", emoji: "🌟" }, { word: "único", category: "adjetivo", emoji: "💎" },
  { word: "tênis", category: "esporte", emoji: "🎾" }, { word: "herói", category: "pessoa", emoji: "🦸" },
  { word: "líder", category: "pessoa", emoji: "👑" }, { word: "abril", category: "tempo", emoji: "📅" },
];
