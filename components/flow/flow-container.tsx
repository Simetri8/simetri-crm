'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CompanyNode } from './nodes/company-node';
import { DealNode } from './nodes/deal-node';
import { ProposalNode } from './nodes/proposal-node';
import { WorkOrderNode } from './nodes/work-order-node';
import { DeliverableNode } from './nodes/deliverable-node';
import { TaskNode } from './nodes/task-node';
import { getLayoutedElements } from '@/lib/flow/layout';
import {
  fetchDeliverableTasks,
  fetchWorkOrderDeliverables,
} from '@/lib/flow/data-fetcher';
import { Button } from '@/components/ui/button';

const nodeTypes: any = {
  company: CompanyNode,
  deal: DealNode,
  proposal: ProposalNode,
  workOrder: WorkOrderNode,
  deliverable: DeliverableNode,
  task: TaskNode,
};

type FlowContainerProps = {
  initialNodes: Node[];
  initialEdges: Edge[];
};

export function FlowContainer({
  initialNodes,
  initialEdges,
}: FlowContainerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowInstanceRef = useRef<any>(null);

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(
    null
  );
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<
    string | null
  >(null);
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'TB'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const layoutAndSet = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nextNodes, nextEdges, 'TB');
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [setEdges, setNodes]
  );

  const resetLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      'TB'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    window.requestAnimationFrame(() => {
      reactFlowInstanceRef.current?.fitView?.({ padding: 0.2, duration: 300 });
    });
  }, [edges, nodes, setEdges, setNodes]);

  const nodeById = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const removeNodesByType = useCallback(
    (typesToRemove: Set<string>, baseNodes: Node[], baseEdges: Edge[]) => {
      const removeIds = new Set(
        baseNodes.filter((n) => typesToRemove.has(n.type || '')).map((n) => n.id)
      );

      const nextNodes = baseNodes.filter((n) => !removeIds.has(n.id));
      const nextEdges = baseEdges.filter(
        (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
      );

      return { nextNodes, nextEdges };
    },
    []
  );

  const handleNodeClick = useCallback(
    async (_: unknown, node: Node) => {
      if (loadingChildren) return;

      if (node.type === 'workOrder') {
        if (selectedWorkOrderId === node.id) return;

        setLoadingChildren(true);
        setSelectedWorkOrderId(node.id);
        setSelectedDeliverableId(null);

        try {
          // Remove any previously loaded deliverables/tasks before loading new deliverables.
          const { nextNodes, nextEdges } = removeNodesByType(
            new Set(['deliverable', 'task']),
            nodes,
            edges
          );

          const delivData = await fetchWorkOrderDeliverables(node.id);

          const mergedNodes = [...nextNodes, ...delivData.nodes];
          const mergedEdges = [...nextEdges, ...delivData.edges];
          layoutAndSet(mergedNodes, mergedEdges);
        } catch (err) {
          console.error('Error loading deliverables:', err);
        } finally {
          setLoadingChildren(false);
        }
      }

      if (node.type === 'deliverable') {
        if (!selectedWorkOrderId) return;
        if (selectedDeliverableId === node.id) return;

        // Guard: ensure deliverable node still exists
        if (!nodeById.has(node.id)) return;

        setLoadingChildren(true);
        setSelectedDeliverableId(node.id);

        try {
          // Remove any previously loaded tasks before loading new tasks.
          const { nextNodes, nextEdges } = removeNodesByType(
            new Set(['task']),
            nodes,
            edges
          );

          const taskData = await fetchDeliverableTasks(
            selectedWorkOrderId,
            node.id
          );

          const mergedNodes = [...nextNodes, ...taskData.nodes];
          const mergedEdges = [...nextEdges, ...taskData.edges];
          layoutAndSet(mergedNodes, mergedEdges);
        } catch (err) {
          console.error('Error loading tasks:', err);
        } finally {
          setLoadingChildren(false);
        }
      }
    },
    [
      edges,
      layoutAndSet,
      loadingChildren,
      nodeById,
      nodes,
      removeNodesByType,
      selectedDeliverableId,
      selectedWorkOrderId,
    ]
  );

  const getNodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'company':
        return '#e2e8f0';
      case 'deal':
        return '#dbeafe';
      case 'proposal':
        return '#e9d5ff';
      case 'workOrder':
        return '#fef3c7';
      case 'deliverable':
        return '#e0e7ff';
      case 'task':
        return '#f3f4f6';
      default:
        return '#e5e7eb';
    }
  }, []);

  return (
    <div className="w-full h-screen relative">
      <div className="absolute right-4 top-4 z-10">
        <Button
          size="sm"
          variant="secondary"
          disabled={loadingChildren}
          onClick={(e) => {
            e.stopPropagation();
            resetLayout();
          }}
        >
          Reset
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 200, y: 50, zoom: 0.6 }}
        minZoom={0.1}
        maxZoom={2}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={getNodeColor} />
      </ReactFlow>
    </div>
  );
}
