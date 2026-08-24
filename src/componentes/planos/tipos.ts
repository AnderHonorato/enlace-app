export type Etapa = { text: string; done: boolean };
export type Meta = { id: string; title: string; emoji: string; steps: Etapa[]; done: boolean; doneCount: number; total: number };
export type Desejo = { id: string; title: string; kind: string; done: boolean };
export type Capsula = {
  id: string;
  title: string | null;
  content: string;
  unlocked: boolean;
  openAt: string;
  openedAt: string | null;
  isMine: boolean;
  authorId: string;
  vessel: string;
  status: string;
  items: { id: string; message: string; mood: string | null; image: string | null; isMine: boolean }[];
  itemCount: number;
};
