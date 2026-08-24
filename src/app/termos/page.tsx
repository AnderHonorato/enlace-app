import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { BRAND } from "@/nucleo/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: `Termos de Uso · ${BRAND}` };

export default async function TermosPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[68ch] px-5 py-10 md:py-14">
      {!user && (
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted transition hover:text-text">
          <ArrowLeft size={15} /> Voltar
        </Link>
      )}

      <p className="kicker">Documento legal</p>
      <h1 className="display mt-2 text-[30px] text-text">Termos de Uso</h1>
      <p className="mt-2 text-[12.5px] text-faint">Última atualização: julho de 2026</p>

      <div className="mt-10">
        <section>
          <h2 className="font-display text-[18px] text-text">1. Aceitação</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Ao usar o Enlace, você concorda com estes termos. Se não concordar, não utilize o serviço.
            Reservamos o direito de alterar estes termos a qualquer momento, com aviso prévio aos usuários.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">2. Uso do serviço</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            O Enlace é um diário digital para casais. Você é responsável por todo o conteúdo que publicar.
            Não é permitido: publicar conteúdo ilegal, ofensivo, difamatório, pornográfico ou que viole
            direitos de terceiros. Reservamo-nos o direito de suspender contas que violem estas regras.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">3. Conta</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Você é responsável por manter a confidencialidade da sua senha. Qualquer atividade realizada
            através da sua conta é de sua responsabilidade. Recomendamos o uso do PIN de bloqueio no
            aplicativo para maior segurança.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">4. Conteúdo</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Você mantém todos os direitos sobre o conteúdo que criar no Enlace. Ao publicar, você nos concede
            uma licença para armazenar, exibir e processar esse conteúdo exclusivamente para fornecer o
            serviço a você e ao seu parceiro(a) conectado.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">5. Disponibilidade</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Nos esforçamos para manter o serviço disponível 24 horas por dia, mas não garantimos
            disponibilidade ininterrupta. Podemos realizar manutenções programadas que causem
            indisponibilidade temporária.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">6. Limitação de responsabilidade</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            O Enlace é fornecido &quot;como está&quot;. Não nos responsabilizamos por perda de dados,
            interrupções de serviço ou danos decorrentes do uso da plataforma. Recomendamos que você
            faça backups periódicos usando a função de exportação de dados.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">7. Contato</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Para questões sobre estes termos, entre em contato pelo e-mail{" "}
            <a href="mailto:contato@enlace.app" className="text-accentInk underline">
              contato@enlace.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
