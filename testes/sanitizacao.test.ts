import test from "node:test";
import assert from "node:assert/strict";
import { decodeEntities, sanitizeHtml, toPlain } from "../src/nucleo/sanitizacao";

test("remove scripts e atributos de evento", () => {
  const entrada = '<p onclick="alert(1)">Oi<script>alert(1)</script><strong>amor</strong></p>';
  assert.equal(sanitizeHtml(entrada), "<p>Oi<strong>amor</strong></p>");
});

test("mantém somente links com protocolos permitidos", () => {
  const seguro = sanitizeHtml('<a href="https://example.com">site</a>');
  assert.match(seguro, /href="https:\/\/example\.com"/);
  assert.match(seguro, /rel="noopener noreferrer nofollow"/);

  const perigoso = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
  assert.equal(perigoso, "<a>x</a>");
});

test("remove tags desconhecidas sem perder o texto", () => {
  assert.equal(sanitizeHtml("<section>antes<iframe>fora</iframe>depois</section>"), "antesforadepois");
});

test("converte HTML para texto puro legível", () => {
  const texto = toPlain("<p>Primeira &amp; segunda</p><p>Outra&nbsp;linha</p>");
  assert.equal(texto, "Primeira & segunda\nOutra linha");
});

test("decodifica entidades numéricas com segurança", () => {
  assert.equal(decodeEntities("&#65; &#x42; &hellip;"), "A B …");
  assert.equal(decodeEntities("&#0;"), "");
});
