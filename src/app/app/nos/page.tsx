import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { feedWhere } from "@/nucleo/memorias";
import { levelProgress, loveTitle } from "@/nucleo/pontos";
import { Connection } from "@/componentes/Conexao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nós · Enlace" };

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function computeStreak(dates: Date[]): number {
  const days = new Set(dates.map(dayKey));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  if (!days.has(dayKey(today))) {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (days.has(dayKey(y))) cursor = y;
    else return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function NosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);
  const where = feedWhere({ id: user.id, coupleId: user.coupleId });

  const [entriesCount, commentsCount, reactionsCount, chatCount, photosCount, entryDates, insightRows] =
    await Promise.all([
      prisma.entry.count({ where }),
      prisma.comment.count({ where: { authorId: user.id } }),
      prisma.reaction.count({ where: { userId: user.id } }),
      prisma.chatMessage.count({ where: { userId: user.id, role: "user" } }),
      prisma.attachment.count({ where: { entry: where } }),
      prisma.entry.findMany({ where, select: { entryDate: true, mood: true }, orderBy: { entryDate: "desc" }, take: 400 }),
      prisma.entry.findMany({
        where: { ...where, NOT: { insight: null } },
        select: { id: true, insight: true, mood: true, author: { select: { displayName: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

  const points = me.couple ? me.couple.connectionPoints : me.points;
  const progress = levelProgress(points);
  const title = loveTitle(progress.level);
  const streak = computeStreak(entryDates.map((e) => e.entryDate));

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const weekCount = entryDates.filter((e) => e.entryDate >= weekAgo).length;

  const metas = [
    { key: "first", emoji: "🌱", title: "A primeira página", desc: "Escreva a primeira memória", current: entriesCount, goal: 1 },
    { key: "story", emoji: "📖", title: "Contadores de história", desc: "10 memórias registradas", current: entriesCount, goal: 10 },
    { key: "diary", emoji: "🗓️", title: "Diário de verdade", desc: "30 memórias registradas", current: entriesCount, goal: 30 },
    { key: "streak", emoji: "🔥", title: "Constância", desc: "7 dias seguidos escrevendo", current: streak, goal: 7 },
    { key: "week", emoji: "🗓️", title: "Semana cheia", desc: "5 registros nesta semana", current: weekCount, goal: 5 },
    { key: "hearts", emoji: "❤️", title: "Coração generoso", desc: "Curta 15 memórias", current: reactionsCount, goal: 15 },
    { key: "talk", emoji: "💬", title: "Sempre por perto", desc: "Deixe 10 comentários", current: commentsCount, goal: 10 },
    { key: "photos", emoji: "📸", title: "Álbum de vocês", desc: "Adicione 5 fotos", current: photosCount, goal: 5 },
    { key: "ai", emoji: "✨", title: "Boa companhia", desc: "Converse 5x com os personagens", current: chatCount, goal: 5 },
    { key: "bond", emoji: "🔗", title: "Conectados", desc: "Conecte-se com seu amor", current: me.partner ? 1 : 0, goal: 1 },
    { key: "love", emoji: "😍", title: "Apaixonados", desc: "Alcance o nível 7", current: progress.level, goal: 7 },
  ].map((m) => ({ ...m, done: m.current >= m.goal }));

  const insights = insightRows.map((r) => ({
    id: r.id,
    insight: r.insight!,
    mood: r.mood,
    author: r.author.displayName || r.author.name,
  }));

  return (
    <Connection
      me={me}
      level={progress.level}
      title={title}
      points={points}
      into={progress.into}
      need={progress.need}
      ratio={progress.ratio}
      toNext={progress.toNext}
      streak={streak}
      metas={metas}
      insights={insights}
      moodPoints={entryDates.map((e) => ({ date: e.entryDate.toISOString(), mood: e.mood }))}
    />
  );
}
