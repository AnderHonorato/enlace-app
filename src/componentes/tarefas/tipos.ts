export type Arquivo = { name: string; url: string; size: number };
export type Comentario = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
};

export type Tarefa = {
  id: string;
  listId: string;
  authorId: string;
  content: string;
  done: boolean;
  images: string[];
  files: Arquivo[];
  comments: Comentario[];
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Lista = {
  id: string;
  title: string;
  tasks: Tarefa[];
  createdAt: string;
  updatedAt: string;
};
