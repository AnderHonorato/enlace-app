import test from "node:test";
import assert from "node:assert/strict";
import { detectarParadas, distanciaEmMetros } from "../src/nucleo/trajeto-localizacao";

test("calcula distância aproximada entre coordenadas", () => {
  const metros = distanciaEmMetros(
    { lat: -23.55052, lng: -46.63331 },
    { lat: -23.55052, lng: -46.63231 },
  );
  assert.ok(metros > 90 && metros < 120);
});

test("detecta uma parada e calcula sua duração", () => {
  const pontos = [
    { id: "1", lat: -23.55, lng: -46.63, registradoEm: "2026-09-05T12:00:00.000Z" },
    { id: "2", lat: -23.55001, lng: -46.63001, registradoEm: "2026-09-05T12:02:00.000Z" },
    { id: "3", lat: -23.55002, lng: -46.63002, registradoEm: "2026-09-05T12:05:00.000Z" },
    { id: "4", lat: -23.56, lng: -46.64, registradoEm: "2026-09-05T12:06:00.000Z" },
  ];
  const paradas = detectarParadas(pontos);
  assert.equal(paradas.length, 1);
  assert.equal(paradas[0].duracaoSegundos, 300);
  assert.equal(paradas[0].quantidadePontos, 3);
});

test("não chama deslocamento curto de parada", () => {
  const pontos = [
    { id: "1", lat: -23.55, lng: -46.63, registradoEm: "2026-09-05T12:00:00.000Z" },
    { id: "2", lat: -23.55001, lng: -46.63001, registradoEm: "2026-09-05T12:01:00.000Z" },
  ];
  assert.deepEqual(detectarParadas(pontos), []);
});
