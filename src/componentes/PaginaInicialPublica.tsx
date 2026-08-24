"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Sparkles,
  Palette,
  Smartphone,
  Users,
  Clock,
  ArrowRight,
  Trophy,
  Star,
  Shield,
  Zap,
  QrCode,
  Link2,
} from "lucide-react";
import { Logo } from "./Logo";
import { CharacterAvatar } from "./AvatarPersonagem";
import { CHARACTERS } from "@/nucleo/personagens";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const PUBLICOS = [
  "namorada 💕", "namorado 💙", "marido 💍", "esposa 💍",
  "melhor amiga 👯", "mãe 🌸", "pai 🌟", "avós 👴👵",
];

const DEPOIMENTOS = [
  { nome: "Marina", texto: "A retrospectiva fez a gente chorar. Melhor presente que já dei.", tempo: "há 2 semanas" },
  { nome: "Lucas", texto: "Usei pra pedir em namoro. O mapa estelar e a carta emocionaram muito.", tempo: "há 1 mês" },
  { nome: "Camila", texto: "Minha mãe amou. Montei um livro com fotos desde a infância.", tempo: "há 3 semanas" },
  { nome: "Rafael", texto: "A roleta surpresa virou nosso jogo favorito. Toda semana a gente sorteia algo.", tempo: "há 5 dias" },
  { nome: "Beatriz", texto: "Escrevo todo dia. Já são 6 meses de diário e parece que foi ontem.", tempo: "há 2 meses" },
  { nome: "Thiago", texto: "O resumo da IA sempre acerta como a gente tá. Dá até arrepio.", tempo: "há 1 semana" },
];

const ETAPAS = [
  { num: "1", icon: Heart, title: "Conte sua história", text: "Escreva, coloque fotos, escolha o humor e a data. É como um diário, mas a dois." },
  { num: "2", icon: Sparkles, title: "A IA personaliza", text: "Resumos, análises, retrospectiva animada e personagens que conversam com você." },
  { num: "3", icon: Link2, title: "Receba o link", text: "Compartilhe seu diário, uma memória ou a retrospectiva com quem você quiser." },
  { num: "4", icon: QrCode, title: "Entregue com carinho", text: "Gere um QR Code, imprima e coloque num cartão. Ou mande pelo WhatsApp." },
];

const CONFIABILIDADE = [
  { icon: Star, text: "4.9 estrelas" },
  { icon: Shield, text: "Dados criptografados" },
  { icon: Zap, text: "Cria em 2 minutos" },
  { icon: Smartphone, text: "Link + QR Code" },
];

const FEATURES = [
  { icon: Clock, title: "Linha do tempo", text: "Escreva sua história dia após dia, com humor, fotos e datas. Tudo em ordem, como um filme de vocês." },
  { icon: Users, title: "Conecte-se a dois", text: "Uma pessoa cria o diário e convida a outra por um código. A partir daí, a história é de vocês dois." },
  { icon: MessageCircle, title: "Comente e curta", text: "Deixe um coração ou um comentário carinhoso em cada memória que seu amor registrar." },
  { icon: Trophy, title: "Nível de apaixonados", text: "Cada gesto vale pontos. A IA lê suas memórias e o nível de vocês sobe — com metas e sem limite." },
  { icon: Sparkles, title: "Personagens de IA", text: "Lua, Sol, Cupido e mais aparecem pra puxar papo sobre o que você escreveu. Use sua chave do GPT, DeepSeek ou Claude." },
  { icon: Palette, title: "Temas lindos", text: "Aurora, Claro, Meia-noite, Pôr do sol e seis cores de acento. Deixe do jeitinho de vocês." },
  { icon: Smartphone, title: "Em todo lugar", text: "Funciona no navegador e instala como app no Android, iOS e PC. Seus dados sempre à mão." },
];

/**
 * A capa do produto, em papel.
 *
 * A versão anterior era uma sucessão de degradês roxos, pílulas de vidro e
 * `shadow-glow`. Aqui a página é uma capa editorial: kicker, título em
 * Fraunces com tracking negativo, réguas de 1px entre as seções e um único
 * carmim. Nenhum link, rota ou texto mudou — só a roupa.
 */
export function Landing() {
  const [textoDigitando, setTextoDigitando] = useState("");
  const [indicePublico, setIndicePublico] = useState(0);
  const [indiceLetra, setIndiceLetra] = useState(0);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    const publico = PUBLICOS[indicePublico];
    if (!apagando) {
      if (indiceLetra <= publico.length) {
        const t = setTimeout(() => setIndiceLetra((i) => i + 1), 80);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setApagando(true), 2000);
      return () => clearTimeout(t);
    }
    if (indiceLetra > 0) {
      const t = setTimeout(() => setIndiceLetra((i) => i - 1), 40);
      return () => clearTimeout(t);
    }
    setApagando(false);
    setIndicePublico((i) => (i + 1) % PUBLICOS.length);
  }, [indiceLetra, indicePublico, apagando]);

  useEffect(() => {
    setTextoDigitando(PUBLICOS[indicePublico].slice(0, indiceLetra));
  }, [indiceLetra, indicePublico]);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Barra de anúncio */}
      <div className="border-b border-border bg-bg2 py-2.5 text-center text-[11.5px] font-medium text-muted">
        <span className="animate-pulse text-accent">✦</span> Um diário íntimo para guardar a história de vocês · Grátis e em 2 minutos
      </div>

      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="flex items-center gap-1">
            <Link href="/demo" className="hidden h-9 items-center rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-text sm:inline-flex">
              Demonstração
            </Link>
            <Link href="/entrar" className="inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-text">
              Entrar
            </Link>
            <Link
              href="/cadastrar"
              className="sheen ml-1 inline-flex h-9 items-center rounded-lg bg-text px-[18px] text-[13px] font-semibold text-bg transition-colors hover:bg-accent"
            >
              Criar diário
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-2 lg:pt-20">
        <div>
          <motion.span
            variants={fade}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2"
          >
            <Heart size={12} className="text-accent" />
            <span className="kicker">O diário de vocês dois</span>
          </motion.span>

          <motion.h1
            variants={fade}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-5 font-display text-[44px] leading-[0.98] tracking-[-0.035em] text-text sm:text-6xl lg:text-[74px]"
          >
            Declare seu amor para sua{" "}
            <span className="italic text-accent">
              {textoDigitando}
              <span className="anim-caret ml-1 inline-block h-[0.62em] w-[3px] bg-accent align-middle" />
            </span>
          </motion.h1>

          <motion.div variants={fade} initial="hidden" animate="show" custom={2} className="mt-7 max-w-md">
            <div className="rule rule-grow" />
            <p className="mt-5 text-[15.5px] leading-[1.72] text-muted">
              O Enlace é um diário para casais. Escreva numa linha do tempo, conecte-se com quem você
              ama, comente, curta, suba o nível de apaixonados — e converse com personagens de IA que
              aparecem pra puxar papo.
            </p>
          </motion.div>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-8 flex flex-wrap items-center gap-2.5"
          >
            <Link
              href="/cadastrar"
              className="sheen group inline-flex h-11 items-center gap-2 rounded-lg bg-text px-6 text-[14px] font-semibold text-bg transition-colors hover:bg-accent"
            >
              Começar de graça
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border2 bg-surface px-6 text-[14px] font-medium text-text transition-colors hover:bg-surface2"
            >
              Ver demonstração
            </Link>
          </motion.div>

          <motion.p variants={fade} initial="hidden" animate="show" custom={4} className="mt-5 text-[11.5px] text-faint">
            Conheça a experiência pelo modo de demonstração, sem criar uma conta.
          </motion.p>
        </div>

        {/* Hero art */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative mx-auto max-w-sm">
            <MockCard />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 -top-6 hidden sm:block"
            >
              <CharacterAvatar slug="lua" size={72} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -right-4 hidden sm:block"
            >
              <CharacterAvatar slug="cupido" size={64} />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Faixa de públicos */}
      <section className="overflow-hidden border-y border-border bg-bg2 py-3.5">
        <motion.div
          animate={{ x: [0, -1920] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-12 px-6"
        >
          {[...PUBLICOS, ...PUBLICOS].map((p, i) => (
            <span key={i} className="whitespace-nowrap text-[13px] font-medium text-muted">
              {p}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Depoimentos */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead kicker="Depoimentos" title="Quem usa recomenda">
          Depoimentos de quem já está escrevendo sua história no Enlace.
        </SectionHead>
        <div className="mt-10 overflow-hidden">
          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex w-max gap-3"
          >
            {[...DEPOIMENTOS, ...DEPOIMENTOS].map((d, i) => (
              <div key={i} className="w-72 shrink-0 rounded-lg border border-border2 bg-surface p-5 shadow-soft">
                <div className="flex items-center gap-0.5 text-accent">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={12} className="fill-accent" />
                  ))}
                </div>
                <p className="mt-3 text-[14px] leading-[1.72] text-text">"{d.texto}"</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-faint">
                  <span className="font-semibold text-muted">{d.nome}</span>
                  <span>{d.tempo}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Como funciona - etapas */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead kicker="Passo a passo" title="Como funciona">
            Quatro passos simples para criar o diário mais especial da vida de vocês.
          </SectionHead>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPAS.map((etapa, i) => (
              <motion.div
                key={etapa.num}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border2 bg-surface text-accent">
                  <etapa.icon size={19} />
                </div>
                <span className="kicker kicker-sm">Passo {etapa.num}</span>
                <h3 className="display mt-2 text-[21px] text-text">{etapa.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.7] text-muted">{etapa.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead kicker="Recursos" title="Feito para o amor de vocês">
            Simples de usar, bonito de olhar e cheio de detalhes que fazem diferença.
          </SectionHead>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                className="card p-6 transition hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border2 bg-surface2 text-accent">
                  <f.icon size={19} />
                </div>
                <h3 className="display text-[23px] text-text">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.72] text-muted">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Faixa de confiança */}
      <section className="overflow-hidden border-y border-border bg-bg2 py-4">
        <motion.div
          animate={{ x: [0, -1400] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-16 px-8"
        >
          {[...CONFIABILIDADE, ...CONFIABILIDADE, ...CONFIABILIDADE].map((c, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap text-[13px] text-muted">
              <c.icon size={15} className="text-accent" />
              <span>{c.text}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Characters */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="scrap-frame scrap-frame-botanical overflow-hidden rounded-2xl border border-border2 bg-surface p-8 shadow-card sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="tag">
                <Sparkles size={12} /> Personagens de IA
              </span>
              <h2 className="display mt-5 text-[34px] text-text sm:text-[40px]">Alguém pra conversar, sempre.</h2>
              <div className="rule mt-5 max-w-[120px]" />
              <p className="mt-5 max-w-md text-[14.5px] leading-[1.72] text-muted">
                Cada personagem tem sua personalidade: a Lua te ouve, o Sol te anima, o Cupido dá
                ideias de encontro. Você conecta sua chave do <b>GPT</b>, <b>DeepSeek</b> ou{" "}
                <b>Claude</b> e conversa à vontade — as chaves ficam criptografadas.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {CHARACTERS.map((c, i) => (
                <motion.div
                  key={c.slug}
                  variants={fade}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={i}
                  className="flex w-28 flex-col items-center gap-2 rounded-lg border border-border2 bg-surface2 p-4"
                >
                  <CharacterAvatar slug={c.slug} size={68} float />
                  <span className="display text-[17px] text-text">{c.name}</span>
                  <span className="text-center text-[11px] leading-tight text-faint">{c.role}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <Heart className="mx-auto text-accent" size={30} />
            <h2 className="mt-6 font-display text-[42px] leading-[1] tracking-[-0.035em] text-text sm:text-[56px]">
              Comecem a escrever hoje.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.72] text-muted">
              Leva um minuto pra criar. Daqui a um ano, vocês vão querer ter começado agora.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
              <Link
                href="/cadastrar"
                className="sheen inline-flex h-11 items-center gap-2 rounded-lg bg-text px-7 text-[14px] font-semibold text-bg transition-colors hover:bg-accent"
              >
                Criar nosso diário <ArrowRight size={17} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border2 bg-surface px-7 text-[14px] font-medium text-text transition-colors hover:bg-surface2"
              >
                Ver demonstração
              </Link>
            </div>
            <p className="mt-5 text-[11.5px] text-faint">100% gratuito · Sem cartão · Sem assinatura</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ resumido */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <SectionHead kicker="Perguntas" title="Dúvidas comuns" />
          <div className="mt-8 divide-y divide-border border-y border-border">
            {[
              { q: "É grátis mesmo?", a: "Sim. Todas as funcionalidades são gratuitas, sem plano pago, sem assinatura." },
              { q: "Precisa instalar aplicativo?", a: "Não. Funciona no navegador. Dá pra instalar como app se quiser, mas é opcional." },
              { q: "Dá pra escrever memórias antigas?", a: "Sim. Você escolhe a data de cada memória, então pode preencher o passado também." },
              { q: "Meus dados ficam seguros?", a: "Sim. Suas memórias privadas só você vê. As compartilhadas só seu parceiro(a). Dados criptografados." },
            ].map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between py-4 text-[14px] font-semibold text-text">
                  {faq.q}
                  <span className="text-lg font-normal text-faint transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 pr-8 text-[13.5px] leading-[1.72] text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/faq" className="text-[13px] font-semibold text-accentInk transition hover:underline">
              Ver todas as dúvidas frequentes →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer completo */}
      <footer className="border-t border-border bg-bg2">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 text-[12px] text-muted">O diário de vocês dois.</p>
            </div>
            <div>
              <h4 className="kicker mb-3">Produto</h4>
              <div className="space-y-2 text-[13px] text-muted">
                <Link href="/demo" className="block transition hover:text-text">Demonstração</Link>
                <Link href="/faq" className="block transition hover:text-text">FAQ</Link>
                <Link href="/contato" className="block transition hover:text-text">Contato</Link>
              </div>
            </div>
            <div>
              <h4 className="kicker mb-3">Legal</h4>
              <div className="space-y-2 text-[13px] text-muted">
                <Link href="/privacidade" className="block transition hover:text-text">Privacidade</Link>
                <Link href="/termos" className="block transition hover:text-text">Termos de uso</Link>
              </div>
            </div>
            <div>
              <h4 className="kicker mb-3">Acesso rápido</h4>
              <div className="space-y-2 text-[13px] text-muted">
                <Link href="/entrar" className="block transition hover:text-text">Entrar</Link>
                <Link href="/cadastrar" className="block transition hover:text-text">Criar conta</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-[11px] text-faint">
            Feito com <Heart size={11} className="inline text-accent" /> · Enlace · {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Kicker + título de seção + subtítulo, centralizados. O cabeçalho padrão da capa. */
function SectionHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="text-center">
      <span className="kicker">{kicker}</span>
      <h2 className="mt-3 font-display text-[34px] leading-[1.05] tracking-[-0.03em] text-text sm:text-[42px]">
        {title}
      </h2>
      {children && <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-[1.72] text-muted">{children}</p>}
    </div>
  );
}

function MockCard() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 pb-3 pt-4">
        <div className="h-9 w-9 rounded-full" style={{ background: "#5AA0F0" }} />
        <div>
          <div className="text-[14px] font-bold text-text">João</div>
          <div className="text-[11.5px] text-faint">Hoje · 😍 Radiante</div>
        </div>
      </div>
      <div className="px-5 pb-4">
        <div className="display text-[26px] text-text">Nosso café na varanda</div>
        <p className="mt-2 text-[14px] leading-[1.72] text-muted">
          Acordei antes de você e fiz aquele café coado. A luz batendo na mesa, você ainda de olhos
          meio fechados. Queria guardar essa manhã inteira num pote.
        </p>
      </div>
      <div className="flex items-center gap-4 border-t border-border px-5 py-3 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5 text-accentInk">
          <Heart size={15} className="fill-accent text-accent" /> 1
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle size={15} /> 1
        </span>
      </div>
    </div>
  );
}
