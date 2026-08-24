# Migração do banco atual

## SQLite local

1. Feche qualquer `npm run dev` que esteja usando o banco.
2. Guarde uma cópia externa do arquivo antigo.
3. Na raiz deste projeto, execute:

```cmd
npm install
npx prisma generate
npm run db:importar -- "C:\caminho\do\projeto-antigo\prisma\dev.db"
```

O processo:

1. verifica a assinatura SQLite e as tabelas essenciais;
2. cria `backups/banco-antes-da-importacao-<data>.db`, se já houver banco;
3. copia o banco informado para `prisma/dev.db`;
4. aplica tabelas, índices e colunas novas de forma aditiva;
5. consulta novamente o banco importado antes de concluir.

Se a validação final falhar, o banco anterior é restaurado automaticamente.

## PostgreSQL em produção

Não copie arquivos. Configure a mesma `DATABASE_URL` já usada pelo ambiente e
execute `npm run db:safe`. Faça snapshot do provedor antes da primeira execução.

## Comandos proibidos com dados reais

```text
prisma migrate reset
prisma db push --force-reset
prisma db push --accept-data-loss
```
