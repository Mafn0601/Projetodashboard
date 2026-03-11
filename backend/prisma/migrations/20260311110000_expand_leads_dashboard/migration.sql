ALTER TABLE "leads"
ADD COLUMN IF NOT EXISTS "empresa" TEXT,
ADD COLUMN IF NOT EXISTS "cargo" TEXT,
ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS "ultimaInteracao" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "emSequencia" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads"("status");
CREATE INDEX IF NOT EXISTS "leads_responsavelId_idx" ON "leads"("responsavelId");
CREATE INDEX IF NOT EXISTS "leads_score_idx" ON "leads"("score");
CREATE INDEX IF NOT EXISTS "leads_createdAt_idx" ON "leads"("createdAt");
CREATE INDEX IF NOT EXISTS "leads_responsavelId_status_idx" ON "leads"("responsavelId", "status");