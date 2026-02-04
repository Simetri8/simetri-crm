import type { Node, Edge } from '@xyflow/react';

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
  metadata: any;
}>;

export type FlowEdge = Edge;

export type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};
