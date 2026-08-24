// Sanitizador de HTML sem dependências (roda no servidor).
// Mantém apenas um subconjunto seguro de tags do editor de texto rico.

const ALLOWED = new Set([
  "b", "strong", "i", "em", "u", "s", "strike", "br", "p", "div",
  "h3", "blockquote", "ul", "ol", "li", "a", "span",
]);

function escapeAttr(v: string) {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractHref(attrs: string): string | null {
  const m = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
  const href = (m?.[2] ?? m?.[3] ?? "").trim();
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href;
  return null;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let s = input;
  // remove blocos perigosos e comentários
  s = s.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // O editor rico insere &nbsp; para segurar espaços. Guardar isso no banco
  // faz a entidade aparecer crua quando o texto é exibido como texto puro
  // (memória sem nenhuma tag). Espaço normal resolve e não muda o visual.
  s = s.replace(/&nbsp;|&#160;|&#xa0;/gi, " ");
  // processa cada tag
  s = s.replace(/<(\/?)([a-zA-Z0-9]+)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (_m, slash, tag, attrs) => {
    const name = String(tag).toLowerCase();
    if (!ALLOWED.has(name)) return "";
    if (slash === "/") return `</${name}>`;
    if (name === "a") {
      const href = extractHref(attrs);
      return href
        ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer nofollow">`
        : "<a>";
    }
    return `<${name}>`;
  });
  // remove qualquer "<" solto que não formou tag
  s = s.replace(/<(?![a-zA-Z/])/g, "&lt;");
  return s.trim().slice(0, 30000);
}

const HTML_TAG = /<(b|strong|i|em|u|s|strike|br|p|div|h3|blockquote|ul|ol|li|a|span)\b/i;

export function looksLikeHtml(s: string): boolean {
  return HTML_TAG.test(s);
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  atilde: "ã", otilde: "õ", ccedil: "ç", acirc: "â", ecirc: "ê", ocirc: "ô",
  agrave: "à",
};

/**
 * Decodifica entidades HTML para exibir como texto puro.
 *
 * `&amp;` fica por último de propósito: decodificá-lo antes transformaria
 * `&amp;nbsp;` (um "&nbsp;" que o usuário digitou literalmente) em espaço,
 * corrompendo o texto dele.
 */
export function decodeEntities(s: string): string {
  if (!s) return "";
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[String(name).toLowerCase()] ?? m)
    .replace(/&amp;/gi, "&");
}

function safeChar(code: number): string {
  // Ignora códigos inválidos/de controle em vez de gerar caractere quebrado.
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  const ch = String.fromCodePoint(code);
  return ch === " " ? " " : ch;
}

// Texto puro para análises/prévia (remove tags e decodifica entidades).
export function toPlain(s: string): string {
  if (!s) return "";
  return decodeEntities(
    s
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h3|blockquote|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim();
}
