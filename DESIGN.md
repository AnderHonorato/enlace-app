# Identidade visual — papel e tinta

O Enlace usa uma linguagem editorial de diário artesanal: papel quente, tinta
escura, carmim, bordas desenhadas, fitas, selos, folhas e pequenos carimbos.

## Princípios

- Conteúdo sempre legível; decoração nunca reduz contraste ou área de toque.
- Molduras são SVG vetorial ou CSS, não fotografias de bordas.
- Superfícies grandes usam papel neutro; carmim aparece como marca e ação.
- Animações usam principalmente `transform` e `opacity`.
- `prefers-reduced-motion` é respeitado em toda animação contínua.
- Ícones funcionais têm rótulo acessível e não dependem apenas de cor.
- Fotos do casal são conteúdo; ornamentos continuam independentes das fotos.

## Formas

- cartões: borda fina e irregular, com sombra curta de papel;
- destaques: fita ou carimbo vetorial em um canto;
- títulos: tipografia editorial e régua horizontal;
- botões: área mínima de toque de 44 × 44 px;
- modais: folha elevada, foco preso e fechamento explícito.

Os tokens globais ficam em `src/app/globals.css`; as formas SVG reutilizáveis,
em `src/componentes/Papelaria.tsx`.
