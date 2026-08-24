# Enlace

Aplicativo privado para registrar a história de um casal: memórias, conversa,
fotos, vídeos, áudios, planos, tarefas, jogos e retrospectivas.

Este repositório contém **um único aplicativo**. A aplicação Next.js fica na
raiz; não existem pastas separadas para versões antigas e novas.

## Organização do código

O projeto continua usando Next.js, React e TypeScript para preservar as rotas,
o servidor, a autenticação e a segurança de tipos. A separação é feita assim:

- `.tsx`: estrutura semântica da interface;
- `.module.css` e folhas globais: apresentação visual;
- `.ts`: regras, serviços, tipos, validações e acesso a dados;
- `src/app`: convenção obrigatória de rotas do Next.js;
- `prisma/schema.prisma`: contrato físico compatível com o banco existente.

Nomes criados pelo projeto e comentários são escritos em português do Brasil.
Nomes reservados por bibliotecas (`GET`, `POST`, `useState`, `PrismaClient`,
entre outros) permanecem como definidos pelas próprias ferramentas.

Consulte [ARQUITETURA.md](./ARQUITETURA.md),
[DESEMPENHO.md](./DESEMPENHO.md) e
[MIGRACAO-DO-BANCO.md](./MIGRACAO-DO-BANCO.md) para as regras completas.

## Instalação

```bash
npm install
npx prisma generate
npm run dev
```

Abra <http://localhost:3007>.

## Importar o banco atual

Feche o servidor antes da importação e informe o caminho do `dev.db` antigo:

```cmd
npm run db:importar -- "C:\caminho\do\projeto-antigo\prisma\dev.db"
```

O importador valida o arquivo, cria um backup do banco de destino e aplica
somente atualizações aditivas. Ele não executa `reset` nem remove tabelas.

## Verificações antes de publicar

```bash
npm run arquitetura:verificar
npm run quiz:check
npm run build
```

Nunca use `prisma migrate reset` ou `prisma db push --force-reset` com dados
reais. Para instalações existentes, prefira `npm run db:safe`.
