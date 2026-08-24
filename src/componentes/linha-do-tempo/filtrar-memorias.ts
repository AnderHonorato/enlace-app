import { toPlain } from "@/nucleo/sanitizacao";
import type { EntryDTO } from "@/nucleo/memorias";

type FiltrosMemorias = {
  consulta: string;
  humor: string;
  etiqueta: string;
  somenteFavoritas: boolean;
  ordem: "asc" | "desc";
};

export function filtrarMemorias(memorias: EntryDTO[], filtros: FiltrosMemorias) {
  const consulta = filtros.consulta.trim().toLowerCase();
  const filtradas = memorias.filter((memoria) => {
    if (filtros.somenteFavoritas && !memoria.favorite) return false;
    if (filtros.humor && memoria.mood !== filtros.humor) return false;
    if (filtros.etiqueta && !memoria.tags.includes(filtros.etiqueta)) return false;
    if (!consulta) return true;
    const texto = `${memoria.title ?? ""} ${toPlain(memoria.content)} ${memoria.place ?? ""} ${memoria.tags.join(" ")}`.toLowerCase();
    return texto.includes(consulta);
  });

  return filtradas.sort((a, b) => {
    const diferenca = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    return filtros.ordem === "asc" ? diferenca : -diferenca;
  });
}
