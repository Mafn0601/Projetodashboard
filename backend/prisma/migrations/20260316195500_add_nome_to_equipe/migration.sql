ALTER TABLE "equipes"
ADD COLUMN "nome" TEXT;

UPDATE "equipes"
SET "nome" = COALESCE(NULLIF(TRIM("login"), ''), 'Sem nome')
WHERE "nome" IS NULL;

ALTER TABLE "equipes"
ALTER COLUMN "nome" SET NOT NULL;
