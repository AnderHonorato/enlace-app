# Estratégia de desempenho

## Escolha do framework

O Enlace permanece no Next.js porque a aplicação depende de renderização no
servidor, rotas de API, autenticação, Prisma, cookies seguros e páginas
dinâmicas. Reescrever tudo em uma biblioteca somente de interface reduziria o
tamanho de algumas telas, mas exigiria reconstruir a camada de servidor e
aumentaria o risco para o banco e para as permissões do casal.

A versão inicial consolidada usa Next.js 14.2.35. Ela corrige as falhas
conhecidas da antiga 14.2.18 sem introduzir uma atualização principal durante a
reorganização do projeto. A atualização para Next.js 16 deve ser feita em uma
etapa separada, depois da correção de segurança anunciada para 26 de agosto de
2026, com nova validação de autenticação, APIs e build.

## Primeiro acesso

- A tela de abertura aparece somente no primeiro acesso do navegador.
- Enquanto ela está visível, as rotas essenciais são pré-carregadas.
- Rotas secundárias são aquecidas quando o navegador estiver ocioso.
- Conexões com economia de dados ou 2G não recebem pré-carga agressiva.
- O banco e as mídias privadas nunca são baixados integralmente na abertura.

O objetivo é preparar código e recursos estáticos úteis. Carregar previamente
todos os registros e anexos aumentaria o tempo inicial, consumiria dados e
criaria conteúdo desatualizado no navegador.

## Cliques e navegação

- Links internos usam a navegação do App Router, sem recarregar o documento.
- A interface mostra uma barra de progresso imediatamente após o clique.
- As rotas principais são antecipadas por `prefetch`.
- Cada área possui estado de carregamento próprio, para evitar tela congelada.
- A linha do tempo usa paginação e sincronização leve em vez de reenviar todo o
  histórico e todas as mídias repetidamente.

## Próximas medições

Depois da publicação, medir LCP, INP e CLS no ambiente real da Vercel, tanto no
celular quanto no computador. Qualquer nova otimização deve partir dessas
medições, preservando autenticação, privacidade e consistência do banco.
