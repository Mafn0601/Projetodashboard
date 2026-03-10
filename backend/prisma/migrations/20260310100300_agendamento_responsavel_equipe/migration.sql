-- Drop old foreign key to usuarios
ALTER TABLE "agendamentos" DROP CONSTRAINT IF EXISTS "agendamentos_responsavelId_fkey";

-- Add new foreign key to equipes
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "equipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
