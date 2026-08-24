import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Sparkles, Camera, MapPin, Calendar, MessageCircle } from "lucide-react";
import { BRAND, TAGLINE } from "@/nucleo/marca";

export const metadata = { title: `Demonstração · ${BRAND}` };

const FEATURES = [
  { icon: Heart, title: "Linha do tempo", desc: "Memórias em ordem cronológica com fotos, humor, tags e localização." },
  { icon: Sparkles, title: "Resumos com IA", desc: "A IA lê as memórias do casal e gera um resumo personalizado no estilo horóscopo do amor." },
  { icon: Camera, title: "Álbum de fotos", desc: "Galeria organizada por mês com todas as fotos que vocês registrarem juntos." },
  { icon: MapPin, title: "Mapa das memórias", desc: "Visualize no mapa todos os lugares especiais que vocês marcaram." },
  { icon: Calendar, title: "Retrospectiva animada", desc: "Experiência em tela cheia estilo Wrapped com os melhores momentos do semestre." },
  { icon: MessageCircle, title: "Chat do casal", desc: "Conversem dentro do app com notificações e indicadores de digitação." },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:py-14">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted transition hover:text-text">
        <ArrowLeft size={15} /> Voltar
      </Link>

      <div className="mb-10 text-center">
        <p className="kicker">Prévia</p>
        <h1 className="display mt-2 text-[34px] text-text">Veja como funciona</h1>
        <p className="mt-2 text-[14px] text-muted">
          Uma prévia do que o {BRAND} oferece para você e seu amor.
        </p>
      </div>

      {/* Mock da timeline */}
      <div className="mb-10 space-y-4">
        <div className="card overflow-hidden border-accent/20">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="h-10 w-10 rounded-full bg-accent/20" />
            <div>
              <div className="font-semibold text-text">Ana</div>
              <div className="text-[11.5px] text-faint">Hoje · 14:32</div>
            </div>
            <span className="ml-auto rounded-lg bg-pink-500/15 px-2.5 py-1 text-[11px] font-semibold text-pink-400">
              😍 Apaixonada
            </span>
          </div>
          <div className="p-4">
            <h3 className="display text-[20px] text-text">Nosso primeiro encontro no parque</h3>
            <p className="mt-2 text-[14.5px] leading-[1.72] text-muted">
              Hoje lembrei do dia em que a gente se conheceu. Você chegou atrasado(a) e eu já estava quase indo embora...
              ainda bem que fiquei. Foi o melhor "atraso" da minha vida. Cada dia ao seu lado é uma nova memória que eu
              quero guardar para sempre.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="tag">#primeiroencontro</span>
              <span className="tag">#parque</span>
              <span className="flex items-center gap-1 rounded-lg bg-surface2 px-2.5 py-1 text-[11px] text-muted">
                <MapPin size={11} /> Parque Ibirapuera
              </span>
            </div>
            {insight && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent/5 p-3">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[12px] italic text-accentInk">{insight}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 border-t border-border px-4 py-2.5">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] text-muted transition hover:text-accentInk">
              <Heart size={14} /> 12
            </button>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] text-muted transition hover:text-accentInk">
              <MessageCircle size={14} /> 3
            </button>
          </div>
        </div>

        {/* Mock do resumo da IA */}
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accentInk">
              Resumo do amor de hoje
            </span>
          </div>
          <div className="display text-[19px] text-text">Vocês estão brilhando</div>
          <p className="mt-1 text-[14px] leading-[1.72] text-muted">
            As memórias recentes respiram carinho e cumplicidade. Tem muito amor circulando por aqui — continuem regando isso!
          </p>
          <p className="mt-2 text-[12px] italic text-accentInk">Dica: Registrem juntos o melhor momento do dia.</p>
        </div>
      </div>

      {/* Funcionalidades */}
      <div className="mb-10">
        <p className="kicker mb-2">Funcionalidades</p>
        <h2 className="display mb-4 text-[24px] text-text">Tudo que você encontra no {BRAND}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <f.icon size={17} />
              </span>
              <div>
                <div className="text-[13.5px] font-semibold text-text">{f.title}</div>
                <div className="text-[12.5px] text-muted">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-8 text-center">
        <h2 className="display text-[24px] text-text">Gostou da prévia?</h2>
        <p className="mt-2 text-[14px] text-muted">
          Crie sua conta gratuita e comece a escrever a história de vocês.
        </p>
        <Link
          href="/cadastrar"
          className="sheen mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-text px-7 text-[14px] font-semibold text-bg transition hover:bg-accent"
        >
          <Heart size={16} /> Criar meu diário grátis
        </Link>
        <p className="mt-3 text-[11.5px] text-faint">Sem cartão de crédito · Sem assinatura · 100% gratuito</p>
      </div>
    </div>
  );
}

const insight = "Cada memória que você guarda é um tijolinho na história de vocês. Continua assim!";
