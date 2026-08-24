"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Sparkles,
  Settings,
  PenLine,
  LogOut,
  Link2,
  HeartHandshake,
  MessagesSquare,
  Images,
  ClipboardList,
  Map,
  BookHeart,
  Wand2,
  ListTodo,
  Trophy,
  Satellite,
  Egg,
  Radio,
  Joystick,
  Menu,
  Search,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { NotificationsPanel } from "./PainelNotificacoes";
import { SecretReveal } from "./RevelacaoSegredo";
import { FaixaRadioCabecalho } from "./ReprodutorRadio";
import { api } from "@/nucleo/cliente";
import { cn } from "@/nucleo/utilitarios";
import { EASE_OUT, duration } from "@/nucleo/movimento";
import type { Me } from "@/nucleo/usuario-atual";
import { IndicadorCasal } from "./estrutura/IndicadorCasal";

const NAV = [
  { href: "/app", label: "Início", icon: Home, exact: true },
  { href: "/app/nos", label: "Nós", icon: HeartHandshake },
  { href: "/app/bichinho", label: "Bichinho", icon: Egg },
  { href: "/app/conversa", label: "Conversa", icon: MessagesSquare, badge: true },
  { href: "/app/jogos", label: "Jogos", icon: Joystick },
  { href: "/app/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/app/album", label: "Álbum", icon: Images },
  { href: "/app/mapa", label: "Mapa", icon: Map },
  { href: "/app/ao-vivo", label: "Ao vivo", icon: Satellite },
  { href: "/app/planos", label: "Planos", icon: ClipboardList },
  { href: "/app/livro", label: "Nosso livro", icon: BookHeart },
  { href: "/app/radio", label: "Rádio", icon: Radio },
  { href: "/app/trofeus", label: "Troféus", icon: Trophy },
  { href: "/app/retrospectiva", label: "Retrospectiva", icon: Wand2 },
  { href: "/app/personagens", label: "Personagens", icon: Sparkles },
  { href: "/app/config", label: "Você", icon: Settings },
];

const CONFIG_HREF = "/app/config";

const NAV_GROUPS = [
  { label: "Principal", items: NAV.filter((item) => ["/app", "/app/nos", "/app/conversa"].includes(item.href)) },
  { label: "Momentos", items: NAV.filter((item) => ["/app/album", "/app/mapa", "/app/livro", "/app/retrospectiva"].includes(item.href)) },
  { label: "Vida a dois", items: NAV.filter((item) => ["/app/bichinho", "/app/tarefas", "/app/planos", "/app/ao-vivo"].includes(item.href)) },
  { label: "Diversão", items: NAV.filter((item) => ["/app/jogos", "/app/radio", "/app/trofeus", "/app/personagens"].includes(item.href)) },
];
const MOBILE_NAV_GROUPS = [
  ...NAV_GROUPS,
  { label: "Conta", items: NAV.filter((item) => item.href === CONFIG_HREF) },
];

/** Data por extenso do cabeçalho editorial: "sábado, 9 de agosto". */
function hoje() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

/** A linha discreta ao lado da data. Sequência primeiro; nível como reserva. */
function statLine(me: Me) {
  if (me.streak > 0) return `${me.streak} ${me.streak === 1 ? "dia" : "dias"} de sequência`;
  if (me.couple) return `Nível ${me.couple.level}`;
  return "Primeira página";
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.assign("/entrar");
}

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** Páginas visuais aproveitam o desktop; feed, conversa e editor continuam
 * estreitos para preservar leitura confortável. */
function contentWidth(pathname: string) {
  const wide = ["/app/album", "/app/mapa", "/app/jogos", "/app/tarefas", "/app/planos", "/app/config", "/app/trofeus"];
  return wide.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
    ? "max-w-6xl"
    : "max-w-2xl";
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * No trilho não cabe número: a novidade vira um ponto de 7px pulsando.
 * A fonte do dado é a mesma (`unread`), só a forma muda.
 */
function UnreadDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="anim-new absolute -right-1 -top-0.5 h-[7px] w-[7px] rounded-full bg-accent" />
  );
}

/** A lasca de carmim que sangra pela esquerda do item ativo do trilho. */
function ActiveShard() {
  return <span className="absolute -left-[3px] top-1/2 h-5 w-[3px] -translate-y-1/2 bg-accent" />;
}

export function EstruturaAplicativo({ me, unread: initialUnread = 0, children }: { me: Me; unread?: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unread, setUnread] = useState(initialUnread);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopViewport, setDesktopViewport] = useState<boolean | null>(null);
  const [navigating, setNavigating] = useState(false);
  // Inicializa com o valor do servidor (para o HTML bater na hidratação) e
  // corrige no cliente, onde o fuso é o do usuário.
  const [dataDeHoje, setDataDeHoje] = useState("");
  const inChat = pathname === "/app/conversa";
  const configActive = isActive(pathname, CONFIG_HREF);

  // Fecha camadas e encerra o feedback assim que a nova rota foi aplicada.
  useEffect(() => {
    setMobileMenuOpen(false);
    setNavigating(false);
  }, [pathname, searchParams]);

  // Monta somente UMA instância dos controles que possuem sincronização. CSS
  // ocultava a outra versão, mas os efeitos de rádio/notificações continuavam.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktopViewport(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  // Feedback imediato no primeiro toque, antes mesmo de o servidor terminar a
  // próxima rota. O loading.tsx assume em seguida com o skeleton completo.
  useEffect(() => {
    const onNavigate = (event: PointerEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setNavigating(true);
    };
    document.addEventListener("pointerdown", onNavigate, true);
    return () => document.removeEventListener("pointerdown", onNavigate, true);
  }, []);

  // Aquece dois destinos frequentes somente quando a tela está ociosa e a
  // conexão permite. Evita disputar banda com a primeira pintura no celular.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType?.includes("2g")) return;
    const warm = () => ["/app/novo", "/app/conversa"].forEach((href) => router.prefetch(href));
    const id = window.setTimeout(warm, 1_400);
    return () => window.clearTimeout(id);
  }, [router]);

  useEffect(() => {
    if (!navigating) return;
    const id = window.setTimeout(() => setNavigating(false), 8_000);
    return () => window.clearTimeout(id);
  }, [navigating]);

  useEffect(() => { setDataDeHoje(hoje()); }, []);

  // Badge de não lidas: zera no chat, atualiza a cada 45s fora dele.
  useEffect(() => {
    if (inChat) {
      setUnread(0);
      return;
    }
    let alive = true;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      api<{ count: number }>("/api/chat/unread")
        .then((r) => alive && setUnread(r.count))
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 45_000);
    window.addEventListener("focus", tick);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [inChat]);

  return (
    <div className="min-h-dvh lg:pl-56">
      {navigating && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[260] h-0.5 overflow-hidden bg-accent/15" role="status" aria-label="Abrindo página">
          <motion.span
            className="block h-full bg-accent"
            initial={{ width: "8%", x: "-100%" }}
            animate={{ width: "78%", x: "28%" }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
          />
        </div>
      )}
      {/* Navegação editorial agrupada: rótulos visíveis evitam depender de
          tooltip e mantêm todos os destinos a um clique no desktop. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border2 bg-bg2 lg:flex">
        <div className="flex h-[62px] shrink-0 items-center border-b border-border px-5">
          <Link href="/app" aria-label="Início" className="anim-pop inline-flex">
            <Logo size={28} />
          </Link>
        </div>

        <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-3 text-[9px] font-extrabold uppercase tracking-[0.18em] text-faint">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onPointerEnter={() => router.prefetch(item.href)}
                      onFocus={() => router.prefetch(item.href)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors",
                        active ? "bg-text text-bg" : "text-muted hover:bg-surface2 hover:text-text"
                      )}
                    >
                      {active && <ActiveShard />}
                      <span className="relative shrink-0">
                        <item.icon size={17} />
                        {item.badge && <UnreadDot count={unread} />}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <Link
            href={CONFIG_HREF}
            aria-current={configActive ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center gap-2.5 rounded-xl px-2.5 transition-colors",
              configActive ? "bg-text text-bg" : "hover:bg-surface2"
            )}
          >
            <Avatar name={me.displayName || me.name} color={me.avatarColor} url={me.avatarUrl} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{me.displayName || me.name}</span>
              <span className={cn("block truncate text-[10px]", configActive ? "text-bg/65" : "text-faint")}>Configurações</span>
            </span>
            <Settings size={16} />
          </Link>
          <button
            onClick={logout}
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-faint transition-colors hover:bg-surface2 hover:text-danger"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* ── Cabeçalho editorial (desktop) ───────────────────────────────────
          62px: data por extenso, régua de 22px, uma estatística quieta — e,
          à direita, a única ação primária do app. */}
      <header className="sticky top-0 z-20 hidden h-[62px] items-center gap-4 border-b border-border bg-bg/88 px-6 backdrop-blur-[6px] lg:flex">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="kicker truncate">{dataDeHoje}</span>
          <span className="rule w-[22px] shrink-0" />
          <span className="hidden whitespace-nowrap text-[12px] text-muted xl:inline">{statLine(me)}</span>
        </div>

        {desktopViewport === true && <FaixaRadioCabecalho me={me} variant="desktop" />}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {desktopViewport === true && <NotificationsPanel />}
          <Link
            href="/app?buscar=1"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            <Search size={15} /> Buscar
          </Link>
          <Link
            href="/app/novo"
            className="sheen inline-flex h-9 items-center gap-2 rounded-lg bg-text px-[18px] text-[13px] font-semibold text-bg transition-colors hover:bg-accent"
          >
            <PenLine size={15} /> Escrever
          </Link>
        </div>
      </header>

      {/* Top bar mobile */}
      {/*
        `pt-[env(safe-area-inset-top)]`: o app usa viewportFit "cover", então o
        iOS desenha a página por baixo do notch. A barra de baixo já tratava
        isso, a de cima não — no iPhone o cabeçalho ficava embaixo da barra de
        status e aparecia cortado. Como é padding (e não margem), o fundo
        borrado continua subindo até o topo, que é o efeito certo.
      */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/88 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-[6px] lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface2 hover:text-text"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/app">
            <Logo size={24} />
          </Link>
        </div>
        {/* Sem reprodução, o componente retorna `null` e não deixa um
            espaçador invisível entre os dois grupos do cabeçalho. */}
        {desktopViewport === false && <FaixaRadioCabecalho me={me} variant="mobile" />}
        <div className="flex items-center gap-1">
          <Link href="/app/ao-vivo" className="rounded-lg p-2 text-faint transition-colors hover:bg-surface2 hover:text-text" title="Ao vivo">
            <Satellite size={19} />
          </Link>
          <Link href="/app/album" className="rounded-lg p-2 text-faint transition-colors hover:bg-surface2 hover:text-text" title="Álbum">
            <Images size={19} />
          </Link>
          {desktopViewport === false && <NotificationsPanel compact />}
          {!me.partner && (
            <Link href="/app/config" className="rounded-lg bg-accent/10 p-2 text-accentInk" title="Conectar">
              <Link2 size={17} />
            </Link>
          )}
          <Link href="/app/config" title="Você" className="ml-1">
            <Avatar name={me.displayName || me.name} color={me.avatarColor} url={me.avatarUrl} size={30} />
          </Link>
        </div>
      </header>

      {/* Menu mobile (slide-out overlay) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/45 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 330, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border2 bg-bg2 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border p-5">
                <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                  <Logo />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface2 hover:text-text"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Todos os recursos">
                {MOBILE_NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="mb-1.5 px-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-faint">{group.label}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map((item) => {
                        const active = isActive(pathname, item.href, item.exact);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex min-h-11 items-center gap-2.5 rounded-xl border px-3 text-[12px] font-semibold transition-colors",
                              active
                                ? "border-text bg-text text-bg"
                                : "border-border bg-surface text-muted hover:bg-surface2 hover:text-text"
                            )}
                          >
                            <span className="relative shrink-0">
                              <item.icon size={17} />
                              {item.badge && <UnreadBadge count={unread} />}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Link
                  href="/app/novo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="sheen mt-3 flex h-9 items-center justify-center gap-2 rounded-lg bg-text text-[13px] font-semibold text-bg transition-colors hover:bg-accent"
                >
                  <PenLine size={15} /> Escrever
                </Link>
              </nav>

              <IndicadorCasal usuario={me} />

              <div className="flex items-center gap-3 border-t border-border p-3">
                <Avatar name={me.displayName || me.name} color={me.avatarColor} url={me.avatarUrl} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text">{me.displayName || me.name}</div>
                  <div className="truncate text-[11px] text-faint">{me.email}</div>
                </div>
                <button onClick={logout} title="Sair" aria-label="Sair" className="rounded-lg p-2 text-faint transition-colors hover:bg-surface2 hover:text-danger">
                  <LogOut size={17} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.main
        key={pathname}
        // Só `opacity` aqui, de propósito. `filter` e `transform` criam um
        // containing block para descendentes `position: fixed` — o que prendia
        // a Retrospectiva (fixed inset-0) à caixa do <main> em vez da viewport,
        // e desalinhava o menu do CartaoMemoria. `opacity` não tem esse efeito.
        // Quem quiser um "sobe e aparece" deve animar o conteúdo da página,
        // não este wrapper compartilhado.
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.base, ease: EASE_OUT }}
        className={cn(
          "mx-auto w-full px-4 pb-28 pt-4 lg:pb-12 lg:pt-8",
          contentWidth(pathname)
        )}
      >
        {children}
      </motion.main>

      {/* Segredos do parceiro — modal app-wide */}
      <SecretReveal coupled={!!me.partner} />

      {/* ── Nav inferior (mobile) ───────────────────────────────────────────
          78px com um vão de 52px no centro para o botão de escrever. */}
      <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex h-[78px] max-w-md items-center px-2">
          <TabLink href="/app" label="Início" icon={Home} exact pathname={pathname} />
          <TabLink href="/app/jogos" label="Jogos" icon={Joystick} pathname={pathname} />
          <motion.div whileTap={{ scale: 0.9 }} whileHover={{ y: -2 }} className="-mt-7 w-[52px] shrink-0">
            <Link
              href="/app/novo"
              className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-text text-bg transition-colors hover:bg-accent"
              aria-label="Escrever"
            >
              {/* halo pulsante discreto, chamando para a ação principal */}
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-accent/30"
                animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
              <PenLine size={21} className="relative" />
            </Link>
          </motion.div>
          <TabLink href="/app/conversa" label="Conversa" icon={MessagesSquare} pathname={pathname} badge={unread} />
          <TabLink href="/app/tarefas" label="Tarefas" icon={ListTodo} pathname={pathname} />
        </div>
      </nav>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  exact,
  pathname,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
  pathname: string;
  badge?: number;
}) {
  const active = isActive(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
        active ? "text-text" : "text-faint hover:text-muted"
      )}
    >
      {/* A lasca de carmim desliza entre as abas — o mesmo elemento é
          compartilhado. Fica num wrapper centralizado porque o framer escreve
          `transform` inline durante o layout e atropelaria um `-translate-x-1/2`. */}
      {active && (
        <span className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <motion.span
            layoutId="tab-rule"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="h-[2px] w-4 bg-accent"
          />
        </span>
      )}
      <motion.span
        className="relative"
        animate={{ scale: active ? 1.06 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon size={21} />
        <UnreadBadge count={badge} />
      </motion.span>
      <span className="text-[9.5px] font-bold leading-none">{label}</span>
    </Link>
  );
}
