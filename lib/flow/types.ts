import type { Node, Edge } from '@xyflow/react';
import type {
  Company,
  Contact,
  Deal,
  Deliverable,
  Proposal,
  Task,
  WorkOrder,
} from '@/lib/types';

export type FlowNodeType =
  | 'company'
  | 'deal'
  | 'proposal'
  | 'workOrder'
  | 'deliverable'
  | 'task';

export type FlowNode = Node<{
  label: string;
  subtitle?: string;
  status?: string;
  metadata:
    | Company
    | Contact
    | Deal
    | Proposal
    | WorkOrder
    | Deliverable
    | Task;
}>;

export type FlowNodeData = FlowNode['data'];

export type FlowEdge = Edge;

export type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};
