import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { BRAND } from "@/nucleo/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: `Contato · ${BRAND}` };

export default async function ContatoPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[68ch] px-5 py-10 md:py-14">
      {!user && (
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted transition hover:text-text">
          <ArrowLeft size={15} /> Voltar
        </Link>
      )}

      <div className="mb-10">
        <p className="kicker">Fale com a gente</p>
        <h1 className="display mt-2 text-[30px] text-text">Entre em contato</h1>
        <p className="mt-2 text-[14px] leading-[1.72] text-muted">
          Tem dúvidas, sugestões ou encontrou algum problema? Fale com a gente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:contato@enlace.app"
          className="card flex flex-col items-center gap-3 p-6 text-center transition hover:border-accent/40"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Send size={20} />
          </span>
          <div>
            <div className="font-semibold text-text">E-mail</div>
            <div className="text-[13px] text-muted">contato@enlace.app</div>
          </div>
          <span className="text-[12px] font-semibold text-accentInk">Respondemos em até 24h úteis</span>
        </a>

        <Link
          href="/faq"
          className="card flex flex-col items-center gap-3 p-6 text-center transition hover:border-accent/40"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <span className="display text-xl leading-none">?</span>
          </span>
          <div>
            <div className="font-semibold text-text">Central de ajuda</div>
            <div className="text-[13px] text-muted">Dúvidas frequentes</div>
          </div>
          <span className="text-[12px] font-semibold text-accentInk">Respostas rápidas</span>
        </Link>
      </div>

      <div className="rule my-10" />

      <div>
        <p className="kicker">Horário</p>
        <h2 className="mt-2 font-display text-[17px] text-text">Horário de atendimento</h2>
        <p className="mt-2 text-[14px] leading-[1.72] text-muted">
          Nosso suporte funciona de segunda a sexta, das 9h às 18h (horário de Brasília).
          Fins de semana e feriados podem ter tempo de resposta maior.
        </p>
      </div>
    </div>
  );
}
