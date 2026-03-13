-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "codigoFatura" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ABERTO',
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "valorBruto" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "responsavel" TEXT,
    "observacoes" TEXT,
    "categoria" TEXT,
    "centroCusto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_fin" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "alvoId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "observacoes" TEXT,
    "comprovanteUrl" TEXT,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_fin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faturas_codigoFatura_key" ON "faturas"("codigoFatura");

-- CreateIndex
CREATE INDEX "faturas_tipo_idx" ON "faturas"("tipo");

-- CreateIndex
CREATE INDEX "faturas_status_idx" ON "faturas"("status");

-- CreateIndex
CREATE INDEX "faturas_dataVencimento_idx" ON "faturas"("dataVencimento");

-- CreateIndex
CREATE INDEX "faturas_tipo_status_idx" ON "faturas"("tipo", "status");

-- CreateIndex
CREATE INDEX "pagamentos_fin_alvoId_idx" ON "pagamentos_fin"("alvoId");

-- CreateIndex
CREATE INDEX "pagamentos_fin_tipo_alvoId_idx" ON "pagamentos_fin"("tipo", "alvoId");

-- CreateIndex
CREATE INDEX "pagamentos_fin_dataPagamento_idx" ON "pagamentos_fin"("dataPagamento");

-- AddForeignKey
ALTER TABLE "pagamentos_fin" ADD CONSTRAINT "pagamentos_fin_alvoId_fkey" FOREIGN KEY ("alvoId") REFERENCES "faturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
