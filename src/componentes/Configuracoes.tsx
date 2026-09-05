"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BackgroundPicker } from "./FotoFundo";
import { api } from "@/nucleo/cliente";
import type { Me } from "@/nucleo/usuario-atual";
import { SecaoAparencia } from "./configuracoes/Aparencia";
import { SecaoConta } from "./configuracoes/Conta";
import { SecaoInteligenciaArtificial } from "./configuracoes/InteligenciaArtificial";
import { SecaoNotificacoes } from "./configuracoes/Notificacoes";
import { SecaoPerfil } from "./configuracoes/Perfil";
import { SecaoPrivacidade } from "./configuracoes/Privacidade";
import { SecaoRelacionamento } from "./configuracoes/Relacionamento";

export function Configuracoes({ me }: { me: Me }) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="kicker">Conta e preferências</div>
      <h1 className="font-display -mt-3 text-4xl text-text">Você</h1>
      <SecaoPerfil me={me} />
      <SecaoAparencia me={me} />
      <BackgroundPicker />
      <SecaoRelacionamento me={me} />
      <SecaoNotificacoes />
      <SecaoPrivacidade />
      <SecaoInteligenciaArtificial />
      <button
        onClick={async () => {
          await api("/api/auth/logout", { method: "POST" }).catch(() => {});
          router.replace("/entrar");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 font-medium text-text transition hover:bg-surface2"
      >
        <LogOut size={17} /> Sair da conta
      </button>
      <SecaoConta me={me} />
    </div>
  );
}
