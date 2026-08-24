"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, RotateCw, Trophy, Lightbulb, SkipForward, Crown, Medal,
  Lock, Unlock, AlertTriangle, Check, X, Loader2, UserCheck, Play, Timer,
} from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { IconCerto } from "./Icones";

const TAMANHO = 5;
const MAX_TENTATIVAS = 6;
const POLL_MS = 2000;
const TIMER_SECONDS = 60;

type WordEntry = { word: string; category: string; emoji: string };

const PALAVRAS_COM_DICA: WordEntry[] = [
  { word: "amora", category: "fruta", emoji: "🫐" }, { word: "beijo", category: "carinho", emoji: "💋" },
  { word: "calma", category: "sentimento", emoji: "😌" }, { word: "sonho", category: "abstrato", emoji: "💭" },
  { word: "festa", category: "evento", emoji: "🎉" }, { word: "noite", category: "tempo", emoji: "🌙" },
  { word: "vinho", category: "bebida", emoji: "🍷" }, { word: "praia", category: "lugar", emoji: "🏖️" },
  { word: "carta", category: "objeto", emoji: "💌" }, { word: "filme", category: "entretenimento", emoji: "🎬" },
  { word: "livro", category: "objeto", emoji: "📖" }, { word: "flora", category: "natureza", emoji: "🌺" },
  { word: "mundo", category: "lugar", emoji: "🌍" }, { word: "dança", category: "ação", emoji: "💃" },
  { word: "areia", category: "natureza", emoji: "🏝️" }, { word: "barco", category: "transporte", emoji: "⛵" },
  { word: "claro", category: "adjetivo", emoji: "💡" }, { word: "forte", category: "adjetivo", emoji: "💪" },
  { word: "bicho", category: "animal", emoji: "🐾" }, { word: "tigre", category: "animal", emoji: "🐯" },
  { word: "zebra", category: "animal", emoji: "🦓" }, { word: "águia", category: "animal", emoji: "🦅" },
  { word: "peixe", category: "animal", emoji: "🐟" }, { word: "cobra", category: "animal", emoji: "🐍" },
  { word: "arroz", category: "comida", emoji: "🍚" }, { word: "carne", category: "comida", emoji: "🥩" },
  { word: "fruta", category: "comida", emoji: "🍎" }, { word: "leite", category: "comida", emoji: "🥛" },
  { word: "massa", category: "comida", emoji: "🍝" }, { word: "prato", category: "comida", emoji: "🍽️" },
  { word: "pizza", category: "comida", emoji: "🍕" }, { word: "torta", category: "comida", emoji: "🥧" },
  { word: "caixa", category: "objeto", emoji: "📦" }, { word: "chave", category: "objeto", emoji: "🔑" },
  { word: "garfo", category: "objeto", emoji: "🍴" }, { word: "moeda", category: "objeto", emoji: "🪙" },
  { word: "papel", category: "objeto", emoji: "📄" }, { word: "vidro", category: "objeto", emoji: "🪞" },
  { word: "roupa", category: "objeto", emoji: "👗" }, { word: "hotel", category: "lugar", emoji: "🏨" },
  { word: "praça", category: "lugar", emoji: "⛲" }, { word: "campo", category: "lugar", emoji: "🌾" },
  { word: "selva", category: "lugar", emoji: "🌴" }, { word: "reino", category: "lugar", emoji: "🏰" },
  { word: "chuva", category: "natureza", emoji: "🌧️" }, { word: "vento", category: "natureza", emoji: "💨" },
  { word: "pedra", category: "natureza", emoji: "🪨" }, { word: "nuvem", category: "natureza", emoji: "☁️" },
  { word: "terra", category: "natureza", emoji: "🌎" }, { word: "ondas", category: "natureza", emoji: "🌊" },
  { word: "verde", category: "cor", emoji: "🟢" }, { word: "preto", category: "cor", emoji: "⚫" },
  { word: "prata", category: "cor", emoji: "🥈" }, { word: "braço", category: "corpo", emoji: "💪" },
  { word: "dente", category: "corpo", emoji: "🦷" }, { word: "peito", category: "corpo", emoji: "💓" },
  { word: "perna", category: "corpo", emoji: "🦵" }, { word: "rosto", category: "corpo", emoji: "😊" },
  { word: "sorte", category: "abstrato", emoji: "🍀" }, { word: "ideia", category: "abstrato", emoji: "💡" },
  { word: "união", category: "abstrato", emoji: "🤝" }, { word: "pazes", category: "abstrato", emoji: "🕊️" },
  { word: "sinal", category: "abstrato", emoji: "🚦" }, { word: "jogar", category: "ação", emoji: "🎮" },
  { word: "corre", category: "ação", emoji: "🏃" }, { word: "canta", category: "ação", emoji: "🎤" },
  { word: "ganha", category: "ação", emoji: "🏆" }, { word: "viaja", category: "ação", emoji: "✈️" },
  { word: "busca", category: "ação", emoji: "🔍" }, { word: "troca", category: "ação", emoji: "🔄" },
  { word: "fácil", category: "adjetivo", emoji: "👍" }, { word: "ótimo", category: "adjetivo", emoji: "🌟" },
  { word: "único", category: "adjetivo", emoji: "💎" }, { word: "tênis", category: "esporte", emoji: "🎾" },
  { word: "pátio", category: "lugar", emoji: "🏠" }, { word: "herói", category: "pessoa", emoji: "🦸" },
  { word: "líder", category: "pessoa", emoji: "👑" }, { word: "abril", category: "tempo", emoji: "📅" },
  { word: "janta", category: "comida", emoji: "🍽️" }, { word: "porta", category: "objeto", emoji: "🚪" },
  { word: "feira", category: "lugar", emoji: "🏪" }, { word: "trigo", category: "comida", emoji: "🌾" },
  { word: "tarde", category: "tempo", emoji: "🌅" }, { word: "velho", category: "adjetivo", emoji: "👴" },
  { word: "folha", category: "natureza", emoji: "🍃" }, { word: "renda", category: "abstrato", emoji: "💰" },
  { word: "lagoa", category: "lugar", emoji: "🏞️" }, { word: "longe", category: "adjetivo", emoji: "🔭" },
  { word: "metal", category: "objeto", emoji: "🔩" },
];

const PALAVRAS = PALAVRAS_COM_DICA.map((p) => p.word);

type PlayerInfo = { id: string; name: string; avatarColor: string };
type Props = { me: PlayerInfo; partner: PlayerInfo | null };

type ServerGame = {
  id: string; word: string; category: string; emoji: string;
  locked: boolean; lockedBy: string | null; currentTurn: string;
  skipReqBy: string | null; remainingSeconds: number;
  guesses: { userId: string; userName: string; guess: string; states: string[] }[];
};

type PlayerStats = { wins: number; losses: number; streak: number; maxStreak: number };

const STORAGE_KEY = "wordle-scores-v2";

function loadAllScores(): Record<string, PlayerStats> {
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function saveAllScores(scores: Record<string, PlayerStats>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); } catch {}
}
function defaultStats(): PlayerStats { return { wins: 0, losses: 0, streak: 0, maxStreak: 0 }; }

type LetraEstado = "certa" | "presente" | "ausente" | "vazia";
type TeclaEstado = "certa" | "presente" | "ausente" | "desconhecida";

const cor: Record<LetraEstado, string> = {
  certa: "bg-emerald-500 border-emerald-500", presente: "bg-amber-500 border-amber-500",
  ausente: "bg-slate-600 border-slate-600", vazia: "border-border bg-transparent",
};
const corTecla: Record<TeclaEstado, string> = {
  certa: "bg-emerald-500 border-emerald-500 text-white", presente: "bg-amber-500 border-amber-500 text-white",
  ausente: "bg-slate-700 border-slate-600 text-faint", desconhecida: "border-border bg-surface2 text-text",
};

function calcularEstados(chute: string, secreta: string): LetraEstado[] {
  const result: LetraEstado[] = Array(TAMANHO).fill("ausente");
  const restantes = secreta.split("");
  for (let i = 0; i < TAMANHO; i++) { if (chute[i] === secreta[i]) { result[i] = "certa"; restantes[i] = ""; } }
  for (let i = 0; i < TAMANHO; i++) { if (result[i] === "certa") continue; const idx = restantes.indexOf(chute[i]); if (idx !== -1) { result[i] = "presente"; restantes[idx] = ""; } }
  return result;
}

export function Wordle({ me, partner }: Props) {
  const pollRef = useRef<any>(null);
  const timedOutRef = useRef(false);

  const [chuteAtual, setChuteAtual] = useState("");
  const [shake, setShake] = useState(false);
  const [revelando, setRevelando] = useState<number | null>(null);
  const [flipPronto, setFlipPronto] = useState<Set<number>>(new Set());
  const [scores, setScores] = useState<Record<string, PlayerStats>>({});
  const [syncing, setSyncing] = useState(false);
  const [serverGame, setServerGame] = useState<ServerGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);

  const isCoupled = !!partner;
  const myKey = "me";
  const partnerKey = "partner";

  // scores
  useEffect(() => { setScores(loadAllScores()); }, []);
  useEffect(() => { if (Object.keys(scores).length > 0) saveAllScores(scores); }, [scores]);

  // polling
  useEffect(() => {
    if (!isCoupled) { setLoading(false); return; }
    let alive = true;
    const poll = () => {
      api<{ game: ServerGame | null }>("/api/wordle-game")
        .then((r) => {
          if (!alive) return;
          setServerGame(r.game);
          setLoading(false);
          if (r.game) setRemaining(r.game.remainingSeconds);
        })
        .catch(() => { if (alive) setLoading(false); });
    };
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => { alive = false; clearInterval(pollRef.current); };
  }, [isCoupled]);

  // countdown local — decrementa o valor recebido do servidor
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // auto-timeout
  useEffect(() => {
    if (!serverGame || !isCoupled) return;
    if (remaining <= 0 && serverGame.currentTurn === me.id && !myWon && !myLost && !timedOutRef.current && serverGame.remainingSeconds === 0) {
      timedOutRef.current = true;
      apiAction({ action: "timeout" }).then(() => { timedOutRef.current = false; });
    }
    if (remaining > 0) timedOutRef.current = false;
  }, [remaining]);

  // derivados
  const palavraSecreta = serverGame?.word ?? "";
  const allGuesses = serverGame?.guesses ?? [];
  const myGuesses = allGuesses.filter((g) => g.userId === me.id);
  const partnerGuesses = allGuesses.filter((g) => g.userId !== me.id);
  const myWon = myGuesses.some((g) => g.guess === palavraSecreta);
  const myLost = (!myWon && myGuesses.length >= MAX_TENTATIVAS);
  const partnerWon = partnerGuesses.some((g) => g.guess === palavraSecreta);
  const partnerLost = !partnerWon && partnerGuesses.length >= MAX_TENTATIVAS;

  const isLocked = serverGame?.locked ?? false;
  const lockedByMe = serverGame?.lockedBy === me.id;
  const lockedByPartner = isLocked && !lockedByMe;
  const skipRequested = !!serverGame?.skipReqBy;
  const skipReqIsMine = serverGame?.skipReqBy === me.id;
  const skipReqIsPartner = skipRequested && !skipReqIsMine;

  const isMyTurn = serverGame?.currentTurn === me.id;
  const gameEnded = (myWon || myLost) && (partnerWon || partnerLost || !partner);
  const bothDone = isCoupled ? ((myWon || myLost) && (partnerWon || partnerLost)) : (myWon || myLost);

  const meStats = scores[myKey] ?? defaultStats();
  const partnerStats = scores[partnerKey] ?? defaultStats();

  const canType = isCoupled && isMyTurn && !(isLocked && !lockedByMe) && !myWon && !myLost && remaining > 0;

  // API
  async function apiAction(body: any) {
    setSyncing(true);
    try {
      const r = await api<{ game?: ServerGame; error?: string }>("/api/wordle-game", { method: "POST", body: JSON.stringify(body) });
      if (r.error) { toast(r.error, "error"); return; }
      if (r.game) { setServerGame(r.game); setRemaining(r.game.remainingSeconds); }
    } catch (err: any) { toast(err.message || "Erro", "error"); }
    finally { setSyncing(false); }
  }

  async function novoJogoRemoto() {
    const e = PALAVRAS_COM_DICA[Math.floor(Math.random() * PALAVRAS_COM_DICA.length)];
    setChuteAtual(""); setFlipPronto(new Set()); setRevelando(null);
    await apiAction({ action: "start", word: e.word, category: e.category, emoji: e.emoji });
  }

  async function enviarPalpite(guess: string) { await apiAction({ action: "guess", guess }); }
  async function pularVez() { await apiAction({ action: "timeout" }); }
  async function travar() { await apiAction({ action: "lock" }); }
  async function destravar() { await apiAction({ action: "unlock" }); }
  async function pedirPular() { await apiAction({ action: "skip-req" }); }
  async function aceitarPular() { await apiAction({ action: "skip-accept" }); }
  async function recusarPular() { await apiAction({ action: "skip-reject" }); }

  function submeterChute(texto: string) {
    if (!canType || revelando !== null) return;
    if (!PALAVRAS.includes(texto.toLowerCase())) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setFlipPronto(new Set());
    setRevelando(myGuesses.length);
    enviarPalpite(texto).then(() => {
      setRevelando(null); setFlipPronto(new Set()); setChuteAtual("");
      if (texto === palavraSecreta) addWin();
    });
  }

  function addWin() {
    setScores((prev) => { const n = { ...prev }; const c = { ...(n[myKey] ?? defaultStats()) }; c.wins++; c.streak++; if (c.streak > c.maxStreak) c.maxStreak = c.streak; n[myKey] = c; return n; });
  }

  // input
  function teclaVirtual(letra: string) {
    if (!canType || revelando !== null) return;
    if (letra === "↵") { if (chuteAtual.length === TAMANHO) submeterChute(chuteAtual); }
    else if (letra === "⌫") setChuteAtual((c) => c.slice(0, -1));
    else if (chuteAtual.length < TAMANHO) setChuteAtual((c) => c + letra);
  }

  const teclaEstados = useMemo(() => {
    const map = new Map<string, TeclaEstado>();
    for (const g of myGuesses) {
      const estados = calcularEstados(g.guess, palavraSecreta);
      for (let i = 0; i < TAMANHO; i++) {
        const l = g.guess[i]; const atual = map.get(l);
        const novo = estados[i] as TeclaEstado;
        const ordem: TeclaEstado[] = ["desconhecida", "ausente", "presente", "certa"];
        if (!atual || ordem.indexOf(novo) > ordem.indexOf(atual)) map.set(l, novo);
      }
    }
    return map;
  }, [myGuesses, palavraSecreta]);

  const teclado = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["↵","Z","X","C","V","B","N","M","⌫"],
    ["Á","É","Í","Ó","Ú","Ã","Õ","Â","Ê","Ô","Ç"],
  ];

  const renderedGuesses = useMemo(() => {
    const rows: { guess: string; states: LetraEstado[] | null }[] = myGuesses.map((g) => ({ guess: g.guess, states: calcularEstados(g.guess, palavraSecreta) }));
    if (!myWon && !myLost && canType && chuteAtual) rows.push({ guess: chuteAtual.padEnd(TAMANHO, " "), states: null });
    while (rows.length < MAX_TENTATIVAS) rows.push({ guess: "", states: null });
    return rows;
  }, [myGuesses, chuteAtual, myWon, myLost, canType, palavraSecreta]);

  const showReveal = revelando !== null && revelando < renderedGuesses.length;
  const revealRowIdx = revelando ?? -1;

  const ranking = useMemo(() => {
    const list = [{ key: myKey, name: me.name, stats: meStats, isMe: true }];
    if (partner) list.push({ key: partnerKey, name: partner.name, stats: partnerStats, isMe: false });
    list.sort((a, b) => b.stats.wins - a.stats.wins);
    return list;
  }, [me.name, partner, meStats, partnerStats]);

  if (isCoupled && loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted" /></div>;
  }

  const timerDisplay = isCoupled && serverGame && remaining > 0;
  const timerUrgent = remaining <= 10;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

      <div className="flex-1 max-w-sm mx-auto lg:mx-0 space-y-3">
        <div className="text-center">
          <h1 className="font-display text-3xl text-text">Adivinhe a palavra</h1>
          <p className="mt-1 text-sm text-muted">Palavra de {TAMANHO} letras. {MAX_TENTATIVAS} tentativas.</p>
          {serverGame && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent">
              <Lightbulb size={12} /> Dica: <span className="capitalize">{serverGame.category}</span> <span>{serverGame.emoji}</span>
            </div>
          )}
        </div>

        {/* Timer */}
        {timerDisplay && (
          <div className={cn("flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center",
            timerUrgent ? "bg-rose-500/15 text-rose-400" : "bg-surface text-text")}>
            <Timer size={20} className={timerUrgent ? "animate-pulse" : ""} />
            <span className={cn("font-mono text-2xl font-bold tabular-nums", timerUrgent && "animate-pulse")}>
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted">
              — vez de <b style={{ color: isMyTurn ? me.avatarColor : partner!.avatarColor }}>{isMyTurn ? me.name : partner!.name}</b>
            </span>
          </div>
        )}

        {/* Sem jogo */}
        {isCoupled && !serverGame && (
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <Play size={36} className="mb-3 text-muted" />
            <p className="font-display text-xl text-text">Nenhum jogo ativo</p>
            <button onClick={novoJogoRemoto} disabled={syncing} className="mt-5 inline-flex items-center gap-2 rounded-full accent-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50">
              {syncing ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} />} Novo jogo
            </button>
          </div>
        )}

        {/* Status multiplayer */}
        {isCoupled && serverGame && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {!isMyTurn && !myWon && !myLost && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
                  <AlertTriangle size={12} /> Aguarde — é a vez de <b>{partner!.name}</b>
                </div>
              )}
              {lockedByPartner && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">
                  <Lock size={12} /> <b>{partner!.name}</b> bloqueou o jogo
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {isMyTurn && !myWon && !myLost && (
                <>
                  <button onClick={pularVez} disabled={syncing}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-medium text-muted transition hover:text-text disabled:opacity-40">
                    <SkipForward size={12} /> Pular vez
                  </button>
                  <button onClick={isLocked ? (lockedByMe ? destravar : undefined) : travar}
                    disabled={syncing || (isLocked && !lockedByMe)}
                    className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-40",
                      isLocked ? lockedByMe ? "border-amber-500/50 bg-amber-500/10 text-amber-400 cursor-pointer" : "border-rose-500/50 bg-rose-500/10 text-rose-400 cursor-default"
                      : "border-border bg-surface2 text-muted hover:text-text")}>
                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    {isLocked ? "Bloqueado" : "Bloquear"}
                  </button>
                </>
              )}
            </div>

            {skipReqIsPartner && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-xs">
                <span className="text-accent"><b>{partner!.name}</b> quer trocar de palavra</span>
                <button onClick={aceitarPular} disabled={syncing} className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"><Check size={13} /> Aceitar</button>
                <button onClick={recusarPular} disabled={syncing} className="rounded-full bg-rose-500/20 px-2.5 py-1 font-semibold text-rose-400 hover:bg-rose-500/30 disabled:opacity-50"><X size={13} /> Recusar</button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {isMyTurn && !isLocked && !myWon && !myLost && (
                <button onClick={pedirPular} disabled={syncing || skipRequested} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-medium text-muted transition hover:text-text disabled:opacity-40">
                  <SkipForward size={12} /> {skipReqIsMine ? "Aguardando..." : "Pedir para trocar"}
                </button>
              )}
              <button onClick={novoJogoRemoto} disabled={syncing} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-medium text-muted transition hover:text-text disabled:opacity-40">
                <RotateCw size={12} /> Novo jogo
              </button>
            </div>
          </div>
        )}

        {/* Resultados */}
        {bothDone && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring.snappy} className="rounded-2xl border-2 p-5 text-center space-y-3"
              style={{ borderColor: partnerWon || myWon ? "#10b981" : "#f59e0b" }}>
              <Trophy size={40} className="mx-auto text-amber-400" />
              <div className="space-y-1">
                <p className="font-display text-xl text-text">Resultado</p>
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span style={{ color: me.avatarColor }}><b>{me.name}</b></span>
                  <span className="text-faint">vs</span>
                  <span style={{ color: partner!.avatarColor }}><b>{partner!.name}</b></span>
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <span className={cn("inline-flex items-center gap-1", myWon ? "font-bold text-success" : "text-faint")}>
                    {myWon && <IconCerto size={12} />}
                    {myWon ? "Acertou" : myLost ? "Perdeu / tempo" : "Jogando…"}
                  </span>
                  <span className="text-faint">|</span>
                  <span className={cn("inline-flex items-center gap-1", partnerWon ? "font-bold text-success" : "text-faint")}>
                    {partnerWon && <IconCerto size={12} />}
                    {partnerWon ? "Acertou" : partnerLost ? "Perdeu / tempo" : "Jogando…"}
                  </span>
                </div>
              </div>
              <button onClick={novoJogoRemoto} disabled={syncing} className="inline-flex items-center gap-2 rounded-full accent-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50">
                <RotateCw size={17} /> Novo jogo
              </button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Resultado individual */}
        {myWon && !bothDone && (
          <div className="rounded-2xl bg-emerald-500/10 p-4 text-center">
            <motion.div animate={{ rotate: [0, -10, 10, -8, 0], scale: [1, 1.3, 1.1, 1.2, 1] }} transition={{ duration: 1, delay: 0.3 }}>
              <Trophy size={28} className="mx-auto text-emerald-400" />
            </motion.div>
            <p className="mt-1.5 font-display text-lg text-emerald-400">Você acertou em {myGuesses.length} tentativa{myGuesses.length > 1 ? "s" : ""}!</p>
            <p className="mt-1 text-xs text-muted">Aguardando {partner!.name}...</p>
          </div>
        )}
        {myLost && !myWon && serverGame?.currentTurn !== me.id && !bothDone && (
          <div className="rounded-2xl bg-amber-500/10 p-4 text-center">
            <HelpCircle size={28} className="mx-auto text-amber-400" />
            <p className="mt-1.5 font-display text-lg text-amber-400">Você não conseguiu</p>
            <p className="mt-1 text-xs text-muted">Aguardando {partner!.name}...</p>
          </div>
        )}

        {/* Grid */}
        <div className={cn("flex flex-col items-center gap-1.5 select-none", shake && "animate-shake")}>
          {renderedGuesses.map((row, linha) => {
            const isRevealRow = showReveal && linha === revealRowIdx;
            return (
              <div key={linha} className="flex gap-1.5">
                {Array.from({ length: TAMANHO }).map((_, col) => {
                  const letra = (row.guess[col] ?? "").trim();
                  const flipOk = flipPronto.has(col);
                  if (isRevealRow && !flipOk) return (
                    <div key={col} className="tile-flip flex h-10 w-10 items-center justify-center rounded-lg border-2 text-base font-bold uppercase"
                      style={{ animationDelay: `${col * 0.12}s`, borderColor: "var(--border)", background: "var(--surface2)", color: "var(--text)" }}
                      onAnimationEnd={() => setFlipPronto((prev) => new Set(prev).add(col))}>{letra}</div>
                  );
                  if (isRevealRow && flipOk) return (
                    <div key={col} className={cn("flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg font-bold uppercase text-white", row.states ? cor[row.states[col]] : "")}>{letra}</div>
                  );
                  if (row.states) return (
                    <div key={col} className={cn("flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg font-bold uppercase text-white", cor[row.states[col]])}>{letra}</div>
                  );
                  return (
                    <div key={col} className={cn("flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg font-bold uppercase",
                      letra && canType ? "border-accent/50 text-text tile-pop" : "border-border bg-transparent")}>{letra}</div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Palpites do parceiro */}
        {isCoupled && serverGame && (() => {
          // Se eu já terminei mas o parceiro ainda não, mostro os palpites dele sem cores
          const hideColors = (myWon || myLost) && !partnerWon && !partnerLost;
          return (
          <div className="scrap-frame scrap-frame-quiet rounded-2xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2">
              <UserCheck size={14} className="text-muted" />
              <span className="text-xs font-semibold" style={{ color: partner!.avatarColor }}>{partner!.name}</span>
              <span className="text-[10px] text-faint">({partnerGuesses.length}/{MAX_TENTATIVAS})</span>
              {partnerWon && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                  <IconCerto size={11} /> Acertou!
                </span>
              )}
              {partnerLost && <span className="text-[10px] font-semibold text-warning">Não conseguiu</span>}
              {hideColors && <span className="text-[10px] text-faint">(cores ocultas até ele terminar)</span>}
            </div>
            {partnerGuesses.length === 0 ? (
              <p className="text-[11px] text-faint">Nenhum palpite ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {partnerGuesses.map((g, i) => (
                  <div key={i} className="flex gap-0.5">
                    {g.guess.split("").map((l, j) => (
                      <span key={j} className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold uppercase",
                        hideColors ? "bg-surface2 border border-border text-text" : cn("text-white", cor[g.states[j] as LetraEstado])
                      )}>{l}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}

        {/* Teclado */}
        <div className="flex flex-col items-center gap-1.5 select-none">
          {teclado.map((linha, i) => (
            <div key={i} className="flex gap-1">
              {linha.map((t) => {
                const especiais = t === "↵" || t === "⌫";
                const estado = especiais ? null : teclaEstados.get(t);
                return (
                  <motion.button key={t} onClick={() => teclaVirtual(t)} whileTap={canType ? { scale: 0.88 } : {}} disabled={!canType && !especiais}
                    className={cn("flex items-center justify-center rounded-lg border text-sm font-semibold transition disabled:opacity-30",
                      especiais ? "w-10 h-9 text-[10px] border-border bg-surface2 text-text" : "h-9 w-6 text-xs",
                      estado ? corTecla[estado] : especiais ? "" : corTecla.desconhecida)}>{t}</motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div className="lg:w-56 lg:shrink-0">
        <div className="scrap-frame scrap-frame-tape rounded-2xl border border-border bg-surface p-4 lg:sticky lg:top-20">
          <div className="mb-3 flex items-center gap-2"><Crown size={16} className="text-accent" /><h3 className="text-sm font-semibold text-text">Ranking</h3></div>
          {ranking.map((r, i) => (
            <div key={r.key} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 mb-2 transition", r.isMe ? "bg-accent/8 border border-accent/20" : "bg-surface2/60")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-400 text-white" : "bg-surface2 text-faint")}>
                {i === 0 ? <Medal size={12} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold" style={{ color: r.isMe ? me.avatarColor : partner?.avatarColor }}>{r.name} {r.isMe ? "(você)" : ""}</div>
                <div className="flex gap-2 text-[10px] text-faint"><span className="text-emerald-400">{r.stats.wins} vit.</span><span>{r.stats.losses} der.</span></div>
              </div>
            </div>
          ))}
          {ranking.length > 1 && (<div className={cn("mt-3 rounded-xl p-2.5 text-center text-xs", ranking[0].isMe ? "bg-emerald-500/10 text-emerald-400" : "bg-accent/10 text-accent")}>
            <Crown size={18} className="mx-auto mb-1" /><b>{ranking[0].name}</b> lidera com {ranking[0].stats.wins} vitórias!</div>)}
        </div>
      </div>
    </div>
  );
}
