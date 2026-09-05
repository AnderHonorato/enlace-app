export type PontoTrajeto = {
  id: string;
  lat: number;
  lng: number;
  registradoEm: string;
};

export type ParadaTrajeto = {
  lat: number;
  lng: number;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  quantidadePontos: number;
};

const RAIO_TERRA_METROS = 6_371_000;

export function distanciaEmMetros(
  primeiro: Pick<PontoTrajeto, "lat" | "lng">,
  segundo: Pick<PontoTrajeto, "lat" | "lng">,
) {
  const rad = (valor: number) => (valor * Math.PI) / 180;
  const dLat = rad(segundo.lat - primeiro.lat);
  const dLng = rad(segundo.lng - primeiro.lng);
  const lat1 = rad(primeiro.lat);
  const lat2 = rad(segundo.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(a));
}

/**
 * Agrupa amostras consecutivas próximas. Uma parada só é exibida quando a
 * pessoa ficou dentro do mesmo raio por pelo menos dois minutos.
 */
export function detectarParadas(
  pontos: PontoTrajeto[],
  raioMetros = 50,
  duracaoMinimaSegundos = 120,
): ParadaTrajeto[] {
  if (pontos.length < 2) return [];

  const ordenados = [...pontos].sort(
    (a, b) => new Date(a.registradoEm).getTime() - new Date(b.registradoEm).getTime(),
  );
  const paradas: ParadaTrajeto[] = [];
  let inicio = 0;
  let somaLat = ordenados[0].lat;
  let somaLng = ordenados[0].lng;

  const concluirGrupo = (fim: number) => {
    if (fim <= inicio) return;
    const grupo = ordenados.slice(inicio, fim + 1);
    const inicioMs = new Date(grupo[0].registradoEm).getTime();
    const fimMs = new Date(grupo.at(-1)!.registradoEm).getTime();
    const duracaoSegundos = Math.max(0, Math.round((fimMs - inicioMs) / 1000));
    if (duracaoSegundos < duracaoMinimaSegundos) return;

    paradas.push({
      lat: grupo.reduce((soma, ponto) => soma + ponto.lat, 0) / grupo.length,
      lng: grupo.reduce((soma, ponto) => soma + ponto.lng, 0) / grupo.length,
      inicio: grupo[0].registradoEm,
      fim: grupo.at(-1)!.registradoEm,
      duracaoSegundos,
      quantidadePontos: grupo.length,
    });
  };

  for (let indice = 1; indice < ordenados.length; indice += 1) {
    const centroAtual = {
      lat: somaLat / (indice - inicio),
      lng: somaLng / (indice - inicio),
    };

    if (distanciaEmMetros(centroAtual, ordenados[indice]) > raioMetros) {
      concluirGrupo(indice - 1);
      inicio = indice;
      somaLat = ordenados[indice].lat;
      somaLng = ordenados[indice].lng;
    } else {
      somaLat += ordenados[indice].lat;
      somaLng += ordenados[indice].lng;
    }
  }

  concluirGrupo(ordenados.length - 1);
  return paradas;
}
