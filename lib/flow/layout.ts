import dagre from 'dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const NODE_DIMENSIONS = {
  company: { width: 280, height: 80 },
  deal: { width: 260, height: 90 },
  proposal: { width: 240, height: 80 },
  workOrder: { width: 280, height: 100 },
  deliverable: { width: 240, height: 80 },
  task: { width: 220, height: 70 },
  default: { width: 200, height: 60 },
};

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'TB'
) {
  console.log(`🎯 Layout starting: ${nodes.length} nodes, ${edges.length} edges, direction: ${direction}`);

  const isHorizontal = direction === 'LR';
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    // Dagre zaten node width/height'i dikkate alır; burada "makul" boşluklar yeterli.
    ranksep: 120,
    nodesep: 80,
    edgesep: 20,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const type = node.type as keyof typeof NODE_DIMENSIONS;
    const dimensions = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;
    dagreGraph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const type = node.type as keyof typeof NODE_DIMENSIONS;
    const dimensions = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        // React Flow sol-üst baz alır; Dagre merkez baz alır.
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
      style: {
        width: dimensions.width,
        height: dimensions.height,
        ...(node.style || {}),
      },
    };
  });

  // Log nodes by type
  const nodesByType: Record<string, number> = {};
  layoutedNodes.forEach((node) => {
    nodesByType[node.type || 'unknown'] = (nodesByType[node.type || 'unknown'] || 0) + 1;
  });

  console.log('📊 Layout complete - Nodes by type:', nodesByType);
  console.log('📍 First 10 node positions:',
    layoutedNodes.slice(0, 10).map(n =>
      `${n.type}:${(n.data as { label: string }).label.substring(0, 15)} @(${Math.round(n.position.x)},${Math.round(n.position.y)})`
    )
  );

  return { nodes: layoutedNodes, edges };
}
