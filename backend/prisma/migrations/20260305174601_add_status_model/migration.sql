-- CreateTable
CREATE TABLE "status_cards" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "veiculo" TEXT NOT NULL,
    "dataAgendamento" TIMESTAMP(3) NOT NULL,
    "dataEntrega" TIMESTAMP(3) NOT NULL,
    "cliente" TEXT NOT NULL,
    "parceiro" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recebido',
    "boxId" TEXT,
    "boxNome" TEXT,
    "agendamentoId" TEXT,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "formaPagamento" TEXT,
    "meioPagamento" TEXT,
    "timestampFinalizacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_cards_numero_key" ON "status_cards"("numero");
