-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "duracao" INTEGER,
ADD COLUMN     "itemOSId" TEXT,
ADD COLUMN     "tipoOSId" TEXT;

-- AlterTable
ALTER TABLE "equipes" ALTER COLUMN "funcao" DROP DEFAULT;
