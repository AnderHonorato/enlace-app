"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { NavegacaoInferior } from "./estrutura/NavegacaoInferior";

const NAV = [
  { href: "/app", label: "Linha do tempo", icon: Home, exact: true },
  { href: "/app/nos", label: "Nós", icon: HeartHandshake },
  { href: "/app/bichinho", label: "Bichinho", icon: Egg },
  { href: "/app/conversa", label: "Conversa", icon: MessagesSquare, badge: true },
  { href: "/app/jogos", label: "Jogos", icon: Joystick },
  { href: "/app/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/app/album", label: "Momentos", icon: Images },
  { href: "/app/mapa", label: "Mapa e viagens", icon: Map },
  { href: "/app/ao-vivo", label: "Ao vivo", icon: Satellite },
  { href: "/app/planos", label: "Planos", icon: ClipboardList },
  { href: "/app/livro", label: "Nosso livro", icon: BookHeart },
  { href: "/app/radio", label: "Rádio do casal", icon: Radio },
  { href: "/app/trofeus", label: "Troféus", icon: Trophy },
  { href: "/app/retrospectiva", label: "Retrospectiva", icon: Wand2 },
  { href: "/app/personagens", label: "IA do casal", icon: Sparkles },
  { href: "/app/config", label: "Nosso perfil", icon: Settings },
];

const CONFIG_HREF = "/app/config";

function itens(...hrefs: string[]) {
  return NAV.filter((item) => hrefs.includes(item.href));
}

/** Os recursos deixam de competir todos no mesmo nível e passam a contar a
 * história do produto em quatro pilares, como na identidade visual. */
const NAV_GROUPS = [
  {
    label: "Nossa história",
    items: itens("/app", "/app/album", "/app/livro", "/app/retrospectiva"),
  },
  {
    label: "Nosso agora",
    items: itens("/app/conversa", "/app/ao-vivo", "/app/tarefas"),
  },
  {
    label: "Nosso mundo",
    items: itens("/app/planos", "/app/mapa", "/app/jogos", "/app/radio", "/app/trofeus", "/app/bichinho"),
  },
  {
    label: "Nós dois",
    items: itens("/app/nos", "/app/personagens"),
  },
];

const MOBILE_NAV_GROUPS = [
  ...NAV_GROUPS,
  { label: "Conta", items: itens(CONFIG_HREF) },
];

function hoje() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

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

function contentWidth(pathname: string) {
  const wide = ["/app/album", "/app/mapa", "/app/jogos", "/app/tarefas", "/app/planos", "/app/config", "/app/trofeus"];
  return wide.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")) ? "max-w-6xl" : "max-w-2xl";
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function UnreadDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="anim-new absolute -right-1 -top-0.5 h-[7px] w-[7px] rounded-full bg-accent" />;
}

function ActiveShard() {
  return <span className="absolute -left-[3px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />;
}

export function EstruturaAplicativo({ me, unread: initialUnread = 0, children }: { me: Me; unread?: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduzirMovimento = useReducedMotion();
  const [unread, setUnread] = useState(initialUnread);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopViewport, setDesktopViewport] = useState<boolean | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [dataDeHoje, setDataDeHoje] = useState("");
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const focoAnteriorRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const inChat = pathname === "/app/conversa";
  const configActive = isActive(pathname, CONFIG_HREF);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktopViewport(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

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

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType?.includes("2g")) return;
    const warm = () => ["/app/novo", "/app/album", "/app/personagens"].forEach((href) => router.prefetch(href));
    const id = window.setTimeout(warm, 1_400);
    return () => window.clearTimeout(id);
  }, [router]);

  useEffect(() => {
    if (!navigating) return;
    const id = window.setTimeout(() => setNavigating(false), 8_000);
    return () => window.clearTimeout(id);
  }, [navigating]);

  useEffect(() => {
    setDataDeHoje(hoje());
  }, []);

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

  // Drawer acessível: prende o foco, fecha com Escape e devolve o foco ao
  // controle anterior. O conteúdo atrás também deixa de rolar enquanto aberto.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    focoAnteriorRef.current = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeMenuRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focaveis = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")
      ).filter((el) => !el.hasAttribute("disabled"));
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
      focoAnteriorRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-dvh lg:pl-56">
      {navigating && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[260] h-0.5 overflow-hidden bg-accent/15" role="status" aria-label="Abrindo página">
          <motion.span
            className="block h-full bg-accent"
            initial={reduzirMovimento ? false : { width: "8%", x: "-100%" }}
            animate={{ width: reduzirMovimento ? "100%" : "78%", x: reduzirMovimento ? 0 : "28%" }}
            transition={{ duration: reduzirMovimento ? 0 : 1.2, ease: EASE_OUT }}
          />
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border2 bg-[rgb(var(--brand-navy))] text-[rgb(var(--brand-cream))] lg:flex">
        <div className="flex h-[62px] shrink-0 items-center border-b border-white/10 px-5">
          <Link href="/app" aria-label="Linha do tempo" className="anim-pop inline-flex [&_.text-text]:text-[rgb(var(--brand-cream))]">
            <Logo size={28} />
          </Link>
        </div>

        <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-3 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/45">{group.label}</div>
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
                        "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors",
                        active
                          ? "bg-[rgb(var(--brand-cream))] text-[rgb(var(--brand-navy))]"
                          : "text-white/65 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      {active && <ActiveShard />}
                      <span className="relative shrink-0">
                        <item.icon size={17} aria-hidden />
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

        <div className="shrink-0 border-t border-white/10 p-3">
          <Link
            href={CONFIG_HREF}
            aria-current={configActive ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center gap-2.5 rounded-xl px-2.5 transition-colors",
              configActive ? "bg-white/12" : "hover:bg-white/8"
            )}
          >
            <Avatar name={me.displayName || me.name} color={me.avatarColor} url={me.avatarUrl} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{me.displayName || me.name}</span>
              <span className="block truncate text-[10px] text-white/45">Nosso perfil</span>
            </span>
            <Settings size={16} aria-hidden />
          </Link>
          <button
            onClick={logout}
            className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-white/45 transition-colors hover:bg-white/8 hover:text-white"
          >
            <LogOut size={16} aria-hidden /> Sair
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 hidden h-[62px] items-center gap-4 border-b border-border bg-bg/88 px-6 backdrop-blur-[8px] lg:flex">
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            <Search size={15} aria-hidden /> Buscar
          </Link>
          <Link
            href="/app/novo"
            className="sheen inline-flex min-h-11 items-center gap-2 rounded-xl bg-[rgb(var(--brand-navy))] px-[18px] text-[13px] font-semibold text-[rgb(var(--brand-cream))] transition-colors hover:bg-accent"
          >
            <PenLine size={15} aria-hidden /> Registrar momento
          </Link>
        </div>
      </header>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/92 px-3 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] backdrop-blur-[10px] lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface2 hover:text-text"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="menu-mobile-enlace"
          >
            {mobileMenuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
          <Link href="/app" aria-label="Linha do tempo do Enlace" className="min-h-11 inline-flex items-center">
            <Logo size={24} />
          </Link>
        </div>

        {desktopViewport === false && <FaixaRadioCabecalho me={me} variant="mobile" />}

        <div className="flex items-center gap-0.5">
          <Link
            href="/app/ao-vivo"
            aria-label="Ao vivo"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface2 hover:text-text"
          >
            <Satellite size={19} aria-hidden />
          </Link>
          <Link
            href="/app/album"
            aria-label="Momentos"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface2 hover:text-text"
          >
            <Images size={19} aria-hidden />
          </Link>
          {desktopViewport === false && <NotificationsPanel compact />}
          {!me.partner && (
            <Link
              href="/app/config"
              aria-label="Conectar casal"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accentInk"
            >
              <Link2 size={17} aria-hidden />
            </Link>
          )}
          <Link href="/app/config" aria-label="Nosso perfil" className="ml-0.5 flex h-11 w-11 items-center justify-center rounded-full">
            <Avatar name={me.displayName || me.name} color={me.avatarColor} url={me.avatarUrl} size={30} />
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={reduzirMovimento ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduzirMovimento ? undefined : { opacity: 0 }}
              transition={{ duration: reduzirMovimento ? 0 : 0.2 }}
              className="fixed inset-0 z-40 bg-[rgb(var(--brand-navy)/.58)] backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <motion.aside
              ref={drawerRef}
              id="menu-mobile-enlace"
              role="dialog"
              aria-modal="true"
              aria-label="Todos os recursos do Enlace"
              initial={reduzirMovimento ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduzirMovimento ? undefined : { x: "-100%" }}
              transition={reduzirMovimento ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(84vw,19rem)] flex-col border-r border-white/10 bg-[rgb(var(--brand-navy))] text-[rgb(var(--brand-cream))] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <Link href="/app" onClick={() => setMobileMenuOpen(false)} aria-label="Linha do tempo" className="[&_.text-text]:text-[rgb(var(--brand-cream))]">
                  <Logo />
                </Link>
                <button
                  ref={closeMenuRef}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white/65 transition-colors hover:bg-white/8 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X size={20} aria-hidden />
                </button>
              </div>

              <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Todos os recursos">
                {MOBILE_NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="mb-1.5 px-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/42">{group.label}</div>
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
                              "relative flex min-h-12 items-center gap-2.5 rounded-xl border px-3 text-[12px] font-semibold transition-colors",
                              active
                                ? "border-white/25 bg-[rgb(var(--brand-cream))] text-[rgb(var(--brand-navy))]"
                                : "border-white/10 bg-white/[.035] text-white/65 hover:bg-white/8 hover:text-white"
                            )}
                          >
                            <span className="relative shrink-0">
                              <item.icon size={17} aria-hidden />
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
                  className="sheen mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[rgb(var(--brand-cream))] text-[13px] font-semibold text-[rgb(var(--brand-navy))] transition-colors hover:bg-[rgb(var(--brand-blush))]"
                >
                  <PenLine size={16} aria-hidden /> Registrar momento
                </Link>
              </nav>

              <IndicadorCasal usuario={me} />

              <div className="flex items-center gap-3 border-t border-white/10 p-3">
                <Avatar name={me.displayName || me.name} color={me.avatarColor} url={me.avatarUrl} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{me.displayName || me.name}</div>
                  <div className="truncate text-[11px] text-white/45">{me.email}</div>
                </div>
                <button
                  onClick={logout}
                  aria-label="Sair"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white/45 transition-colors hover:bg-white/8 hover:text-white"
                >
                  <LogOut size={17} aria-hidden />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.main
        key={pathname}
        initial={reduzirMovimento ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduzirMovimento ? 0 : duration.base, ease: EASE_OUT }}
        className={cn("mx-auto w-full px-4 pb-28 pt-4 lg:pb-12 lg:pt-8", contentWidth(pathname))}
      >
        {children}
      </motion.main>

      <SecretReveal coupled={!!me.partner} />
      <NavegacaoInferior pathname={pathname} usuario={me} />
    </div>
  );
}
