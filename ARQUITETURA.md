# Arquitetura do Enlace

## Objetivo

Manter um único aplicativo, fácil de localizar, testar e evoluir. Cada módulo
deve ter uma responsabilidade clara e evitar dependências circulares.

## Limites do framework

O Next.js exige nomes como `src/app`, `page.tsx`, `layout.tsx`, `route.ts` e as
funções HTTP `GET`, `POST`, `PATCH` e `DELETE`. Esses nomes não representam
texto autoral em inglês; são contratos do framework e não podem ser traduzidos
sem quebrar a aplicação.

O mesmo vale para nomes públicos do React, do navegador e do Prisma. Todo nome
autoral novo deve ser escrito em português do Brasil.

## Separação por responsabilidade

- Páginas em `src/app` e componentes em `src/componentes` descrevem a estrutura da tela.
- Estilos reutilizáveis ficam em `.module.css` ou nas folhas globais.
- Regras e efeitos ficam em funções `.ts` com nomes específicos.
- Acesso ao banco passa por serviços do servidor; componentes não montam SQL.
- Tipos compartilhados ficam próximos do domínio que representam.
- Um arquivo não deve misturar desenho da interface, persistência e regras.

## Tamanho dos módulos

O verificador de arquitetura alerta para arquivos autorais acima de 600 linhas.
Módulos grandes herdados são fracionados por área funcional, mantendo testes e
comportamento durante a transição. Novos arquivos não podem aumentar essa lista.

Execute:

```bash
npm run arquitetura:verificar
```

## Compatibilidade do banco

Os nomes físicos do schema existente permanecem estáveis. Traduzir diretamente
tabelas ou colunas faria o Prisma tentar recriá-las e colocaria os dados em
risco. A camada de aplicação pode oferecer serviços com nomes em português sem
renomear o armazenamento legado.

Atualizações de estrutura são aditivas e repetíveis. Remoções, alterações de
tipo e recriações de tabela exigem uma migração revisada e backup verificável.
