"use client";

import Link from "next/link";
import { Images, PenLine, Sparkles, BookHeart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Avatar } from "../Avatar";
import { cn } from "@/nucleo/utilitarios";
import type { Me } from "@/nucleo/usuario-atual";

type Props = {
  pathname: string;
  usuario: Me;
};

function ativo(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function Aba({
  href,
  label,
  pathname,
  exact,
  children,
}: {
  href: string;
  label: string;
  pathname: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const selecionado = ativo(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={selecionado ? "page" : undefined}
      className={cn(
        "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center transition-colors",
        selecionado ? "text-accentInk" : "text-faint hover:text-text"
      )}
    >
      {selecionado && <span className="absolute top-1 h-0.5 w-5 rounded-full bg-accent" aria-hidden />}
      {children}
      <span className="max-w-full truncate text-[9px] font-semibold leading-tight">{label}</span>
    </Link>
  );
}

/** As cinco ações principais do Enlace no celular, seguindo a hierarquia da marca. */
export function NavegacaoInferior({ pathname, usuario }: Props) {
  const reduzirMovimento = useReducedMotion();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-[76px] max-w-md items-center gap-0.5 px-2">
        <Aba href="/app" label="Linha do tempo" pathname={pathname} exact>
          <BookHeart size={21} aria-hidden />
        </Aba>

        <Aba href="/app/album" label="Momentos" pathname={pathname}>
          <Images size={21} aria-hidden />
        </Aba>

        <motion.div
          className="-mt-7 flex w-[58px] shrink-0 justify-center"
          whileTap={reduzirMovimento ? undefined : { scale: 0.94 }}
          whileHover={reduzirMovimento ? undefined : { y: -2 }}
        >
          <Link
            href="/app/novo"
            aria-label="Registrar novo momento"
            className="relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[rgb(var(--brand-blush))] bg-[rgb(var(--brand-navy))] text-[rgb(var(--brand-cream))] shadow-lg transition-transform focus-visible:outline-offset-4"
          >
            {!reduzirMovimento && (
              <motion.span
                aria-hidden
                className="absolute inset-1 rounded-full border border-[rgb(var(--brand-rose)/.55)]"
                animate={{ opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <PenLine size={22} className="relative" aria-hidden />
          </Link>
        </motion.div>

        <Aba href="/app/personagens" label="IA do casal" pathname={pathname}>
          <Sparkles size={21} aria-hidden />
        </Aba>

        <Aba href="/app/config" label="Nosso perfil" pathname={pathname}>
          <span className="rounded-full ring-2 ring-transparent transition-shadow aria-[current=page]:ring-accent">
            <Avatar
              name={usuario.displayName || usuario.name}
              color={usuario.avatarColor}
              url={usuario.avatarUrl}
              size={23}
            />
          </span>
        </Aba>
      </div>
    </nav>
  );
}
