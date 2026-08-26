// Compatibilidade com o editor atual. A API canônica continua em /api/entries.
// Mantemos este alias para não quebrar clientes/rascunhos antigos enquanto a
// interface é migrada por completo para os nomes internos em português.
export { GET, POST } from "../entries/route";
