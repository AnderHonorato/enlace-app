import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "../estilos/tokens-papel.css";
import "../estilos/molduras-editorial.css";
import "../estilos/movimento-conteudo.css";
import "../estilos/jogos-retrospectiva.css";
import "./splash.css";
import { ServiceWorker } from "@/componentes/RegistroServiceWorker";
import { ThemeWatcher } from "@/componentes/ObservadorTema";
import { BackgroundPhoto } from "@/componentes/FotoFundo";
import { TelaAbertura } from "@/componentes/TelaAbertura";
import { MotionProvider } from "@/componentes/Movimento";
import { BRAND, TAGLINE, DESCRIPTION } from "@/nucleo/marca";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND} — o diário de um casal`,
  description: DESCRIPTION,
  applicationName: BRAND,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: BRAND, statusBarStyle: "black-translucent" },
  openGraph: {
    title: `${BRAND} — o diário de um casal`,
    description: TAGLINE,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F1E8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Resolve e aplica o tema antes da pintura (evita flash).
//
// As listas abaixo preservam preferências de instalações antigas, que podem
// ter 'aurora' / 'claro' / 'violet' gravados no localStorage. Essas chaves
// não têm mais [data-theme] correspondente no CSS. Sem a validação o <html>
// receberia um tema inexistente e cairia no :root — que por acaso é o papel
// claro, então o modo escuro simplesmente não funcionaria. Manter em sincronia
// com src/nucleo/themes.ts.
const themeInit = `(function(){try{
  var LIGHT=['papel','sepia','alvo'], DARK=['tinta','nanquim'];
  var ACC=['carmim','rose','coral','gold','teal','sky','tinta'];
  var pick=function(v,list,def){return list.indexOf(v)>=0?v:def;};
  var m=localStorage.getItem('enlace-mode')||'auto';
  if(['auto','light','dark'].indexOf(m)<0) m='auto';
  var l=pick(localStorage.getItem('enlace-light'),LIGHT,'papel');
  var d=pick(localStorage.getItem('enlace-dark'),DARK,'tinta');
  var a=pick(localStorage.getItem('enlace-accent'),ACC,'carmim');
  var isDark = m==='dark' || (m==='auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var theme = (m==='light')?l:(isDark?d:l);
  var el=document.documentElement;
  el.setAttribute('data-theme',theme);
  el.setAttribute('data-accent',a);
  var bg=localStorage.getItem('enlace-bg-image');
  if(bg){document.body.style.backgroundImage='url('+bg+')';document.body.style.backgroundSize='cover';document.body.style.backgroundPosition='center';document.body.style.backgroundAttachment='fixed';document.body.classList.add('has-bg-photo');}
}catch(e){}})();`;

// Evita o flash da splash depois do primeiro acesso neste navegador: se a
// instalação já viu a animação, marca o <html> antes da primeira pintura para que o CSS
// (splash.css) esconda o overlay de cara — o mesmo truque do themeInit acima.
const splashInit = `(function(){try{
  if(localStorage.getItem('enlace-splash')==='1'||localStorage.getItem('enlace-splash-v2')==='1'){document.documentElement.setAttribute('data-splash-seen','1');}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="papel" data-accent="carmim" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script dangerouslySetInnerHTML={{ __html: splashInit }} />
      </head>
      <body className={`${display.variable} ${body.variable} font-body`} suppressHydrationWarning>
        <div className="ambient-bg" aria-hidden />
        <TelaAbertura />
        <MotionProvider>{children}</MotionProvider>
        <ThemeWatcher />
        <BackgroundPhoto />
        <ServiceWorker />
      </body>
    </html>
  );
}
