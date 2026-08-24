import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { BRAND } from "@/nucleo/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: `Privacidade · ${BRAND}` };

export default async function PrivacidadePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[68ch] px-5 py-10 md:py-14">
      {!user && (
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted transition hover:text-text">
          <ArrowLeft size={15} /> Voltar
        </Link>
      )}

      <p className="kicker">Documento legal</p>
      <h1 className="display mt-2 text-[30px] text-text">Política de Privacidade</h1>
      <p className="mt-2 text-[12.5px] text-faint">Última atualização: julho de 2026</p>

      <div className="mt-10">
        <section>
          <h2 className="font-display text-[18px] text-text">1. Informações que coletamos</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Coletamos apenas as informações necessárias para o funcionamento do serviço: nome, e-mail, conteúdo das
            memórias que você escreve, fotos enviadas, preferências de tema e dados de uso anônimos para análise.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">2. Como usamos seus dados</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Seus dados são usados exclusivamente para fornecer o serviço: exibir suas memórias, conectar você com
            seu parceiro(a), gerar resumos com IA e enviar notificações quando configuradas. Não vendemos, alugamos
            ou compartilhamos seus dados com terceiros para fins comerciais.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">3. Chaves de API de IA</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Se você configurar sua própria chave de API (OpenAI, DeepSeek ou Anthropic), ela é armazenada
            criptografada com AES-256-GCM. As requisições para a IA são feitas diretamente dos nossos servidores
            para os provedores, e o conteúdo das suas memórias é enviado apenas para gerar os resumos e
            análises que você solicitar.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">4. Armazenamento</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Seus dados são armazenados em servidores seguros. As imagens enviadas podem ser processadas e
            armazenadas em serviços de nuvem (como Cloudinary) para otimização e entrega eficiente.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">5. Seus direitos</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Você pode acessar, corrigir ou excluir seus dados a qualquer momento pelo painel de configurações.
            A opção de exportar todos os seus dados está disponível em Configurações &gt; Privacidade.
            A exclusão da conta remove permanentemente todos os seus dados.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">6. Cookies</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Utilizamos cookies essenciais para manter sua sessão de login e preferências de tema.
            Também usamos ferramentas de análise como Google Analytics para entender o uso do serviço
            e melhorar a experiência.
          </p>
        </section>

        <div className="rule my-7" />

        <section>
          <h2 className="font-display text-[18px] text-text">7. Contato</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.72] text-muted">
            Para dúvidas sobre esta política, entre em contato pelo e-mail{" "}
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
