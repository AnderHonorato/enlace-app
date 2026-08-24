/**
 * Gera o catálogo de músicas do jogo "Adivinhe a Música".
 *
 * Roda uma vez (npm run musicas) e grava partes em src/dados/musicas. Não é chamado
 * em tempo de execução de propósito: montar o catálogo são centenas de buscas
 * no iTunes, e isso não pode acontecer enquanto o casal está jogando.
 *
 * Só entra faixa que TEM prévia de 30s — se não dá para ouvir, não serve.
 */
import { lerCatalogoMusical, salvarCatalogoMusical } from "./catalogo-musical.mjs";

const ARTISTAS = [
  // MPB e clássicos
  "Chico Buarque", "Caetano Veloso", "Gilberto Gil", "Milton Nascimento", "Djavan",
  "Elis Regina", "Gal Costa", "Maria Bethânia", "Tom Jobim", "Vinicius de Moraes",
  "Jorge Ben Jor", "Tim Maia", "Cartola", "Paulinho da Viola", "Beth Carvalho",
  "Clara Nunes", "Alcione", "Martinho da Vila", "Nara Leão", "Rita Lee",
  "Marisa Monte", "Adriana Calcanhotto", "Zeca Baleiro", "Lenine", "Chico César",
  "Ney Matogrosso", "Erasmo Carlos", "Roberto Carlos", "Tim Maia", "Wilson Simonal",
  // Rock nacional
  "Legião Urbana", "Cazuza", "Barão Vermelho", "Titãs", "Paralamas do Sucesso",
  "Engenheiros do Hawaii", "Capital Inicial", "Skank", "Jota Quest", "Kid Abelha",
  "Ultraje a Rigor", "Raul Seixas", "Os Mutantes", "Nenhum de Nós", "Biquini Cavadão",
  "Ira!", "Lobão", "Pitty", "CPM 22", "Charlie Brown Jr",
  "O Rappa", "Detonautas", "NX Zero", "Fresno", "Cachorro Grande",
  "Los Hermanos", "Nação Zumbi", "Chico Science", "Raimundos", "Sepultura",
  // Pop e contemporâneo
  "Anitta", "Ivete Sangalo", "Claudia Leitte", "Luan Santana", "Wesley Safadão",
  "Gusttavo Lima", "Jorge e Mateus", "Henrique e Juliano", "Zé Neto e Cristiano", "Marília Mendonça",
  "Maiara e Maraisa", "Simone e Simaria", "Paula Fernandes", "Michel Teló", "Israel e Rodolffo",
  "Matheus e Kauan", "Bruno e Marrone", "Chitãozinho e Xororó", "Leandro e Leonardo", "Zezé Di Camargo e Luciano",
  "Djonga", "Emicida", "Criolo", "Racionais MC's", "Marcelo D2",
  "Baco Exu do Blues", "BK", "Matuê", "Filipe Ret", "Projota",
  "Iza", "Ludmilla", "Pabllo Vittar", "Gloria Groove", "Liniker",
  "Duda Beat", "Marina Sena", "Silva", "Tim Bernardes", "Céu",
  // Sertanejo, pagode e axé
  "Exaltasamba", "Sorriso Maroto", "Thiaguinho", "Péricles", "Ferrugem",
  "Turma do Pagode", "Molejo", "Só Pra Contrariar", "Raça Negra", "Art Popular",
  "Chiclete com Banana", "Timbalada", "Olodum", "Daniela Mercury", "Netinho",
  "Banda Eva", "Asa de Águia", "Harmonia do Samba", "Psirico", "Léo Santana",
  // Romântico e brega
  "Fábio Jr", "Zé Ramalho", "Amado Batista", "Reginaldo Rossi", "Falamansa",
  "Jorge Aragão", "Zeca Pagodinho", "Fundo de Quintal", "Diogo Nogueira", "Maria Rita",
  "Ana Carolina", "Vanessa da Mata", "Fernanda Takai", "Pitty", "Cássia Eller",
  "Zélia Duncan", "Sandy e Junior", "KLB", "Rouge", "Ivo Pessoa",
  // Internacionais que todo mundo conhece
  "The Beatles", "Queen", "Michael Jackson", "Madonna", "Elton John",
  "Coldplay", "U2", "Oasis", "Nirvana", "Guns N Roses",
  "Bon Jovi", "Red Hot Chili Peppers", "Linkin Park", "Green Day", "The Killers",
  "Adele", "Beyoncé", "Rihanna", "Taylor Swift", "Bruno Mars",
  "Ed Sheeran", "Dua Lipa", "The Weeknd", "Lady Gaga", "Katy Perry",
  "ABBA", "Bee Gees", "Stevie Wonder", "Whitney Houston", "Prince",
  "Amy Winehouse", "Arctic Monkeys", "Radiohead", "Pink Floyd", "Led Zeppelin",
  "Maroon 5", "Imagine Dragons", "OneRepublic", "Backstreet Boys", "NSYNC",
  "Shakira", "Ricky Martin", "Luis Miguel", "Maná", "Soda Stereo",
  "Bad Bunny", "Karol G", "Shawn Mendes", "Billie Eilish", "Harry Styles",
];

// O iTunes aceita até 200 por busca. Com 25 o catálogo parava em ~1200 músicas
// depois de tirar as repetidas; 70 leva bem acima de 2000.
const POR_ARTISTA = 70;
// Concorrência baixa e pausa entre buscas: com 5 em paralelo a Apple começou a
// devolver resposta vazia no meio da coleta.
const CONCORRENCIA = 2;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Tira "(Ao Vivo)", "- Remastered 2011", "feat. Fulano" etc. do título. */
function limparTitulo(t) {
  return t
    .replace(/\s*[\(\[][^\)\]]*(ao vivo|live|remaster|remix|vers|edit|feat|part|bonus|acústic|acoustic)[^\)\]]*[\)\]]/gi, "")
    .replace(/\s*-\s*(ao vivo|live|remaster|remix|single|radio edit|bonus track).*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chave(artista, titulo) {
  return `${artista}|${titulo}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9|]/g, "");
}

async function buscarArtista(artista, tentativa = 0) {
  const url =
    "https://itunes.apple.com/search?media=music&entity=song&country=BR" +
    `&limit=${POR_ARTISTA}&term=${encodeURIComponent(artista)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Enlace/1.0" } });
    if (res.status === 403 || res.status === 429) {
      if (tentativa < 3) {
        await dormir(4000 * (tentativa + 1));
        return buscarArtista(artista, tentativa + 1);
      }
      return [];
    }
    if (!res.ok) return [];
    const { results = [] } = await res.json();
    return results;
  } catch {
    if (tentativa < 2) {
      await dormir(2000);
      return buscarArtista(artista, tentativa + 1);
    }
    return [];
  }
}

const vistos = new Set();
const musicas = [];
let semPrevia = 0;

async function processar(artista) {
  const itens = await buscarArtista(artista);
  let posicao = 0;
  for (const t of itens) {
    posicao++;
    if (!t.previewUrl) {
      semPrevia++;
      continue;
    }
    const titulo = limparTitulo(t.trackName || "");
    const nomeArtista = (t.artistName || "").trim();
    if (!titulo || !nomeArtista || titulo.length > 60) continue;

    const k = chave(nomeArtista, titulo);
    if (vistos.has(k)) continue;
    vistos.add(k);

    musicas.push({
      a: nomeArtista,
      t: titulo,
      y: t.releaseDate ? Number(t.releaseDate.slice(0, 4)) : null,
      g: t.primaryGenreName || null,
      p: t.previewUrl,
      c: t.artworkUrl100 ? String(t.artworkUrl100).replace("100x100", "300x300") : null,
      // Posição na busca do artista. O iTunes devolve as mais tocadas primeiro,
      // então isso funciona como "o quanto a música é conhecida" — o jogo usa
      // para sortear mais os hits e menos os lados B que ninguém reconhece.
      r: posicao,
    });
  }
}

const fila = [...ARTISTAS];
async function trabalhador(id) {
  while (fila.length) {
    const artista = fila.shift();
    await processar(artista);
    process.stdout.write(`\r${musicas.length} músicas · faltam ${fila.length} artistas   `);
    await dormir(700); // gentileza com a API da Apple
  }
}

await Promise.all(Array.from({ length: CONCORRENCIA }, (_, i) => trabalhador(i)));

/*
 * Rede de proteção: se a Apple limitar as requisições no meio da execução, as
 * buscas voltam vazias e o script terminaria "com sucesso" gravando um
 * catálogo menor — foi exatamente o que aconteceu numa rodada, que substituiu
 * 1198 músicas por zero. Agora ele se recusa a piorar o catálogo existente.
 */
const anterior = (await lerCatalogoMusical()).length;

if (musicas.length < anterior * 0.9) {
  console.error(
    `\n\nAbortado: a coleta trouxe ${musicas.length} músicas, contra ${anterior} já gravadas.\n` +
      `Isso quase sempre é limite de requisições da Apple. O catálogo atual foi mantido.\n` +
      `Espere alguns minutos e rode de novo.`
  );
  process.exit(1);
}

const quantidadeDePartes = await salvarCatalogoMusical(musicas);

console.log(`\n\n${musicas.length} músicas com prévia gravadas em ${quantidadeDePartes} partes`);
console.log(`${semPrevia} faixas descartadas por não terem prévia`);
