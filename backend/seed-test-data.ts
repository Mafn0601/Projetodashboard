import prisma from './src/lib/prisma';

async function seedTestData() {
  console.log('🌱 Criando dados de teste...\n');

  try {
    // Verificar se já existem dados
    const existingOS = await prisma.ordemServico.count();
    if (existingOS > 0) {
      console.log(`✅ Já existem ${existingOS} OSs no banco. Pulando seed.`);
      return;
    }

    // Buscar um cliente, veículo, usuário e parceiro existentes
    const cliente = await prisma.cliente.findFirst();
    const veiculo = await prisma.veiculo.findFirst();
    const usuario = await prisma.usuario.findFirst();
    const parceiro = await prisma.parceiro.findFirst();

    if (!cliente || !veiculo || !usuario) {
      console.log('⚠️  Não há clientes, veículos ou usuários no banco.');
      console.log('   Execute o seed principal primeiro.');
      return;
    }

    console.log(`📋 Usando:`);
    console.log(`   Cliente: ${cliente.nome}`);
    console.log(`   Veículo: ${veiculo.placa}`);
    console.log(`   Usuário: ${usuario.nome}`);
    if (parceiro) {
      console.log(`   Parceiro: ${parceiro.nome}`);
    }

    // Criar 50 OSs de teste
    console.log('\n📦 Criando 50 Ordens de Serviço de teste...');
    
    const statuses = ['AGUARDANDO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECAS', 'EM_EXECUCAO', 'CONCLUIDO', 'ENTREGUE'];
    const prioridades = ['BAIXA', 'NORMAL', 'ALTA'];
    
    for (let i = 1; i <= 50; i++) {
      await prisma.ordemServico.create({
        data: {
          numeroOS: `OS${String(1000 + i).padStart(4, '0')}`,
          clienteId: cliente.id,
          veiculoId: veiculo.id,
          responsavelId: usuario.id,
          parceiroId: parceiro?.id || null,
          status: statuses[i % statuses.length] as any,
          prioridade: prioridades[i % prioridades.length] as any,
          descricao: `Serviço de teste ${i}`,
          observacoes: `Observações de teste ${i}`,
          quilometragem: String(10000 + i * 100),
          valorTotal: 100 + (i * 10),
          dataAbertura: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // i dias atrás
          dataPrevisao: new Date(Date.now() + (7 - i) * 24 * 60 * 60 * 1000),
        },
      });
      
      if (i % 10 === 0) {
        console.log(`   ✓ ${i}/50 criadas...`);
      }
    }

    console.log('\n✅ Seed completo! 50 OSs criadas.');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

seedTestData()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
