"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Trash2, Play, RotateCw, Sparkles, ListTodo, Loader2 } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";

const CORES = [
  "#E5679B", "#FF922B", "#4ABEB0", "#9575E8", "#F4726A",
  "#5C7CFA", "#22B8CF", "#FCC419", "#40C057", "#BE4BDB",
];

// Ideias pré-definidas para preencher a roleta automaticamente
const IDEIAS_PADRAO = [
  "Jantar romântico",
  "Sessão de cinema",
  "Massagem relaxante",
  "Cozinhar juntos",
  "Piquenique no parque",
  "Noite de jogos",
  "Dançar em casa",
  "Fazer um bolo",
  "Maratonar série",
  "Café da manhã especial",
  "Escrever cartas de amor",
  "Fotos profissionais",
  "Karaokê a dois",
  "Acampar na sala",
  "Noite do vinho",
  "Passeio de bicicleta",
  "Fazer drinks juntos",
  "Dia de spa em casa",
  "Pintar um quadro",
  "Planejar uma viagem",
];

const SUGESTOES = IDEIAS_PADRAO.slice(0, 6);

const CHAVE_STORAGE = "enlace-roleta";
const TAMANHO_MAX_CSS = 300; // tamanho máximo do canvas em pixels CSS

type RoletaItem = { id: string; texto: string; cor: string };

function gerarId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Roleta({ coupled }: { coupled: boolean }) {
  const [itens, setItens] = useState<RoletaItem[]>([]);
  const [novoItem, setNovoItem] = useState("");
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [indiceVencedor, setIndiceVencedor] = useState<number | null>(null);
  const [angulo, setAngulo] = useState(0);
  const [criandoTarefa, setCriandoTarefa] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduzMovimento = useReducedMotion();

  // Carrega ou preenche automaticamente
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const salvo = window.localStorage.getItem(CHAVE_STORAGE);
      if (salvo) {
        const dados = JSON.parse(salvo);
        if (
          Array.isArray(dados) &&
          dados.every((d) => d && typeof d.texto === "string")
        ) {
          if (dados.length >= 2) {
            setItens(dados);
            return;
          }
        }
      }
      // Sem dados salvos ou poucos itens: preenche automaticamente
      const padrao: RoletaItem[] = IDEIAS_PADRAO.map((texto, i) => ({
        id: gerarId(),
        texto,
        cor: CORES[i % CORES.length],
      }));
      setItens(padrao);
    } catch {
      const padrao: RoletaItem[] = IDEIAS_PADRAO.map((texto, i) => ({
        id: gerarId(),
        texto,
        cor: CORES[i % CORES.length],
      }));
      setItens(padrao);
    }
  }, []);

  // Persiste os itens sempre que a lista mudar
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itens));
    } catch {
      // armazenamento indisponível (modo privado, cota excedida, etc.)
    }
  }, [itens]);

  function adicionarTexto(texto: string) {
    const t = texto.trim();
    if (!t || itens.length >= 20) return;
    setItens((prev) => [
      ...prev,
      { id: gerarId(), texto: t, cor: CORES[prev.length % CORES.length] },
    ]);
    setResultado(null);
    setIndiceVencedor(null);
  }

  function adicionar() {
    adicionarTexto(novoItem);
    setNovoItem("");
  }

  function remover(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
    setResultado(null);
    setIndiceVencedor(null);
  }

  // Única função de desenho, usada tanto no efeito de re-render quanto na animação do giro.
  // Lê o tamanho real (CSS) do canvas para ser responsiva e escala o backing store pelo
  // devicePixelRatio para ficar nítida em telas HiDPI/retina.
  const desenharRoleta = useCallback(
    (anguloAtual: number, indiceDestaque: number | null = null) => {
      const canvas = canvasRef.current;
      if (!canvas || itens.length < 2) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const size = Math.round(rect.width) || TAMANHO_MAX_CSS;
      const backing = Math.round(size * dpr);
      if (canvas.width !== backing || canvas.height !== backing) {
        canvas.width = backing;
        canvas.height = backing;
      }
      // Reaplica a escala a cada desenho (setTransform, não scale, evita acúmulo)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = size / 2;
      const cy = size / 2;
      const raio = size / 2 - 10;
      const fatia = (2 * Math.PI) / itens.length;

      // Escala fonte e trunca texto conforme o número de itens, para não estourar fatias estreitas
      const tamanhoFonte = Math.max(8, Math.min(12, 180 / itens.length));
      const maxCaracteres = Math.max(4, Math.floor(16 - itens.length / 2));

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(anguloAtual * (Math.PI / 180));

      itens.forEach((item, i) => {
        const inicio = i * fatia - Math.PI / 2;
        const fim = inicio + fatia;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, raio, inicio, fim);
        ctx.closePath();
        ctx.fillStyle = item.cor;
        ctx.fill();

        if (indiceDestaque === i) {
          // Destaca a fatia sorteada após o giro
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#fff";
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.save();
        const meio = inicio + fatia / 2;
        ctx.rotate(meio);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${tamanhoFonte}px 'Plus Jakarta Sans', sans-serif`;
        const texto =
          item.texto.length > maxCaracteres
            ? item.texto.slice(0, maxCaracteres - 1) + "…"
            : item.texto;
        ctx.fillText(texto, raio - 14, 4);
        ctx.restore();
      });

      ctx.restore();

      // Aro externo sutil
      ctx.beginPath();
      ctx.arc(cx, cy, raio, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [itens]
  );

  // Re-desenha sempre que os itens, o ângulo ou o destaque do vencedor mudarem
  useEffect(() => {
    if (itens.length >= 2) {
      desenharRoleta(angulo, indiceVencedor);
    }
  }, [itens, angulo, indiceVencedor, desenharRoleta]);

  // Redesenha ao redimensionar a janela, já que o canvas é responsivo
  useEffect(() => {
    function aoRedimensionar() {
      if (itens.length >= 2) desenharRoleta(angulo, indiceVencedor);
    }
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, [itens, angulo, indiceVencedor, desenharRoleta]);

  function girar() {
    if (itens.length < 2 || girando) return;
    setGirando(true);
    setResultado(null);
    setIndiceVencedor(null);

    const voltas = 5 + Math.floor(Math.random() * 5);
    const extra = Math.random() * 360;
    const partida = angulo;
    const total = partida + voltas * 360 + extra;

    const fatia = 360 / itens.length;
    // Geometria: a fatia i é desenhada cobrindo [i*fatia, (i+1)*fatia) a partir do topo
    // (12h), no sentido horário; o canvas inteiro é então rotacionado `total` graus no
    // sentido horário; o ponteiro fica fixo no topo. Logo a fatia sob o ponteiro é a que,
    // antes da rotação, cobria o ângulo -total (normalizado em 0-360).
    const p = (((-total % 360) + 360) % 360);
    const indiceSorteado = Math.floor(p / fatia) % itens.length;

    if (reduzMovimento) {
      // Movimento reduzido: sem giro longo, resolve na hora mas com o resultado correto
      const finalNormalizado = total % 360;
      setAngulo(finalNormalizado);
      desenharRoleta(finalNormalizado, indiceSorteado);
      setResultado(itens[indiceSorteado]?.texto ?? null);
      setIndiceVencedor(indiceSorteado);
      setGirando(false);
      return;
    }

    const inicioTempo = performance.now();
    const duracao = 4000;

    function animar(agora: number) {
      const decorrido = agora - inicioTempo;
      const progresso = Math.min(decorrido / duracao, 1);
      const facilidade = 1 - Math.pow(1 - progresso, 3.5);
      const atual = partida + (total - partida) * facilidade;

      desenharRoleta(atual, progresso >= 1 ? indiceSorteado : null);

      if (progresso < 1) {
        requestAnimationFrame(animar);
      } else {
        setGirando(false);
        setResultado(itens[indiceSorteado]?.texto ?? null);
        setIndiceVencedor(indiceSorteado);
        setAngulo(total % 360);
      }
    }

    requestAnimationFrame(animar);
  }

  async function criarTarefaDoResultado() {
    if (!resultado || criandoTarefa) return;
    setCriandoTarefa(true);
    try {
      const NOME_LISTA = "Ideias da roleta";

      // Busca listas existentes
      const { tarefas: listas } = await api<{ tarefas: { id: string; title: string }[] }>("/api/tarefas");
      let listaId = listas?.find((l) => l.title === NOME_LISTA)?.id;

      // Se não achou, cria a lista
      if (!listaId) {
        const { lista } = await api<{ lista: { id: string } }>("/api/tarefas", {
          method: "POST",
          body: JSON.stringify({ title: NOME_LISTA }),
        });
        listaId = lista.id;
      }

      // Adiciona a tarefa
      await api("/api/tarefas", {
        method: "POST",
        body: JSON.stringify({ listId: listaId, content: resultado }),
      });

      toast(`"${resultado}" adicionado!`, "success");
    } catch (err: any) {
      toast(err.message || "Erro ao criar tarefa.", "error");
    } finally {
      setCriandoTarefa(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-text">Roleta surpresa</h1>
        <p className="mt-1 text-sm text-muted">
          Monte sua roleta com ideias e gire para sortear uma surpresa.
        </p>
      </div>

      {/* Roleta */}
      <div className="flex justify-center">
        <div className="relative aspect-square w-full max-w-[300px]">
          <canvas
            ref={canvasRef}
            className={cn(
              "h-full w-full rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-shadow",
              girando && "shadow-accent/30"
            )}
          />

          {/* Aro sutil sobreposto ao canvas */}
          <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/10" />

          {/* Destaque pulsante quando há um resultado */}
          <AnimatePresence>
            {resultado && !girando && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1.06 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-accent/50"
              />
            )}
          </AnimatePresence>

          {/* Ponteiro indicador, fixo no topo */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/3 drop-shadow-md">
            <div
              className="h-7 w-7 accent-gradient"
              style={{ clipPath: "polygon(50% 100%, 12% 0%, 88% 0%)" }}
            />
          </div>

          {/* Pino central */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md" />

          {itens.length < 2 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-surface2/60 text-center">
              <Sparkles size={24} className="text-muted" />
              <p className="mt-1 text-xs text-muted">Adicione pelo menos 2 itens</p>
            </div>
          )}
        </div>
      </div>

      {/* Resultado */}
      <AnimatePresence>
        {resultado && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto max-w-xs rounded-2xl bg-accent/12 p-5 text-center space-y-3"
          >
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                <Sparkles size={14} />
                Saiu!
              </div>
              <div className="mt-1 font-display text-xl text-text">
                {resultado}
              </div>
            </div>
            {coupled && (
              <button
                onClick={criarTarefaDoResultado}
                disabled={criandoTarefa}
                className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
              >
                {criandoTarefa ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ListTodo size={16} />
                )}
                Criar tarefa com essa ideia
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão girar */}
      <div className="flex justify-center">
        <button
          onClick={girar}
          disabled={itens.length < 2 || girando}
          className="flex items-center gap-2 rounded-full accent-gradient px-8 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          {girando ? (
            <>
              <RotateCw size={18} className="animate-spin" />
              Girando...
            </>
          ) : (
            <>
              <Play size={18} />
              Girar roleta
            </>
          )}
        </button>
      </div>

      {/* Adicionar itens */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold text-text">Seus itens ({itens.length})</h2>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adicionar()}
            placeholder="Ex: Jantar romântico"
            maxLength={40}
            className="flex-1 rounded-xl border border-border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <button
            onClick={adicionar}
            disabled={!novoItem.trim() || itens.length >= 20}
            className="rounded-xl bg-accent px-4 py-2.5 text-white transition hover:brightness-110 disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-1.5">
          <AnimatePresence>
            {itens.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                className="flex items-center gap-2.5 rounded-xl bg-surface2 px-3.5 py-2.5"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: item.cor }}
                />
                <span className="flex-1 text-sm text-text">{item.texto}</span>
                <button
                  onClick={() => remover(item.id)}
                  className="rounded-lg p-1 text-faint transition hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {itens.length > 0 && (
            <button
              onClick={() => {
                const padrao: RoletaItem[] = IDEIAS_PADRAO.map((texto, i) => ({
                  id: gerarId(),
                  texto,
                  cor: CORES[i % CORES.length],
                }));
                setItens(padrao);
                setResultado(null);
                setIndiceVencedor(null);
              }}
              className="mt-3 w-full rounded-xl border border-border bg-surface2 py-2 text-xs text-muted transition hover:text-accent"
            >
              ↻ Restaurar ideias padrão
            </button>
          )}
        </div>

        {itens.length === 0 && (
          <div className="py-2 text-center">
            <p className="pb-3 text-sm text-muted">
              Adicione ideias para montar sua roleta personalizada.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {IDEIAS_PADRAO.slice(0, 8).map((ideia) => (
                <button
                  key={ideia}
                  onClick={() => adicionarTexto(ideia)}
                  className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                >
                  + {ideia}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
