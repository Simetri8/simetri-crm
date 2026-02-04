import type { FlowNode, FlowEdge } from './types';
import { companyService } from '@/lib/firebase/companies';
import { dealService } from '@/lib/firebase/deals';
import { proposalService } from '@/lib/firebase/proposals';
import { workOrderService } from '@/lib/firebase/work-orders';
import { deliverableService } from '@/lib/firebase/deliverables';
import { taskService } from '@/lib/firebase/tasks';
import {
  COMPANY_STATUS_CONFIG,
  DEAL_STAGE_CONFIG,
  PROPOSAL_STATUS_CONFIG,
  WORK_ORDER_STATUS_CONFIG,
  DELIVERABLE_STATUS_CONFIG,
  TASK_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatMoney,
} from '@/lib/utils/status';
import type { WorkOrder } from '@/lib/types';

export async function fetchCompanyFlowData(companyId: string): Promise<{
  nodes: FlowNode[];
  edges: FlowEdge[];
}> {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // 1. Company (root)
  const company = await companyService.getById(companyId);
  if (!company) throw new Error('Company not found');

  nodes.push({
    id: company.id,
    type: 'company',
    position: { x: 0, y: 0 },
    data: {
      label: company.name,
      subtitle: COMPANY_STATUS_CONFIG[company.status].label,
      status: company.status,
      metadata: company,
    },
  });

  // 2. Deals
  const deals = await dealService.getAll({
    companyId,
    isArchived: false,
    limitCount: 50,
  });
  console.log(`Company ${companyId}: Found ${deals.length} deals`);

  for (const deal of deals) {
    nodes.push({
      id: deal.id,
      type: 'deal',
      position: { x: 0, y: 0 },
      data: {
        label: deal.title,
        subtitle: `${DEAL_STAGE_CONFIG[deal.stage].label}${
          deal.estimatedBudgetMinor
            ? ' • ' + formatMoney(deal.estimatedBudgetMinor, deal.currency)
            : ''
        }`,
        status: deal.stage,
        metadata: deal,
      },
    });
    edges.push({
      id: `${company.id}-${deal.id}`,
      source: company.id,
      target: deal.id,
      type: 'smoothstep',
      animated: deal.stage !== 'won' && deal.stage !== 'lost',
    });
  }

  console.log(`Total: ${nodes.length} nodes, ${edges.length} edges`);
  console.log('Node types:', nodes.reduce((acc, n) => {
    acc[n.type || 'unknown'] = (acc[n.type || 'unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));

  return { nodes, edges };
}

export async function fetchDealProposalsAndWorkOrders(dealId: string): Promise<{
  nodes: FlowNode[];
  edges: FlowEdge[];
}> {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const proposals = await proposalService.getAll({ dealId, isArchived: false });
  console.log(`Deal ${dealId}: Found ${proposals.length} proposals`);
  for (const proposal of proposals) {
    nodes.push({
      id: proposal.id,
      type: 'proposal',
      position: { x: 0, y: 0 },
      data: {
        label: `Teklif v${proposal.version}`,
        subtitle: `${PROPOSAL_STATUS_CONFIG[proposal.status].label} • ${formatMoney(proposal.grandTotalMinor, proposal.currency)}`,
        status: proposal.status,
        metadata: proposal,
      },
    });
    edges.push({
      id: `${dealId}-${proposal.id}`,
      source: dealId,
      target: proposal.id,
      type: 'smoothstep',
    });
  }

  const workOrders = await workOrderService.getAll({ dealId, isArchived: false });
  console.log(`Deal ${dealId}: Found ${workOrders.length} work orders`);
  for (const wo of workOrders) {
    addWorkOrderNode(wo, dealId, nodes, edges);
  }

  return { nodes, edges };
}

function addWorkOrderNode(
  wo: WorkOrder,
  parentId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
) {
  nodes.push({
    id: wo.id,
    type: 'workOrder',
    position: { x: 0, y: 0 },
    data: {
      label: wo.title,
      subtitle: `${WORK_ORDER_STATUS_CONFIG[wo.status].label} • ${PAYMENT_STATUS_CONFIG[wo.paymentStatus].label}`,
      status: wo.status,
      metadata: wo,
    },
  });
  edges.push({
    id: `${parentId}-${wo.id}`,
    source: parentId,
    target: wo.id,
    type: 'smoothstep',
    animated: wo.status === 'active',
  });
}

export async function fetchWorkOrderDeliverables(workOrderId: string): Promise<{
  nodes: FlowNode[];
  edges: FlowEdge[];
}> {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const deliverables = await deliverableService.getAll({ workOrderId });
  console.log(`WorkOrder ${workOrderId}: Found ${deliverables.length} deliverables`);

  for (const deliv of deliverables) {
    nodes.push({
      id: deliv.id,
      type: 'deliverable',
      position: { x: 0, y: 0 },
      data: {
        label: deliv.title,
        subtitle: DELIVERABLE_STATUS_CONFIG[deliv.status].label,
        status: deliv.status,
        metadata: deliv,
      },
    });
    edges.push({
      id: `${workOrderId}-${deliv.id}`,
      source: workOrderId,
      target: deliv.id,
      type: 'smoothstep',
    });
  }

  return { nodes, edges };
}

export async function fetchDeliverableTasks(
  workOrderId: string,
  deliverableId: string
): Promise<{
  nodes: FlowNode[];
  edges: FlowEdge[];
}> {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const tasks = await taskService.getAll({ workOrderId, deliverableId });
  console.log(`Deliverable ${deliverableId}: Found ${tasks.length} tasks`);

  for (const task of tasks) {
    nodes.push({
      id: task.id,
      type: 'task',
      position: { x: 0, y: 0 },
      data: {
        label: task.title,
        subtitle: `${TASK_STATUS_CONFIG[task.status].label}${
          task.assigneeName ? ' • ' + task.assigneeName : ''
        }`,
        status: task.status,
        metadata: task,
      },
    });
    edges.push({
      id: `${deliverableId}-${task.id}`,
      source: deliverableId,
      target: task.id,
      type: 'smoothstep',
    });
  }

  return { nodes, edges };
}
