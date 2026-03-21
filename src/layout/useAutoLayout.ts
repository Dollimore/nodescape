import { useEffect, useRef, useState } from 'react';
import * as dagre from 'dagre';
import type { FlowDiagram, LayoutResult, LayoutNode, LayoutEdge } from '../types';

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 60;

export function useAutoLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult | null {
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const computedRef = useRef(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const result = computeLayout(diagram, nodeRefs);
      setLayout(result);
      computedRef.current = true;
    });
    return () => cancelAnimationFrame(rafId);
  }, [diagram, nodeRefs]);

  return layout;
}

export function computeLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  const direction = diagram.layout?.direction || 'TB';
  const nodeSpacing = diagram.layout?.nodeSpacing ?? 80;
  const rankSpacing = diagram.layout?.rankSpacing ?? 100;

  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 40,
    marginy: 40,
  });

  for (const node of diagram.nodes) {
    if (node.type === 'group') continue; // groups are positioned after layout
    const el = nodeRefs.get(node.id);
    const width = el ? el.offsetWidth : DEFAULT_NODE_WIDTH;
    const height = el ? el.offsetHeight : DEFAULT_NODE_HEIGHT;
    g.setNode(node.id, { width, height });
  }

  for (const edge of diagram.edges) {
    g.setEdge(edge.source, edge.target, { id: edge.id });
  }

  dagre.layout(g);

  const layoutNodes: LayoutNode[] = diagram.nodes
    .filter((node) => node.type !== 'group')
    .map((node) => {
      const dagreNode = g.node(node.id);
      return {
        id: node.id,
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y - dagreNode.height / 2,
        width: dagreNode.width,
        height: dagreNode.height,
      };
    });

  // Compute group node positions from children bounding boxes
  for (const node of diagram.nodes) {
    if (node.type !== 'group') continue;
    const children = diagram.nodes.filter(n => n.parentId === node.id);
    const childLayouts = layoutNodes.filter(ln => children.some(c => c.id === ln.id));

    if (childLayouts.length === 0) {
      layoutNodes.push({ id: node.id, x: 0, y: 0, width: 200, height: 100 });
      continue;
    }

    const padding = 24;
    const headerHeight = 36;
    const minX = Math.min(...childLayouts.map(c => c.x)) - padding;
    const minY = Math.min(...childLayouts.map(c => c.y)) - padding - headerHeight;
    const maxX = Math.max(...childLayouts.map(c => c.x + c.width)) + padding;
    const maxY = Math.max(...childLayouts.map(c => c.y + c.height)) + padding;

    layoutNodes.push({
      id: node.id,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  const layoutEdges: LayoutEdge[] = diagram.edges.map((edge) => {
    const dagreEdge = g.edge(edge.source, edge.target);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: dagreEdge?.points || [],
    };
  });

  const graphInfo = g.graph();

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: graphInfo.width || 0,
    height: graphInfo.height || 0,
  };
}
