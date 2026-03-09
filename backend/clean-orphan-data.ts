import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOrphanData() {
  console.log('🧹 Limpando dados órfãos...\n');

  try {
    // Limpar veículos sem cliente
    const orphanVeiculos = await prisma.$queryRaw<{ count: bigint }[]>`
      DELETE FROM veiculos 
      WHERE "clienteId" NOT IN (SELECT id FROM clientes)
      RETURNING *
    `;
    console.log(`✅ Veículos órfãos removidos: ${orphanVeiculos.length}`);

    // Limpar agendamentos sem cliente
    const orphanAgendamentos = await prisma.$queryRaw<{ count: bigint }[]>`
      DELETE FROM agendamentos 
      WHERE "clienteId" NOT IN (SELECT id FROM clientes)
      RETURNING *
    `;
    console.log(`✅ Agendamentos órfãos removidos: ${orphanAgendamentos.length}`);

    // Limpar ordens de serviço sem cliente
    const orphanOS = await prisma.$queryRaw<{ count: bigint }[]>`
      DELETE FROM ordens_servico 
      WHERE "clienteId" NOT IN (SELECT id FROM clientes)
      RETURNING *
    `;
    console.log(`✅ Ordens de serviço órfãs removidas: ${orphanOS.length}`);

    // Limpar leads sem cliente (quando clienteId não é null)
    const orphanLeads = await prisma.$queryRaw<{ count: bigint }[]>`
      DELETE FROM leads 
      WHERE "clienteId" IS NOT NULL 
      AND "clienteId" NOT IN (SELECT id FROM clientes)
      RETURNING *
    `;
    console.log(`✅ Leads órfãos removidos: ${orphanLeads.length}`);

    // Limpar orçamentos sem cliente
    const orphanOrcamentos = await prisma.$queryRaw<{ count: bigint }[]>`
      DELETE FROM orcamentos 
      WHERE "clienteId" NOT IN (SELECT id FROM clientes)
      RETURNING *
    `;
    console.log(`✅ Orçamentos órfãos removidos: ${orphanOrcamentos.length}`);

    console.log('\n✅ Limpeza concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao limpar dados órfãos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphanData();
