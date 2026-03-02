-- AlterTable
ALTER TABLE "equipes" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "funcao" TEXT NOT NULL DEFAULT 'operador',
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "comissaoAtiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agencia" TEXT,
ADD COLUMN     "contaCorrente" TEXT,
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "meioPagamento" TEXT,
ADD COLUMN     "cpfCnpjRecebimento" TEXT,
ADD COLUMN     "tipoComissao" TEXT,
ADD COLUMN     "valorComissao" TEXT,
DROP COLUMN "nome";

-- CreateIndex
CREATE UNIQUE INDEX "equipes_cpf_key" ON "equipes"("cpf");
