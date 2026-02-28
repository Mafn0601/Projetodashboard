import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar usuário admin
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@oficina.com' },
    update: {},
    create: {
      nome: 'Administrador',
      login: 'admin',
      email: 'admin@oficina.com',
      senha: adminPassword,
      role: 'ADMIN',
      ativo: true,
    },
  });

  console.log('✅ Admin criado:', admin.email);

  // Criar parceiro exemplo
  const parceiro = await prisma.parceiro.upsert({
    where: { nome: 'Parceiro Central' },
    update: {},
    create: {
      nome: 'Parceiro Central',
      cnpj: '12345678000190',
      telefone: '(11) 98765-4321',
      email: 'contato@parceiro.com',
      ativo: true,
    },
  });

  console.log('✅ Parceiro criado:', parceiro.nome);

  // Criar boxes
  for (let i = 1; i <= 5; i++) {
    await prisma.box.upsert({
      where: { numero: `BOX-${i}` },
      update: {},
      create: {
        numero: `BOX-${i}`,
        nome: `Box ${i}`,
        descricao: `Box de atendimento ${i}`,
        ativo: true,
      },
    });
  }

  console.log('✅ Boxes criados');

  // Criar tipos de OS
  const tiposOS = [
    { nome: 'Revisão Completa', descricao: 'Revisão geral do veículo' },
    { nome: 'Troca de Óleo', descricao: 'Serviço de troca de óleo' },
    { nome: 'Alinhamento', descricao: 'Alinhamento e balanceamento' },
    { nome: 'Freios', descricao: 'Manutenção do sistema de freios' },
  ];

  for (const tipo of tiposOS) {
    await prisma.tipoOS.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: tipo,
    });
  }

  console.log('✅ Tipos de OS criados');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
