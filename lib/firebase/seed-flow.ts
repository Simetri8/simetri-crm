import { companyService } from './companies';
import { contactService } from './contacts';
import { dealService } from './deals';
import { proposalService } from './proposals';
import { workOrderService } from './work-orders';
import { deliverableService } from './deliverables';
import { taskService } from './tasks';
import type {
  DealStage,
  ProposalStatus,
  WorkOrderStatus,
  DeliverableStatus,
  TaskStatus,
  BlockedReason,
} from '@/lib/types';

/**
 * Flow View için seed data oluşturur.
 * Tüm senaryoları görmek için her durum için en az 2 kayıt oluşturur.
 */
export async function seedFlowData(userId: string): Promise<string> {
  console.log('🌱 Starting seed flow data...');

  // 1. Test Company Oluştur
  const companyId = await companyService.add(
    {
      name: '🧪 Test Şirketi - Flow Demo',
      status: 'active',
      tags: ['test', 'demo'],
      nextAction: 'Demo verisi oluşturuldu',
      nextActionDate: new Date(),
      ownerId: userId,
    },
    userId
  );
  console.log(`✅ Company created: ${companyId}`);

  // 2. Contacts Oluştur
  const primaryContactId = await contactService.add(
    {
      companyId,
      fullName: 'Ahmet Yılmaz (Birincil)',
      title: 'Genel Müdür',
      email: 'ahmet@test.com',
      phone: '+90 555 111 1111',
      isPrimary: true,
      notes: 'Birincil iletişim',
    },
    userId
  );
  console.log(`✅ Primary Contact created: ${primaryContactId}`);

  const secondaryContactId = await contactService.add(
    {
      companyId,
      fullName: 'Ayşe Demir',
      title: 'IT Müdürü',
      email: 'ayse@test.com',
      phone: '+90 555 222 2222',
      isPrimary: false,
      notes: 'Teknik konularda iletişim',
    },
    userId
  );
  console.log(`✅ Secondary Contact created: ${secondaryContactId}`);

  // 3. Her Stage İçin 2 Deal Oluştur
  const dealStages: DealStage[] = [
    'lead',
    'qualified',
    'proposal-prep',
    'proposal-sent',
    'negotiation',
    'won',
    'lost',
  ];

  const dealIds: Record<DealStage, string[]> = {
    lead: [],
    qualified: [],
    'proposal-prep': [],
    'proposal-sent': [],
    negotiation: [],
    won: [],
    lost: [],
  };

  for (const stage of dealStages) {
    for (let i = 1; i <= 2; i++) {
      const dealId = await dealService.add(
        {
          companyId,
          primaryContactId,
          title: `${stage.toUpperCase()} Deal #${i}`,
          stage,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          estimatedBudgetMinor: 50000000 + i * 10000000, // 500k - 600k TL
          currency: 'TRY',
          nextAction: `${stage} aşamasındaki işlemler`,
          nextActionDate: new Date(),
          ownerId: userId,
        },
        userId
      );
      dealIds[stage].push(dealId);
      console.log(`✅ Deal created: ${dealId} (${stage} #${i})`);
    }
  }

  // 4. Her Deal İçin Proposal Oluştur (sadece proposal-prep ve sonrası için)
  const proposalStatuses: ProposalStatus[] = ['draft', 'sent', 'accepted', 'rejected'];
  let proposalIndex = 0;

  for (const stage of ['proposal-prep', 'proposal-sent', 'negotiation', 'won', 'lost'] as DealStage[]) {
    for (const dealId of dealIds[stage]) {
      const status = proposalStatuses[proposalIndex % proposalStatuses.length];
      proposalIndex++;

      const proposalId = await proposalService.add(
        {
          dealId,
          version: 1,
          currency: 'TRY',
          pricesIncludeTax: false,
          items: [
            {
              catalogItemId: null,
              title: 'Yazılım Geliştirme Hizmeti',
              description: 'Web uygulaması geliştirme',
              quantity: 160,
              unit: 'hour',
              unitPriceMinor: 100000, // 1000 TL/saat
              taxRate: 20,
            },
            {
              catalogItemId: null,
              title: 'Proje Yönetimi',
              description: 'Proje koordinasyonu ve yönetim',
              quantity: 40,
              unit: 'hour',
              unitPriceMinor: 150000, // 1500 TL/saat
              taxRate: 20,
            },
          ],
        },
        userId
      );

      // Status güncelle (add işlemi sonrası)
      if (status !== 'draft') {
        await proposalService.update(proposalId, { status }, userId);
      }
      console.log(`✅ Proposal created: ${proposalId} (${status})`);
    }
  }

  // 5. Won Deal'ler İçin Work Order Oluştur
  const workOrderStatuses: WorkOrderStatus[] = ['active', 'on-hold', 'completed', 'cancelled'];
  let woIndex = 0;

  for (const dealId of dealIds.won) {
    const status = workOrderStatuses[woIndex % workOrderStatuses.length];
    woIndex++;

    const workOrderId = await workOrderService.add(
      {
        companyId,
        dealId,
        title: `Work Order - ${status.toUpperCase()}`,
        status,
        startDate: new Date(),
        targetDeliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        scopeSummary: 'Web uygulaması geliştirme ve deployment',
        paymentStatus: status === 'active' ? 'deposit-received' : 'paid',
        ownerId: userId,
      },
      userId
    );
    console.log(`✅ Work Order created: ${workOrderId} (${status})`);

    // 6. Her Work Order İçin Deliverable Oluştur
    const deliverableStatuses: DeliverableStatus[] = [
      'not-started',
      'in-progress',
      'blocked',
      'delivered',
      'approved',
    ];

    for (let i = 0; i < 2; i++) {
      const delivStatus = deliverableStatuses[i % deliverableStatuses.length];
      const deliverableId = await deliverableService.add(
        {
          workOrderId,
          title: `Deliverable ${i + 1} - ${delivStatus}`,
          status: delivStatus,
          targetDate: new Date(Date.now() + (30 + i * 15) * 24 * 60 * 60 * 1000),
          notes: `${delivStatus} durumundaki teslimat`,
        },
        userId
      );
      console.log(`✅ Deliverable created: ${deliverableId} (${delivStatus})`);

      // 7. Her Deliverable İçin Task Oluştur
      const taskStatuses: TaskStatus[] = ['backlog', 'in-progress', 'blocked', 'done'];

      for (let j = 0; j < 2; j++) {
        const taskStatus = taskStatuses[j % taskStatuses.length];
        const blockedReason: BlockedReason | null =
          taskStatus === 'blocked' ? 'waiting-client' : null;

        const taskId = await taskService.add(
          {
            workOrderId,
            deliverableId,
            title: `Task ${j + 1} - ${taskStatus}`,
            status: taskStatus,
            blockedReason,
            assigneeId: null,
            dueDate: new Date(Date.now() + (7 + j * 7) * 24 * 60 * 60 * 1000),
          },
          userId
        );
        console.log(`✅ Task created: ${taskId} (${taskStatus})`);
      }
    }

    // Orphan tasks (deliverable'a bağlı olmayan)
    const orphanTaskId = await taskService.add(
      {
        workOrderId,
        deliverableId: null,
        title: 'Orphan Task - Genel Gorev',
        status: 'in-progress',
        blockedReason: null,
        assigneeId: null,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      userId
    );
    console.log(`✅ Orphan Task created: ${orphanTaskId}`);
  }

  // 8. Standalone Work Order (dealId olmayan)
  const standaloneWOId = await workOrderService.add(
    {
      companyId,
      dealId: null, // Standalone
      title: 'Standalone Work Order',
      status: 'active',
      startDate: new Date(),
      targetDeliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      scopeSummary: 'Deal olmadan oluşturulmuş iş emri',
      paymentStatus: 'unplanned',
      ownerId: userId,
    },
    userId
  );
  console.log(`✅ Standalone Work Order created: ${standaloneWOId}`);

  // Standalone WO için deliverable ve task
  const standaloneDelivId = await deliverableService.add(
    {
      workOrderId: standaloneWOId,
      title: 'Standalone Deliverable',
      status: 'in-progress',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Standalone WO teslimatı',
    },
    userId
  );

  await taskService.add(
    {
      workOrderId: standaloneWOId,
      deliverableId: standaloneDelivId,
      title: 'Standalone Task',
      status: 'in-progress',
      blockedReason: null,
      assigneeId: null,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    userId
  );
  console.log(`✅ Standalone WO subtree created`);

  console.log('🎉 Seed flow data completed!');
  console.log(`📊 Summary:
  - 1 Company
  - 2 Contacts (1 primary, 1 secondary)
  - ${dealStages.length * 2} Deals (2 per stage)
  - Multiple Proposals (all statuses)
  - Multiple Work Orders (all statuses)
  - Multiple Deliverables (all statuses)
  - Multiple Tasks (all statuses)
  - 1 Standalone Work Order
  `);

  return companyId;
}
