import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import zlib from "zlib";

const prisma = new PrismaClient();

// ── Gerador de "fotos" (PNG com degradê) para a demonstração ──
// PNGs raster de verdade (não SVG) para não sujar o canvas do vídeo/retrospectiva.
const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function gradientPng(top: [number, number, number], bottom: [number, number, number], w = 480, h = 480): string {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filtro
    const f = y / (h - 1);
    const wob = Math.sin(y / 40) * 18; // leve variação pra não ficar chapado
    for (let x = 0; x < w; x++) {
      const fx = f + (x / w) * 0.15;
      raw[o++] = Math.max(0, Math.min(255, top[0] + (bottom[0] - top[0]) * fx + wob));
      raw[o++] = Math.max(0, Math.min(255, top[1] + (bottom[1] - top[1]) * fx));
      raw[o++] = Math.max(0, Math.min(255, top[2] + (bottom[2] - top[2]) * fx - wob));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 8 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return "data:image/png;base64," + png.toString("base64");
}

async function main() {
  // Limpa tudo para um estado de demonstração consistente.
  await prisma.user.deleteMany();
  await prisma.couple.deleteMany();

  const pass = await bcrypt.hash("enlace123", 10);
  const n0 = new Date();
  const todayKey = `${n0.getFullYear()}-${String(n0.getMonth() + 1).padStart(2, "0")}-${String(n0.getDate()).padStart(2, "0")}`;

  const couple = await prisma.couple.upsert({
    where: { inviteCode: "DEMOAMOR" },
    update: {},
    create: {
      inviteCode: "DEMOAMOR",
      name: "Ana & João",
      anniversary: new Date("2021-06-12"),
      metDate: new Date("2021-03-05"),
      howWeMet:
        "Foi numa cafeteria perto da faculdade. Ele pediu o último pão de queijo, eu reclamei brincando — e ele dividiu comigo. A gente conversou até fecharem a loja.",
    },
  });

  const ana = await prisma.user.upsert({
    where: { email: "ana@enlace.app" },
    update: { coupleId: couple.id },
    create: {
      email: "ana@enlace.app",
      name: "Ana",
      displayName: "Ana",
      passwordHash: pass,
      avatarColor: "#E5679B",
      accent: "rose",
      theme: "aurora",
      aiProvider: "deepseek",
      points: 452,
      streak: 5,
      bestStreak: 12,
      lastActiveDay: todayKey,
      birthday: new Date("1998-09-14"),
      coupleId: couple.id,
      bio: "Amo café, chuva e escrever pra gente lembrar.",
    },
  });

  const joao = await prisma.user.upsert({
    where: { email: "joao@enlace.app" },
    update: { coupleId: couple.id },
    create: {
      email: "joao@enlace.app",
      name: "João",
      displayName: "João",
      passwordHash: pass,
      avatarColor: "#5AA0F0",
      accent: "sky",
      theme: "aurora",
      aiProvider: "deepseek",
      points: 398,
      streak: 5,
      bestStreak: 9,
      lastActiveDay: todayKey,
      birthday: new Date("1996-02-20"),
      coupleId: couple.id,
      bio: "Fotógrafo de fim de semana. Faço o café.",
    },
  });

  const count = await prisma.entry.count({ where: { coupleId: couple.id } });
  if (count === 0) {
    const day = (n: number) => new Date(Date.now() - n * 86400000);

    const seedEntries = [
      {
        author: joao.id,
        title: "Nosso primeiro café da manhã na varanda",
        content:
          "Acordei antes de você e fiz aquele café coado. A luz batendo na mesa, você ainda de olhos meio fechados. Queria guardar essa manhã inteira num pote.",
        mood: "apaixonado",
        entryDate: day(6),
        points: 21,
        insight: "Guardar os pequenos instantes é o segredo de quem ama de verdade.",
        favorite: true,
        tags: ["encontro", "café"],
        place: "Nossa varanda",
        lat: -23.5615,
        lng: -46.6562,
        photos: [gradientPng([255, 194, 120], [229, 103, 155]), gradientPng([255, 220, 150], [149, 117, 232])],
      },
      {
        author: ana.id,
        title: "Chuva de domingo",
        content:
          "Passamos a tarde inteira embaixo do edredom vendo filme. Sem pressa nenhuma. Descobri que meu lugar favorito do mundo é o seu ombro.",
        mood: "calmo",
        entryDate: day(4),
        points: 18,
        insight: "Há um conforto raro em não ter pressa nenhuma ao lado de quem se ama.",
        photos: [gradientPng([120, 160, 240], [149, 117, 232])],
      },
      {
        author: ana.id,
        title: "Discussão boba (e a reconciliação)",
        content:
          "A gente brigou por causa da louça, imagina. Mas conversamos, pedi desculpa, você também. Aprendi que 'ganhar' a discussão não vale a pena — vale mais a gente.",
        mood: "pensativo",
        entryDate: day(2),
        points: 20,
        insight: "Escolher o 'nós' no lugar do 'eu tenho razão' é maturidade que aproxima.",
      },
      {
        author: joao.id,
        title: "Planejando a viagem",
        content:
          "Abrimos o mapa e ficamos sonhando. Praia ou montanha? No fim decidimos: os dois, um dia. Anota aí que eu vou cumprir.",
        mood: "animado",
        entryDate: day(1),
        points: 19,
        insight: "Sonhar junto é o primeiro passo de toda viagem que vale a pena.",
        tags: ["viagem", "planos"],
        place: "Em casa, com o mapa aberto",
        lat: -23.5505,
        lng: -46.6333,
        photos: [gradientPng([74, 190, 176], [90, 160, 240]), gradientPng([240, 136, 62], [229, 103, 155])],
      },
    ];

    for (const e of seedEntries as any[]) {
      await prisma.entry.create({
        data: {
          authorId: e.author,
          coupleId: couple.id,
          title: e.title,
          content: e.content,
          mood: e.mood,
          points: e.points,
          insight: e.insight,
          favorite: e.favorite ?? false,
          tags: JSON.stringify(e.tags ?? []),
          place: e.place ?? null,
          lat: e.lat ?? null,
          lng: e.lng ?? null,
          visibility: "shared",
          entryDate: e.entryDate,
          attachments: e.photos?.length
            ? { create: (e.photos as string[]).map((url) => ({ url, type: "image" })) }
            : undefined,
          reactions: {
            create: {
              userId: e.author === ana.id ? joao.id : ana.id,
              emoji: "❤️",
            },
          },
        },
      });
    }

    const first = await prisma.entry.findFirst({
      where: { coupleId: couple.id },
      orderBy: { entryDate: "asc" },
    });
    if (first) {
      await prisma.comment.create({
        data: {
          entryId: first.id,
          authorId: ana.id,
          content: "Eu lembro dessa manhã 🥹 melhor café da vida.",
        },
      });
    }
  }

  // Conversa de demonstração entre o casal
  const chatCount = await prisma.message.count({ where: { coupleId: couple.id } });
  if (chatCount === 0) {
    const min = (n: number) => new Date(Date.now() - n * 60000);
    const demo = [
      { s: joao.id, c: "Bom dia meu amor ☀️ dormiu bem?", t: 240 },
      { s: ana.id, c: "Bom dia! Dormi sim, sonhei com a gente na praia 🏖️", t: 236 },
      { s: joao.id, c: "Anotado. Já tô planejando a viagem 😄", t: 231 },
      { s: ana.id, c: "Te amo ❤️", t: 228 },
      { s: joao.id, c: "Também te amo, demais 🥰", t: 12 },
    ];
    for (const d of demo) {
      await prisma.message.create({
        data: { coupleId: couple.id, senderId: d.s, content: d.c, createdAt: min(d.t) },
      });
    }
  }

  // Resumo do amor de hoje (demonstração)
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  await prisma.dailySummary.upsert({
    where: { coupleId_day: { coupleId: couple.id, day } },
    update: {},
    create: {
      coupleId: couple.id,
      day,
      vibe: "positive",
      title: "Vocês estão brilhando",
      message:
        "Os últimos dias respiram carinho: cafés na varanda, tardes de chuva e planos de viagem. Até a discussão da louça virou reconciliação. Tem muito amor circulando por aqui.",
      tip: "Registrem juntos o melhor momento de hoje — daqui a um ano vocês vão querer reler.",
    },
  });

  // Metas, desejos e cápsulas de demonstração
  const goalCount = await prisma.goal.count({ where: { coupleId: couple.id } });
  if (goalCount === 0) {
    await prisma.goal.create({
      data: {
        coupleId: couple.id,
        createdBy: joao.id,
        title: "Viagem pra praia",
        emoji: "✈️",
        steps: JSON.stringify([
          { text: "Escolher a praia", done: true },
          { text: "Juntar R$ 2.000", done: true },
          { text: "Reservar a pousada", done: false },
          { text: "Fazer as malas", done: false },
        ]),
      },
    });
    await prisma.wish.createMany({
      data: [
        { coupleId: couple.id, createdBy: ana.id, title: "Piquenique no pôr do sol", kind: "date" },
        { coupleId: couple.id, createdBy: joao.id, title: "Conhecer a neve juntos", kind: "sonho" },
        { coupleId: couple.id, createdBy: ana.id, title: "Jantar naquele restaurante italiano", kind: "lugar", done: true },
      ],
    });
    await prisma.capsule.create({
      data: {
        coupleId: couple.id,
        authorId: ana.id,
        title: "Para o nosso aniversário",
        content:
          "Se você está lendo isso, é porque chegamos a mais um 12 de junho juntos. Eu escrevi essa carta num dia comum, só pra te lembrar: até os dias comuns com você são os meus favoritos. Te amo!",
        openAt: new Date("2027-06-12T12:00:00"),
      },
    });
    await prisma.capsule.create({
      data: {
        coupleId: couple.id,
        authorId: joao.id,
        title: "Uma surpresa antiga",
        content: "Aposto que você esqueceu que eu escrevi isso! Vale um jantar por minha conta. 🍝",
        openAt: new Date(Date.now() - 2 * 86400000),
      },
    });
  }

  console.log("Seed pronto:");
  console.log("  Ana  → ana@enlace.app  / enlace123");
  console.log("  João → joao@enlace.app / enlace123");
  console.log("  Código do casal (demo): DEMOAMOR");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
