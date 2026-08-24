import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // tokens semânticos ligados a variáveis CSS (troca de tema via [data-theme])
        bg: "rgb(var(--bg) / <alpha-value>)",
        bg2: "rgb(var(--bg-2) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        border2: "rgb(var(--border-2) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--text-2) / <alpha-value>)",
        faint: "rgb(var(--text-3) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent-2) / <alpha-value>)",
        // Carmim fechado: a versão do acento que aguenta tamanho de corpo
        // sobre papel. `text-accent` puro só a partir de ~18px ou em ícone.
        accentInk: "rgb(var(--accent-ink) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        // Ouro para favorito/destaque/lendário. Separado de `warning` porque
        // aviso e celebração não são a mesma coisa — ver globals.css.
        gold: "rgb(var(--gold) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      // ── Escala editorial de bordas ──────────────────────────────────────
      // Papel impresso pede cantos discretos: a escala usa 2–6px. Como os usos
      // de `rounded-*` espalhados pelos componentes apontam para estes
      // tokens, remapeá-los aqui re-veste o app inteiro de uma vez, sem
      // tocar em componente nenhum. `rounded-full` fica como está — avatares
      // e pílulas continuam redondos.
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "2px",
        lg: "3px",
        xl: "4px",
        "2xl": "5px",
        "3xl": "6px",
      },
      boxShadow: {
        // Papel sobre papel: uma linha de contato e uma sombra longa e
        // rasante. Nada de brilho — `glow` virou sinônimo de `card` só para
        // não quebrar os usos existentes.
        soft: "0 1px 0 rgb(var(--shadow-color) / 0.03)",
        card: "0 1px 0 rgb(var(--shadow-color) / 0.03), 0 22px 40px -30px rgb(var(--shadow-color) / 0.5)",
        lift: "0 18px 32px -26px rgb(var(--shadow-color) / 0.55)",
        glow: "0 1px 0 rgb(var(--shadow-color) / 0.03), 0 22px 40px -30px rgb(var(--shadow-color) / 0.5)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-heart": {
          "0%,100%": { transform: "scale(1)" },
          "22%": { transform: "scale(1.4)" },
          "42%": { transform: "scale(0.93)" },
          "68%": { transform: "scale(1.12)" },
        },
        gradient: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "rise-s": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        flame: {
          "0%,100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-2px) scale(1.07)" },
        },
        halo: {
          "0%": { transform: "scale(0.6)", opacity: "0.5" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        newpulse: {
          "0%,100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.45)", opacity: "0.45" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 7s ease-in-out infinite",
        "pulse-heart": "pulse-heart 0.6s ease",
        gradient: "gradient 8s ease infinite",
        rise: "rise 0.8s cubic-bezier(0.22,1,0.36,1) both",
        "rise-s": "rise-s 0.45s cubic-bezier(0.22,1,0.36,1) both",
        flame: "flame 2.6s ease-in-out infinite",
        halo: "halo 0.7s ease-out both",
        newpulse: "newpulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
