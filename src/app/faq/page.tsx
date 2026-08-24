import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { BRAND } from "@/nucleo/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: `FAQ · ${BRAND}` };

const FAQS = [
  {
    q: "O que é o Enlace?",
    a: "O Enlace é um diário digital para casais. Vocês escrevem memórias, tiram fotos, colecionam momentos e recebem resumos personalizados feitos por inteligência artificial sobre o relacionamento de vocês.",
  },
  {
    q: "Preciso pagar alguma coisa?",
    a: "Não. O Enlace é completamente gratuito. Todas as funcionalidades — diário, chat, retrospectiva, álbum, mapa, personagens de IA, resumos do amor — estão disponíveis sem qualquer custo.",
  },
  {
    q: "Como conecto com meu amor?",
    a: "Vá em Configurações > Nosso relacionamento. Você pode criar um código de convite e compartilhar com seu parceiro(a). Quando a pessoa usar o código, vocês estarão conectados e poderão ver as memórias um do outro.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. O Enlace é otimizado para funcionar em qualquer dispositivo: Android, iPhone, tablet e computador. Você pode até instalar como um aplicativo na tela inicial do celular.",
  },
  {
    q: "Minhas memórias são privadas?",
    a: "Sim. Suas memórias privadas só você vê. As compartilhadas ficam visíveis apenas para seu parceiro(a). Ninguém mais tem acesso. Não aparecemos em buscas e seus dados são criptografados.",
  },
  {
    q: "Posso escrever memórias com datas do passado?",
    a: "Pode sim. Ao criar uma memória, você escolhe a data que quiser. Assim dá para registrar momentos que aconteceram antes de vocês usarem o Enlace, mantendo a linha do tempo completa.",
  },
  {
    q: "Como funciona o resumo do amor?",
    a: "A inteligência artificial lê as memórias recentes de vocês e escreve um resumo no estilo horóscopo do amor: como o relacionamento está, o que merece atenção e uma dica prática para o dia. Você pode gerar resumos diários, semanais ou mensais.",
  },
  {
    q: "O que é a retrospectiva?",
    a: "É uma experiência animada em tela cheia que relembra os melhores momentos do seu semestre. Fotos, estatísticas, linha do tempo, quiz e muito mais — no estilo Wrapped do Spotify. Dá até para gravar um vídeo e compartilhar.",
  },
  {
    q: "Posso exportar minhas memórias?",
    a: "Sim. Nas configurações você pode exportar todos os seus dados. O livro do casal também permite salvar como PDF para imprimir ou guardar.",
  },
  {
    q: "Como excluo minha conta?",
    a: "Vá em Configurações, role até o final e clique em 'Excluir conta'. Lembre-se de que essa ação é irreversível e apaga todas as suas memórias.",
  },
];

const CATEGORIAS = [
  { key: "sobre", label: "Sobre" },
  { key: "criar", label: "Como criar" },
  { key: "funcionalidades", label: "Funcionalidades" },
  { key: "privacidade", label: "Privacidade" },
];

export default async function FaqPage() {
  const user = await getCurrentUser();
  const logado = !!user;

  return (
    <div className="mx-auto max-w-[68ch] px-5 py-10 md:py-14">
      {!logado && (
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Voltar
          </Link>
          <Link href="/entrar" className="text-[13px] font-semibold text-accentInk transition hover:underline">
            Entrar
          </Link>
        </header>
      )}

      <div className="mb-10 text-center">
        <p className="kicker">Central de ajuda</p>
        <h1 className="display mt-2 text-[34px] text-text">Dúvidas frequentes</h1>
        <p className="mt-2 text-[14px] text-muted">Tudo o que você precisa saber sobre o Enlace.</p>
      </div>

      {/* Busca (decorativa) */}
      <div className="mb-7">
        <input
          type="text"
          placeholder="Buscar por dúvidas..."
          className="h-[42px] w-full rounded-lg border border-border2 bg-surface px-4 text-[13.5px] text-text placeholder:text-faint focus:outline-none"
        />
      </div>

      {/* Categorias */}
      <div className="mb-10 flex flex-wrap gap-2">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.key}
            className="tag tag-off transition hover:border-accent hover:text-accentInk"
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rule mb-2" />

      {/* Perguntas */}
      <div className="divide-y divide-border">
        {FAQS.map((faq, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer items-start justify-between gap-4 font-display text-[17px] text-text group-open:text-accentInk">
              {faq.q}
              <span className="mt-0.5 shrink-0 text-lg leading-none text-faint transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[14.5px] leading-[1.72] text-muted">{faq.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-accent/25 bg-accent/[0.06] p-6 text-center">
        <p className="font-semibold text-text">Não encontrou o que procurava?</p>
        <p className="mt-1 text-[13.5px] text-muted">
          Entre em contato pelo nosso{" "}
          <Link href="/contato" className="font-semibold text-accentInk underline">
            formulário de suporte
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
