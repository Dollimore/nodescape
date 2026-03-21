import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import type { FlowDiagram, LayoutResult, LayoutNode, LayoutEdge } from '../types';

const GRID = 8;
const snapTo = (v: number) => Math.round(v / GRID) * GRID;
const snapUp = (v: number) => Math.ceil(v / GRID) * GRID;

export function computeForceLayout(
  diagram: FlowDiagram,
  width: number,
  height: number
): LayoutResult {
  // Measure node sizes using defaults (no DOM access in standalone function)
  const nodeSizes = new Map<string, { width: number; height: number }>();
  for (const node of diagram.nodes) {
    if (node.type === 'group') continue;
    nodeSizes.set(node.id, { width: snapUp(192), height: snapUp(64) });
  }

  // Build simulation nodes
  const simNodes = diagram.nodes
    .filter(n => n.type !== 'group')
    .map(n => ({
      id: n.id,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      ...(nodeSizes.get(n.id) || { width: 192, height: 64 }),
    }));

  const nodeMap = new Map(simNodes.map(n => [n.id, n]));

  // Build simulation links
  const simLinks = diagram.edges
    .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
    .map(e => ({ source: e.source, target: e.target }));

  const simulation = forceSimulation(simNodes as any)
    .force('link', forceLink(simLinks as any).id((d: any) => d.id).distance(150))
    .force('charge', forceManyBody().strength(-400))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide().radius((d: any) => Math.max(d.width, d.height) / 2 + 20))
    .stop();

  // Run synchronously
  for (let i = 0; i < 300; i++) simulation.tick();

  const layoutNodes: LayoutNode[] = simNodes.map(n => ({
    id: n.id,
    x: snapTo((n as any).x - n.width / 2),
    y: snapTo((n as any).y - n.height / 2),
    width: n.width,
    height: n.height,
  }));

  // Simple edge points — just start and end centers
  const layoutEdges: LayoutEdge[] = diagram.edges.map(edge => {
    const src = layoutNodes.find(n => n.id === edge.source);
    const tgt = layoutNodes.find(n => n.id === edge.target);
    if (!src || !tgt) return { id: edge.id, source: edge.source, target: edge.target, points: [] };
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: [
        { x: src.x + src.width / 2, y: src.y + src.height / 2 },
        { x: tgt.x + tgt.width / 2, y: tgt.y + tgt.height / 2 },
      ],
    };
  });

  // Compute overall bounds
  const xs = layoutNodes.map(n => [n.x, n.x + n.width]).flat();
  const ys = layoutNodes.map(n => [n.y, n.y + n.height]).flat();

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: Math.max(...xs) - Math.min(...xs) + 100,
    height: Math.max(...ys) - Math.min(...ys) + 100,
  };
}
