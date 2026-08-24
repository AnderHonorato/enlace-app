export type AnexoRascunho = {
  url: string;
  type: string;
  caption?: string | null;
  duration?: number | null;
};

export type RascunhoMemoria = {
  version: 1;
  updatedAt: number;
  title: string;
  content: string;
  mood: string | null;
  date: string;
  visibility: "shared" | "private";
  tags: string[];
  place: string;
  coords: { lat: number; lng: number } | null;
  remoteAttachments: AnexoRascunho[];
};
