from pathlib import Path

p = Path("prisma/schema.prisma")
s = p.read_text(encoding="utf-8")

if "authSessions AuthSession[]" not in s:
    marker = "  tasks        TaskItem[]\n"
    if marker not in s:
        raise SystemExit("Relações de User inesperadas; abortando.")
    s = s.replace(marker, marker + "  authSessions AuthSession[]\n", 1)

old_upload = '''model ChatUpload {
  id         String   @id @default(cuid())
  coupleId   String
  uploaderId String
  name       String
  mime       String
  size       Int
  data       Bytes
  createdAt  DateTime @default(now())

  @@index([coupleId, createdAt])
}'''
new_upload = '''model ChatUpload {
  id              String   @id @default(cuid())
  coupleId        String
  uploaderId      String
  name            String
  mime            String
  size            Int
  data            Bytes?
  storageProvider String   @default("database") // database | supabase
  storageKey      String?
  category        String   @default("chat") // chat | avatar | album | memorias
  createdAt       DateTime @default(now())

  @@index([coupleId, createdAt])
  @@index([coupleId, category, createdAt])
  @@index([uploaderId, createdAt])
}'''
if old_upload in s:
    s = s.replace(old_upload, new_upload, 1)
elif "storageProvider String" not in s:
    raise SystemExit("Bloco ChatUpload inesperado; abortando.")

if "model AuthSession {" not in s:
    s += '''

/// Sessão revogável por dispositivo. Permite sair de todos os aparelhos e
/// encerrar sessões inativas sem depender apenas da expiração do JWT.
model AuthSession {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())
  lastSeenAt DateTime  @default(now())
  expiresAt  DateTime
  revokedAt  DateTime?

  @@index([userId, revokedAt])
  @@index([expiresAt])
}
'''

p.write_text(s, encoding="utf-8")
