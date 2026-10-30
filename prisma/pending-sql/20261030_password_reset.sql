-- Self-service password reset: single-use links sent by e-mail. Only the SHA-256 hash of a token is stored.
-- Additive only (one new table). Idempotent. RLS with no policies denies anon/authenticated, so hashes are
-- never reachable through the Supabase Data API; Prisma connects as the table owner and is unaffected.
-- Do NOT add FORCE ROW LEVEL SECURITY.

-- CreateTable
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- Row level security
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PasswordResetToken" FROM anon, authenticated;
