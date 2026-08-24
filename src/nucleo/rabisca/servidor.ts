import "server-only";
import { customAlphabet } from "nanoid";
import { prisma } from "@/nucleo/prisma";
import { bad } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { diaBR } from "@/nucleo/pontuacao";
import type {
  RabiscaMode,
  RabiscaResult,
  RabiscaRoomDTO,
  RabiscaTheme,
  RabiscaStatus,
} from "./tipos";

const ROOM_CODE = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
export const RABISCA_ONLINE_MS = 16_000;

const THEMES: Record<RabiscaTheme, string[]> = {
  cotidiano: [
    "abajur", "aspirador", "bicicleta", "cafeteira", "cadeira", "carteira",
    "chave", "chuveiro", "escada", "espelho", "guarda-chuva", "janela",
    "livro", "mochila", "óculos", "relógio", "sofá", "telefone", "vassoura",
  ],
  viagem: [
    "aeroporto", "avião", "barraca", "bússola", "cachoeira", "caravana",
    "farol", "hotel", "ilha", "mapa", "montanha", "passaporte", "praia",
    "trilha", "trem", "mala", "ponte", "mirante",
  ],
  comida: [
    "abacaxi", "brigadeiro", "café", "caju", "churrasco", "coxinha", "feijoada",
    "hambúrguer", "melancia", "panqueca", "pastel", "pizza", "pudim", "sanduíche",
    "sorvete", "tapioca", "torta", "uva",
  ],
  brasil: [
    "arara", "berimbau", "boto", "capivara", "carnaval", "chimarrão", "coqueiro",
    "frevo", "futebol", "ipê", "jangada", "onça", "pandeiro", "saci", "samba",
    "tucano", "vitória-régia", "violão",
  ],
};

const ROOM_INCLUDE = {
  players: {
    where: { leftAt: null },
    orderBy: { joinedAt: "asc" as const },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          displayName: true,
          avatarColor: true,
          avatarUrl: true,
          coupleId: true,
        },
      },
    },
  },
} as const;

type RoomBase = NonNullable<Awaited<ReturnType<typeof findRoomBase>>>;

function findRoomBase(id: string) {
  return prisma.rabiscaRoom.findUnique({ where: { id }, include: ROOM_INCLUDE });
}

function displayName(user: { name: string; displayName: string | null }) {
  return user.displayName || user.name;
}

function parseResult(value: string): RabiscaResult | null {
  try {
    const parsed = JSON.parse(value);
    return parsed?.word ? parsed : null;
  } catch {
    return null;
  }
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

export function wordSimilarity(guess: string, word: string) {
  const a = normalized(guess);
  const b = normalized(word);
  if (!a || !b) return 0;
  const longest = Math.max(a.length, b.length);
  return Math.max(0, Math.round((1 - levenshtein(a, b) / longest) * 100));
}

function nextWord(theme: string, roomId: string, round: number) {
  const list = THEMES[(theme in THEMES ? theme : "cotidiano") as RabiscaTheme];
  let seed = round * 31;
  for (const char of roomId) seed = (seed * 33 + char.charCodeAt(0)) >>> 0;
  return list[seed % list.length];
}

function secondsLeft(room: Pick<RoomBase, "status" | "roundSeconds" | "roundStartedAt">) {
  if (!room.roundStartedAt) return room.roundSeconds;
  if (room.status === "roundEnd" || room.status === "finished") return 0;
  return Math.max(0, room.roundSeconds - Math.floor((Date.now() - room.roundStartedAt.getTime()) / 1000));
}

function isPlayerOnline(player: RoomBase["players"][number]) {
  return player.online && Date.now() - player.lastSeenAt.getTime() < RABISCA_ONLINE_MS;
}

export async function requireRoom(id: string, userId: string) {
  const room = await findRoomBase(id);
  if (!room) throw bad("Sala não encontrada.", 404);
  if (!room.players.some((player) => player.userId === userId)) {
    throw bad("Você não participa desta sala.", 403);
  }
  return room;
}

async function expireRoundIfNeeded(room: RoomBase) {
  if (room.status !== "active" || secondsLeft(room) > 0 || !room.word) return room;
  const result: RabiscaResult = {
    winnerId: null,
    winnerName: null,
    word: room.word,
    reason: "time",
    at: new Date().toISOString(),
  };
  return prisma.rabiscaRoom.update({
    where: { id: room.id },
    data: { status: "roundEnd", result: JSON.stringify(result) },
    include: ROOM_INCLUDE,
  });
}

/** Atualiza presença e faz as transições de pausa/retomada/tempo no servidor. */
export async function refreshRabiscaRoom(id: string, userId: string) {
  await requireRoom(id, userId);
  const now = new Date();
  const cutoff = new Date(now.getTime() - RABISCA_ONLINE_MS);

  await prisma.$transaction([
    prisma.rabiscaPlayer.updateMany({
      where: { roomId: id, leftAt: null, lastSeenAt: { lt: cutoff } },
      data: { online: false },
    }),
    prisma.rabiscaPlayer.updateMany({
      where: { roomId: id, userId, leftAt: null },
      data: { online: true, lastSeenAt: now },
    }),
  ]);

  let room = await findRoomBase(id);
  if (!room) throw bad("Sala não encontrada.", 404);
  const drawerId = room.drawerId;
  const hostId = room.hostId;
  const onlineCount = room.players.filter(isPlayerOnline).length;
  const drawerOnline = !drawerId || room.players.some((player) => player.userId === drawerId && isPlayerOnline(player));
  const hostOnline = room.players.some((player) => player.userId === hostId && isPlayerOnline(player));

  // A sala não fica refém do celular que a criou. Se o anfitrião cair, a
  // primeira pessoa online recebe os controles de continuar/encerrar.
  if (!hostOnline) {
    const replacement = room.players.find(isPlayerOnline);
    if (replacement) {
      room = await prisma.rabiscaRoom.update({
        where: { id },
        data: { hostId: replacement.userId },
        include: ROOM_INCLUDE,
      });
    }
  }

  if (room.status === "active" && (onlineCount < 2 || !drawerOnline)) {
    room = await prisma.rabiscaRoom.update({
      where: { id },
      data: { status: "paused", pausedAt: now },
      include: ROOM_INCLUDE,
    });
  } else if (room.status === "paused" && onlineCount >= 2 && drawerOnline) {
    const pauseMs = room.pausedAt ? now.getTime() - room.pausedAt.getTime() : 0;
    const shiftedStart = room.roundStartedAt
      ? new Date(room.roundStartedAt.getTime() + Math.max(0, pauseMs))
      : now;
    room = await prisma.rabiscaRoom.update({
      where: { id },
      data: { status: "active", pausedAt: null, roundStartedAt: shiftedStart },
      include: ROOM_INCLUDE,
    });
  }

  return expireRoundIfNeeded(room);
}

export async function serializeRabiscaRoom(room: RoomBase, viewerId: string): Promise<RabiscaRoomDTO> {
  const [strokes, guesses] = await Promise.all([
    room.round
      ? prisma.rabiscaStroke.findMany({
          where: { roomId: room.id, round: room.round },
          orderBy: { createdAt: "asc" },
          take: 650,
        })
      : [],
    room.round
      ? prisma.rabiscaGuess.findMany({
          where: { roomId: room.id, round: room.round },
          include: { author: { select: { name: true, displayName: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : [],
  ]);
  const revealWord = room.drawerId === viewerId || room.status === "roundEnd" || room.status === "finished";

  return {
    id: room.id,
    code: room.code,
    title: room.title,
    theme: room.theme as RabiscaTheme,
    mode: room.mode as RabiscaMode,
    status: room.status as RabiscaStatus,
    hostId: room.hostId,
    meId: viewerId,
    isHost: room.hostId === viewerId,
    round: room.round,
    totalRounds: room.totalRounds,
    roundSeconds: room.roundSeconds,
    secondsLeft: secondsLeft(room),
    drawerId: room.drawerId,
    isDrawer: room.drawerId === viewerId,
    word: revealWord ? room.word : null,
    wordMask: room.word ? room.word.replace(/[^\s-]/g, "—") : "",
    result: parseResult(room.result),
    players: room.players
      .map((player) => ({
        id: player.id,
        userId: player.userId,
        name: displayName(player.user),
        avatarColor: player.user.avatarColor,
        avatarUrl: player.user.avatarUrl,
        score: player.score,
        online: isPlayerOnline(player),
        isMe: player.userId === viewerId,
        isHost: player.userId === room.hostId,
        isDrawer: player.userId === room.drawerId,
      }))
      .sort((a, b) => b.score - a.score),
    strokes: strokes.map((stroke) => ({
      id: stroke.id,
      points: JSON.parse(stroke.points),
      color: stroke.color,
      width: stroke.width,
    })),
    guesses: guesses.reverse().map((guess) => ({
      id: guess.id,
      userId: guess.authorId,
      name: displayName(guess.author),
      text: guess.text,
      similarity: guess.similarity,
      correct: guess.correct,
      createdAt: guess.createdAt.toISOString(),
    })),
    createdAt: room.createdAt.toISOString(),
  };
}

export async function createRabiscaRoom(userId: string) {
  let code = ROOM_CODE();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const exists = await prisma.rabiscaRoom.findUnique({ where: { code }, select: { id: true } });
    if (!exists) break;
    code = ROOM_CODE();
  }
  return prisma.rabiscaRoom.create({
    data: {
      code,
      hostId: userId,
      players: { create: { userId, online: true } },
    },
    include: ROOM_INCLUDE,
  });
}

export async function joinRabiscaRoom(codeValue: string, userId: string) {
  const code = codeValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const room = await prisma.rabiscaRoom.findUnique({ where: { code }, include: ROOM_INCLUDE });
  if (!room || room.status === "finished") throw bad("Código de sala inválido ou encerrado.", 404);
  if (room.players.length >= 12 && !room.players.some((player) => player.userId === userId)) {
    throw bad("A sala já está cheia.", 409);
  }
  await prisma.rabiscaPlayer.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId, online: true },
    update: { online: true, leftAt: null, lastSeenAt: new Date() },
  });
  const updated = await findRoomBase(room.id);
  if (!updated) throw bad("Sala não encontrada.", 404);
  return updated;
}

export async function setRabiscaOffline(roomId: string, userId: string, leave = false) {
  await requireRoom(roomId, userId);
  await prisma.rabiscaPlayer.updateMany({
    where: { roomId, userId },
    data: { online: false, ...(leave ? { leftAt: new Date() } : {}) },
  });

  const room = await findRoomBase(roomId);
  if (!room) return;
  const remaining = room.players;
  const online = remaining.filter(isPlayerOnline);
  const data: Record<string, unknown> = {};
  if (room.hostId === userId && online[0]) data.hostId = online[0].userId;
  if (leave && room.drawerId === userId && remaining[0]) {
    data.drawerId = online[0]?.userId ?? remaining[0].userId;
  }
  if (!remaining.length) {
    data.status = "finished";
    data.finishedAt = new Date();
  } else if (
    room.status === "active" &&
    (online.length < 2 || !room.drawerId || !online.some((player) => player.userId === room.drawerId))
  ) {
    data.status = "paused";
    data.pausedAt = new Date();
  }
  if (Object.keys(data).length) await prisma.rabiscaRoom.update({ where: { id: roomId }, data });
}

function activePlayers(room: RoomBase) {
  return room.players.filter(isPlayerOnline);
}

function nextDrawer(room: RoomBase) {
  const online = activePlayers(room);
  if (!online.length) return null;
  const index = online.findIndex((player) => player.userId === room.drawerId);
  return online[(index + 1 + online.length) % online.length]?.userId ?? online[0].userId;
}

export async function applyRabiscaAction(roomId: string, userId: string, move: Record<string, unknown>) {
  let room = await refreshRabiscaRoom(roomId, userId);
  const type = String(move.type || "");

  if (type === "settings") {
    if (room.hostId !== userId || room.status !== "waiting") throw bad("Só o anfitrião configura a sala.", 403);
    const mode = ["classico", "rapido", "sem_borracha"].includes(String(move.mode))
      ? String(move.mode)
      : room.mode;
    const theme = Object.prototype.hasOwnProperty.call(THEMES, String(move.theme)) ? String(move.theme) : room.theme;
    const totalRounds = [3, 5, 8].includes(Number(move.totalRounds)) ? Number(move.totalRounds) : room.totalRounds;
    const requestedSeconds = [45, 60, 80, 90].includes(Number(move.roundSeconds))
      ? Number(move.roundSeconds)
      : room.roundSeconds;
    const roundSeconds = mode === "rapido" ? 45 : requestedSeconds;
    const title = String(move.title || room.title).trim().slice(0, 40) || "Sala de desenho";
    room = await prisma.rabiscaRoom.update({
      where: { id: room.id },
      data: { mode, theme, totalRounds, roundSeconds, title },
      include: ROOM_INCLUDE,
    });
    return { room };
  }

  if (type === "start") {
    if (room.hostId !== userId || room.status !== "waiting") throw bad("Só o anfitrião pode iniciar.", 403);
    const online = activePlayers(room);
    if (online.length < 2) throw bad("Aguarde pelo menos mais uma pessoa entrar.", 409);
    const drawerId = online[0].userId;
    room = await prisma.rabiscaRoom.update({
      where: { id: room.id },
      data: {
        status: "active",
        round: 1,
        drawerId,
        word: nextWord(room.theme, room.id, 1),
        result: "{}",
        roundStartedAt: new Date(),
        pausedAt: null,
      },
      include: ROOM_INCLUDE,
    });
    return { room };
  }

  if (type === "next") {
    if (room.hostId !== userId || room.status !== "roundEnd") throw bad("Só o anfitrião inicia a próxima rodada.", 403);
    if (room.round >= room.totalRounds) {
      room = await prisma.rabiscaRoom.update({
        where: { id: room.id },
        data: { status: "finished", finishedAt: new Date() },
        include: ROOM_INCLUDE,
      });
      return { room };
    }
    const drawerId = nextDrawer(room);
    if (!drawerId) throw bad("Nenhum jogador online.", 409);
    const round = room.round + 1;
    room = await prisma.rabiscaRoom.update({
      where: { id: room.id },
      data: {
        status: activePlayers(room).length >= 2 ? "active" : "paused",
        round,
        drawerId,
        word: nextWord(room.theme, room.id, round),
        result: "{}",
        roundStartedAt: new Date(),
        pausedAt: activePlayers(room).length >= 2 ? null : new Date(),
      },
      include: ROOM_INCLUDE,
    });
    return { room };
  }

  if (type === "finish") {
    if (room.hostId !== userId) throw bad("Só o anfitrião encerra a partida.", 403);
    room = await prisma.rabiscaRoom.update({
      where: { id: room.id },
      data: { status: "finished", finishedAt: new Date() },
      include: ROOM_INCLUDE,
    });
    return { room };
  }

  if (room.status !== "active") throw bad("A rodada está pausada ou encerrada.", 409);

  if (type === "stroke") {
    if (room.drawerId !== userId) throw bad("Somente quem desenha pode traçar.", 403);
    const rawPoints = Array.isArray(move.points) ? move.points : [];
    const points = rawPoints.slice(0, 300).map((point) => {
      const value = Array.isArray(point) ? point : [];
      return [
        Math.min(1, Math.max(0, Number(value[0]) || 0)),
        Math.min(1, Math.max(0, Number(value[1]) || 0)),
      ];
    });
    if (points.length < 2) throw bad("Traço vazio.", 400);
    const palette = ["#17140F", "#C0395C", "#B8862F", "#287F79", "#294A70", "#76566E", "#F6F1E8"];
    const color = palette.includes(String(move.color)) ? String(move.color) : palette[0];
    const width = Math.min(18, Math.max(2, Number(move.width) || 5));
    const count = await prisma.rabiscaStroke.count({ where: { roomId, round: room.round } });
    if (count >= 650) throw bad("O quadro atingiu o limite de traços. Limpe ou avance a rodada.", 409);
    await prisma.rabiscaStroke.create({
      data: { roomId, authorId: userId, round: room.round, points: JSON.stringify(points), color, width },
    });
    return { room: await findRoomBase(roomId) };
  }

  if (type === "undo" || type === "clear") {
    if (room.drawerId !== userId) throw bad("Somente quem desenha altera o quadro.", 403);
    if (room.mode === "sem_borracha") throw bad("Neste modo o traço é definitivo.", 409);
    if (type === "clear") {
      await prisma.rabiscaStroke.deleteMany({ where: { roomId, round: room.round } });
    } else {
      const last = await prisma.rabiscaStroke.findFirst({
        where: { roomId, round: room.round, authorId: userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (last) await prisma.rabiscaStroke.delete({ where: { id: last.id } });
    }
    return { room: await findRoomBase(roomId) };
  }

  if (type === "guess") {
    if (room.drawerId === userId) throw bad("Quem desenha não envia palpites.", 403);
    const text = String(move.text || "").trim().slice(0, 60);
    if (!text) throw bad("Escreva um palpite.", 400);
    const last = await prisma.rabiscaGuess.findFirst({
      where: { roomId, authorId: userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < 650) throw bad("Espere um instante antes do próximo palpite.", 429);
    const similarity = wordSimilarity(text, room.word || "");
    const correct = similarity === 100;
    await prisma.rabiscaGuess.create({
      data: { roomId, authorId: userId, round: room.round, text, similarity, correct },
    });

    if (!correct) return { room: await findRoomBase(roomId), hint: similarity >= 70 ? "near" : undefined, similarity };

    const winner = room.players.find((player) => player.userId === userId);
    const drawer = room.players.find((player) => player.userId === room.drawerId);
    if (!winner || !drawer || !room.word) throw bad("Jogadores da rodada não encontrados.", 409);
    const guessPoints = 25 + Math.min(10, Math.floor(secondsLeft(room) / 8));
    const drawerPoints = 15;
    const result: RabiscaResult = {
      winnerId: userId,
      winnerName: displayName(winner.user),
      word: room.word,
      reason: "correct",
      at: new Date().toISOString(),
    };
    await prisma.$transaction([
      prisma.rabiscaPlayer.update({ where: { id: winner.id }, data: { score: { increment: guessPoints } } }),
      prisma.rabiscaPlayer.update({ where: { id: drawer.id }, data: { score: { increment: drawerPoints } } }),
      prisma.rabiscaRoom.update({ where: { id: room.id }, data: { status: "roundEnd", result: JSON.stringify(result) } }),
    ]);

    const scoreDay = diaBR();
    await Promise.all([
      prisma.gameScore.create({ data: { userId, coupleId: winner.user.coupleId, game: "rabisca", points: guessPoints, dia: scoreDay } }),
      prisma.gameScore.create({ data: { userId: drawer.userId, coupleId: drawer.user.coupleId, game: "rabisca", points: drawerPoints, dia: scoreDay } }),
      awardPoints(userId, guessPoints),
      awardPoints(drawer.userId, drawerPoints),
    ]);
    return { room: await findRoomBase(roomId), similarity };
  }

  throw bad("Ação desconhecida.", 400);
}

export async function currentRabiscaRoom(userId: string) {
  const player = await prisma.rabiscaPlayer.findFirst({
    where: { userId, leftAt: null, room: { status: { not: "finished" } } },
    orderBy: { joinedAt: "desc" },
    select: { roomId: true },
  });
  if (!player) return null;
  return refreshRabiscaRoom(player.roomId, userId);
}
