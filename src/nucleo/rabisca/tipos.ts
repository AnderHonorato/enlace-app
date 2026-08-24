export type RabiscaStatus = "waiting" | "active" | "paused" | "roundEnd" | "finished";
export type RabiscaMode = "classico" | "rapido" | "sem_borracha";
export type RabiscaTheme = "cotidiano" | "viagem" | "comida" | "brasil";

export type RabiscaStrokeDTO = {
  id: string;
  points: [number, number][];
  color: string;
  width: number;
};

export type RabiscaGuessDTO = {
  id: string;
  userId: string;
  name: string;
  text: string;
  similarity: number;
  correct: boolean;
  createdAt: string;
};

export type RabiscaPlayerDTO = {
  id: string;
  userId: string;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  score: number;
  online: boolean;
  isMe: boolean;
  isHost: boolean;
  isDrawer: boolean;
};

export type RabiscaResult = {
  winnerId: string | null;
  winnerName: string | null;
  word: string;
  reason: "correct" | "time";
  at: string;
};

export type RabiscaRoomDTO = {
  id: string;
  code: string;
  title: string;
  theme: RabiscaTheme;
  mode: RabiscaMode;
  status: RabiscaStatus;
  hostId: string;
  meId: string;
  isHost: boolean;
  round: number;
  totalRounds: number;
  roundSeconds: number;
  secondsLeft: number;
  drawerId: string | null;
  isDrawer: boolean;
  word: string | null;
  wordMask: string;
  result: RabiscaResult | null;
  players: RabiscaPlayerDTO[];
  strokes: RabiscaStrokeDTO[];
  guesses: RabiscaGuessDTO[];
  createdAt: string;
};

export type RabiscaActionResponse = {
  room: RabiscaRoomDTO;
  hint?: "near";
  similarity?: number;
};
