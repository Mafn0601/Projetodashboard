import ordemServicoService from './src/services/ordemServicoService';

async function testOptimizations() {
  console.log('\n🧪 TESTE 1: findAll com paginação');
  console.time('⏱️  findAll (20 registros)');
  
  const result1 = await ordemServicoService.findAll({ 
    skip: 0, 
    take: 20 
  });
  
  console.timeEnd('⏱️  findAll (20 registros)');
  console.log(`📊 Total de OSs: ${result1.total}`);
  console.log(`📄 Página: ${result1.page}/${result1.totalPages}`);
  console.log(`📦 Registros retornados: ${result1.ordensServico.length}`);
  console.log(`💾 Tamanho do payload: ${(JSON.stringify(result1).length / 1024).toFixed(2)} KB`);
  
  // Verificar se tem campos select específicos (não deve ter todos os campos de cliente)
  if (result1.ordensServico.length > 0) {
    const primeiraOS = result1.ordensServico[0];
    console.log('\n✅ Campos retornados da primeira OS:');
    console.log(`   - numeroOS: ${primeiraOS.numeroOS}`);
    console.log(`   - status: ${primeiraOS.status}`);
    console.log(`   - cliente.nome: ${primeiraOS.cliente?.nome || 'N/A'}`);
    console.log(`   - _count.itens: ${primeiraOS._count?.itens || 0}`);
    
    // Verificar se não está carregando campos desnecessários
    const temCamposDemais = 'itens' in primeiraOS && Array.isArray((primeiraOS as any).itens);
    console.log(`   - ⚠️  Carregando array de itens? ${temCamposDemais ? 'SIM (RUIM!)' : 'NÃO (BOM!)'}`);
  }

  // TESTE 2: Se houver parceiros, testar findByParceiro
  if (result1.ordensServico.length > 0) {
    const osComParceiro = result1.ordensServico.find(os => os.parceiro?.id);
    
    if (osComParceiro) {
      console.log('\n\n🧪 TESTE 2: findByParceiro (filtro otimizado)');
      console.time('⏱️  findByParceiro');
      
      const result2 = await ordemServicoService.findByParceiro(
        osComParceiro.parceiro!.id,
        { skip: 0, take: 20 }
      );
      
      console.timeEnd('⏱️  findByParceiro');
      console.log(`📊 OSs deste parceiro: ${result2.total}`);
      console.log(`📦 Registros retornados: ${result2.ordensServico.length}`);
      console.log(`💾 Tamanho do payload: ${(JSON.stringify(result2).length / 1024).toFixed(2)} KB`);
      
      // Validar que todas as OSs são deste parceiro
      const todasDoParceiro = result2.ordensServico.every(
        os => os.parceiro?.id === osComParceiro.parceiro!.id
      );
      console.log(`✅ Filtro funcionando? ${todasDoParceiro ? 'SIM!' : 'NÃO (BUG!)'}`);
    } else {
      console.log('\n⚠️  TESTE 2 PULADO: Nenhuma OS com parceiro encontrada');
    }
  }

  // TESTE 3: Stats por status
  console.log('\n\n🧪 TESTE 3: getByStatus (agregação)');
  console.time('⏱️  getByStatus');
  
  const stats = await ordemServicoService.getByStatus(true);
  
  console.timeEnd('⏱️  getByStatus');
  console.log('📊 Estatísticas por status:');
  if ('byStatus' in stats) {
    (stats as any).byStatus.forEach((stat: any) => {
      console.log(`   - ${stat.status}: ${stat.count} OSs`);
    });
  }

  console.log('\n✅ TESTES CONCLUÍDOS!\n');
  console.log('═'.repeat(60));
  console.log('📈 MÉTRICAS ESPERADAS:');
  console.log('   - findAll: < 100ms');
  console.log('   - findByParceiro: < 50ms');
  console.log('   - getByStatus: < 20ms');
  console.log('   - Payload: < 50 KB para 20 registros');
  console.log('═'.repeat(60));
}

// Executar testes
testOptimizations()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro nos testes:', error);
    process.exit(1);
  });
