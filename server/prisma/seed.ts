import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpeza prévia na ordem inversa de dependência relacional
  await prisma.workOrderLog.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.customer.deleteMany();

  console.log('🧹 Registros anteriores removidos com sucesso.');

  // 1. Clientes
  const customerLawFirm = await prisma.customer.create({
    data: {
      name: 'Silva & Associados Advocacia',
      document: '12.345.678/0001-90',
      email: 'contato@silvaadv.com.br',
      phone: '(11) 3214-5500',
      address: 'Av. Paulista, 1000, Cj 142 - Bela Vista, São Paulo - SP'
    }
  });

  const customerClinic = await prisma.customer.create({
    data: {
      name: 'Clínica Médica São Lucas',
      document: '98.765.432/0001-10',
      email: 'suporte@saolucas.med.br',
      phone: '(11) 3322-8899',
      address: 'Rua Vergueiro, 450 - Paraíso, São Paulo - SP'
    }
  });

  const customerPerson = await prisma.customer.create({
    data: {
      name: 'Carlos Eduardo Mendes',
      document: '123.456.789-00',
      email: 'carlos.mendes@email.com',
      phone: '(11) 98765-4321',
      address: 'Rua Domingos de Morais, 1200, Apto 54 - Vila Mariana, São Paulo - SP'
    }
  });

  console.log('👥 3 Clientes criados com sucesso.');

  // 2. Técnicos
  const techRoberto = await prisma.technician.create({
    data: {
      name: 'Roberto Alves',
      email: 'roberto.alves@ordemapp.local',
      phone: '(11) 97111-2233',
      specialty: 'Hardware & Microeletrônica',
      isActive: true
    }
  });

  const techMariana = await prisma.technician.create({
    data: {
      name: 'Mariana Costa',
      email: 'mariana.costa@ordemapp.local',
      phone: '(11) 97222-4455',
      specialty: 'Redes & Infraestrutura',
      isActive: true
    }
  });

  console.log('🔧 2 Técnicos criados com sucesso.');

  // 3. Ordens de Serviço
  // OS 1: ABERTA (Sem técnico atribuído ainda)
  await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0001',
      customerId: customerLawFirm.id,
      equipment: 'Notebook Dell Latitude 5420',
      serialNumber: 'DELL-LAT-9821',
      reportedDefect: 'Não liga após oscilação de energia elétrica no escritório.',
      status: 'OPEN',
      priority: 'HIGH',
      totalServices: 150.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 150.0,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Diagnóstico técnico inicial e análise de curto na placa-mãe',
            quantity: 1,
            unitPrice: 150.0,
            subtotal: 150.0
          }
        ]
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'Ordem de serviço registrada pelo canal de atendimento corporativo.',
            createdBy: 'SYSTEM'
          }
        ]
      }
    }
  });

  // OS 2: EM ANDAMENTO (Atribuída ao Roberto com peças e serviços)
  await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0002',
      customerId: customerClinic.id,
      technicianId: techRoberto.id,
      equipment: 'Servidor HP ProLiant MicroServer Gen10',
      serialNumber: 'HP-SRV-4412',
      reportedDefect: 'Alarme de superaquecimento sonoro e degradação de performance no array RAID.',
      technicalDiagnosis: 'Falha mecânica em ventoinha primária e bloco defeituoso no disco 2.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      totalServices: 220.0,
      totalParts: 820.0,
      discount: 40.0,
      totalAmount: 1000.0,
      scheduledDate: new Date(),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Desmontagem, limpeza do chassi térmico e reinstalação de ventoinhas',
            quantity: 1,
            unitPrice: 220.0,
            subtotal: 220.0
          },
          {
            type: 'PART',
            description: 'Cooler Master Fan Industrial 120mm PWM',
            quantity: 2,
            unitPrice: 85.0,
            subtotal: 170.0
          },
          {
            type: 'PART',
            description: 'Disco Enterprise SAS 2TB Seagate Exos',
            quantity: 1,
            unitPrice: 650.0,
            subtotal: 650.0
          }
        ]
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'OS aberta com prioridade de emergência para servidor de prontuários médicos.',
            createdBy: 'SYSTEM'
          },
          {
            previousStatus: 'OPEN',
            newStatus: 'IN_PROGRESS',
            comment: 'Iniciada a substituição do cooler e rebuild do array RAID no laboratório.',
            createdBy: techRoberto.name
          }
        ]
      }
    }
  });

  // OS 3: CONCLUÍDA (Mariana Costa finalizou atendimento com diagnóstico completo)
  const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const finishDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

  await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0003',
      customerId: customerPerson.id,
      technicianId: techMariana.id,
      equipment: 'MacBook Pro 14 M1 (2021)',
      serialNumber: 'C02GF389MD6R',
      reportedDefect: 'Lentidão extrema e erros de kernel panic ao inicializar.',
      technicalDiagnosis: 'Corrupção no APFS decorrente de desligamento abrupto; reinstalação limpa do macOS e bateria testada OK.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      totalServices: 350.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 350.0,
      scheduledDate: pastDate,
      completedDate: finishDate,
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Restauração do macOS, backup de perfil de usuário e diagnóstico de hardware',
            quantity: 1,
            unitPrice: 350.0,
            subtotal: 350.0
          }
        ]
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'Recebido na recepção para análise em balcão.',
            createdBy: 'SYSTEM'
          },
          {
            previousStatus: 'OPEN',
            newStatus: 'IN_PROGRESS',
            comment: 'Iniciado teste de estresse de memória e SSD.',
            createdBy: techMariana.name
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'WAITING_APPROVAL',
            comment: 'Orçamento de restauração enviado para o cliente por WhatsApp.',
            createdBy: techMariana.name
          },
          {
            previousStatus: 'WAITING_APPROVAL',
            newStatus: 'IN_PROGRESS',
            comment: 'Orçamento autorizado pelo cliente.',
            createdBy: 'SYSTEM'
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'COMPLETED',
            comment: 'Instalação concluída com sucesso e equipamento pronto para entrega com garantia.',
            createdBy: techMariana.name
          }
        ]
      }
    }
  });

  console.log('📋 3 Ordens de Serviço populadas com itens e histórico de logs.');
  console.log('✨ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed do banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
