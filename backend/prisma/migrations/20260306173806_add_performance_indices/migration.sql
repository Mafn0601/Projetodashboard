-- CreateIndex
CREATE INDEX "ordens_servico_clienteId_idx" ON "ordens_servico"("clienteId");

-- CreateIndex
CREATE INDEX "ordens_servico_veiculoId_idx" ON "ordens_servico"("veiculoId");

-- CreateIndex
CREATE INDEX "ordens_servico_responsavelId_idx" ON "ordens_servico"("responsavelId");

-- CreateIndex
CREATE INDEX "ordens_servico_parceiroId_idx" ON "ordens_servico"("parceiroId");

-- CreateIndex
CREATE INDEX "ordens_servico_agendamentoId_idx" ON "ordens_servico"("agendamentoId");

-- CreateIndex
CREATE INDEX "ordens_servico_status_idx" ON "ordens_servico"("status");

-- CreateIndex
CREATE INDEX "ordens_servico_dataAbertura_idx" ON "ordens_servico"("dataAbertura");

-- CreateIndex
CREATE INDEX "ordens_servico_parceiroId_status_idx" ON "ordens_servico"("parceiroId", "status");

-- CreateIndex
CREATE INDEX "ordens_servico_status_createdAt_idx" ON "ordens_servico"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ordens_servico_clienteId_createdAt_idx" ON "ordens_servico"("clienteId", "createdAt");
