-- CreateEnum
CREATE TYPE "UrgenciaChamado" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO');

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_parceiroId_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_veiculoId_fkey";

-- DropForeignKey
ALTER TABLE "box_ocupacoes" DROP CONSTRAINT "box_ocupacoes_boxId_fkey";

-- DropForeignKey
ALTER TABLE "box_ocupacoes" DROP CONSTRAINT "box_ocupacoes_ordemServicoId_fkey";

-- DropForeignKey
ALTER TABLE "box_ocupacoes" DROP CONSTRAINT "box_ocupacoes_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "equipes" DROP CONSTRAINT "equipes_parceiroId_fkey";

-- DropForeignKey
ALTER TABLE "historico_os" DROP CONSTRAINT "historico_os_ordemServicoId_fkey";

-- DropForeignKey
ALTER TABLE "itens_orcamento" DROP CONSTRAINT "itens_orcamento_orcamentoId_fkey";

-- DropForeignKey
ALTER TABLE "itens_os" DROP CONSTRAINT "itens_os_ordemServicoId_fkey";

-- DropForeignKey
ALTER TABLE "itens_os" DROP CONSTRAINT "itens_os_tipoItemId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "orcamentos" DROP CONSTRAINT "orcamentos_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_agendamentoId_fkey";

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_parceiroId_fkey";

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_veiculoId_fkey";

-- DropForeignKey
ALTER TABLE "tipos_os_itens" DROP CONSTRAINT "tipos_os_itens_tipoOSId_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_parceiroId_fkey";

-- DropForeignKey
ALTER TABLE "veiculos" DROP CONSTRAINT "veiculos_clienteId_fkey";

-- CreateTable
CREATE TABLE "chamados" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "urgencia" "UrgenciaChamado" NOT NULL DEFAULT 'MEDIA',
    "descricao" TEXT NOT NULL,
    "status" "StatusChamado" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);
