import type { FlowDiagram, FlowNode, LayoutEdge, LayoutNode, NodePort } from '../types';

/** Minimum distance a line extends straight out from a handle before bending */
export const STUB_LENGTH = 30;

/** Get the fixed handle position for a node edge connection */
export function getHandlePosition(
  pos: { x: number; y: number },
  size: { width: number; height: number },
  side: 'top' | 'bottom' | 'left' | 'right'
): { x: number; y: number } {
  const cx = pos.x + size.width / 2;
  const cy = pos.y + size.height / 2;
  switch (side) {
    case 'top': return { x: cx, y: pos.y };
    case 'bottom': return { x: cx, y: pos.y + size.height };
    case 'left': return { x: pos.x, y: cy };
    case 'right': return { x: pos.x + size.width, y: cy };
  }
}

/** Compute exact position for a specific port on a node */
function getPortPosition(
  nodePos: { x: number; y: number },
  nodeSize: { width: number; height: number },
  port: NodePort
): { x: number; y: number } {
  const pos = port.position ?? 0.5;
  switch (port.side) {
    case 'top':
      return { x: nodePos.x + nodeSize.width * pos, y: nodePos.y };
    case 'bottom':
      return { x: nodePos.x + nodeSize.width * pos, y: nodePos.y + nodeSize.height };
    case 'left':
      return { x: nodePos.x, y: nodePos.y + nodeSize.height * pos };
    case 'right':
      return { x: nodePos.x + nodeSize.width, y: nodePos.y + nodeSize.height * pos };
  }
}

/** Determine which handle sides to use based on initial layout positions (locked once) */
export function computeHandleSides(
  sourcePos: { x: number; y: number },
  sourceSize: { width: number; height: number },
  targetPos: { x: number; y: number },
  targetSize: { width: number; height: number },
  direction: string
): { sourceSide: 'top' | 'bottom' | 'left' | 'right'; targetSide: 'top' | 'bottom' | 'left' | 'right' } {
  // For TB/BT layouts, default to bottom->top
  // For LR/RL layouts, default to right->left
  if (direction === 'LR' || direction === 'RL') {
    const sourceCX = sourcePos.x + sourceSize.width / 2;
    const targetCX = targetPos.x + targetSize.width / 2;
    if (targetCX >= sourceCX) {
      return { sourceSide: 'right', targetSide: 'left' };
    } else {
      return { sourceSide: 'left', targetSide: 'right' };
    }
  }

  // TB (default) / BT
  const sourceCY = sourcePos.y + sourceSize.height / 2;
  const targetCY = targetPos.y + targetSize.height / 2;
  if (targetCY >= sourceCY) {
    return { sourceSide: 'bottom', targetSide: 'top' };
  } else {
    return { sourceSide: 'top', targetSide: 'bottom' };
  }
}

/** Get the stub direction vector for a handle side */
export function getStubDirection(side: 'top' | 'bottom' | 'left' | 'right'): { dx: number; dy: number } {
  switch (side) {
    case 'top': return { dx: 0, dy: -1 };
    case 'bottom': return { dx: 0, dy: 1 };
    case 'left': return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
  }
}

/** Compute edge waypoints dynamically from current node positions + sizes.
 *  For orthogonal routing, generates proper waypoints with stubs and right-angle segments.
 *  Handle sides are locked from the initial layout to prevent jumping. */
export function computeDynamicEdges(
  edges: FlowDiagram['edges'],
  positions: { [id: string]: { x: number; y: number } },
  layoutNodes: LayoutNode[],
  initialPositions: { [id: string]: { x: number; y: number } },
  direction: string,
  routing: string,
  nodes?: FlowNode[]
): LayoutEdge[] {
  const nodeSizes = new Map(layoutNodes.map((n) => [n.id, { width: n.width, height: n.height }]));

  // Build a map from node ID to FlowNode for port lookups
  const nodeMap = new Map<string, FlowNode>();
  if (nodes) {
    for (const n of nodes) {
      nodeMap.set(n.id, n);
    }
  }

  return edges.map((edge) => {
    const sourcePos = positions[edge.source];
    const targetPos = positions[edge.target];
    const sourceSize = nodeSizes.get(edge.source);
    const targetSize = nodeSizes.get(edge.target);

    if (!sourcePos || !targetPos || !sourceSize || !targetSize) {
      return { id: edge.id, source: edge.source, target: edge.target, points: [] };
    }

    // Resolve port-based positions if specified
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const sourcePort = edge.sourcePort && sourceNode?.ports?.find(p => p.id === edge.sourcePort);
    const targetPort = edge.targetPort && targetNode?.ports?.find(p => p.id === edge.targetPort);

    let start: { x: number; y: number };
    let end: { x: number; y: number };
    let sourceSide: 'top' | 'bottom' | 'left' | 'right';
    let targetSide: 'top' | 'bottom' | 'left' | 'right';

    if (sourcePort || targetPort) {
      // When ports are specified, use port positions and sides
      if (sourcePort) {
        start = getPortPosition(sourcePos, sourceSize, sourcePort);
        sourceSide = sourcePort.side;
      } else {
        const initSource = initialPositions[edge.source] || sourcePos;
        const initTarget = initialPositions[edge.target] || targetPos;
        const sides = computeHandleSides(initSource, sourceSize, initTarget, targetSize, direction);
        sourceSide = sides.sourceSide;
        start = getHandlePosition(sourcePos, sourceSize, sourceSide);
      }

      if (targetPort) {
        end = getPortPosition(targetPos, targetSize, targetPort);
        targetSide = targetPort.side;
      } else {
        const initSource = initialPositions[edge.source] || sourcePos;
        const initTarget = initialPositions[edge.target] || targetPos;
        const sides = computeHandleSides(initSource, sourceSize, initTarget, targetSize, direction);
        targetSide = sides.targetSide;
        end = getHandlePosition(targetPos, targetSize, targetSide);
      }
    } else {
      // No ports — use standard handle-based positions
      const initSource = initialPositions[edge.source] || sourcePos;
      const initTarget = initialPositions[edge.target] || targetPos;
      const sides = computeHandleSides(initSource, sourceSize, initTarget, targetSize, direction);
      sourceSide = sides.sourceSide;
      targetSide = sides.targetSide;
      start = getHandlePosition(sourcePos, sourceSize, sourceSide);
      end = getHandlePosition(targetPos, targetSize, targetSide);
    }

    const edgeRouting = edge.routing || routing;

    if (edgeRouting === 'orthogonal') {
      // Generate orthogonal waypoints: start -> stubOut -> bend(s) -> stubIn -> end
      const srcDir = getStubDirection(sourceSide);
      const tgtDir = getStubDirection(targetSide);

      // Stub points: extend straight out from handle
      const stubOut = { x: start.x + srcDir.dx * STUB_LENGTH, y: start.y + srcDir.dy * STUB_LENGTH };
      const stubIn = { x: end.x + tgtDir.dx * STUB_LENGTH, y: end.y + tgtDir.dy * STUB_LENGTH };

      // Determine if source and target exit/enter on same axis
      const srcIsVertical = sourceSide === 'top' || sourceSide === 'bottom';
      const tgtIsVertical = targetSide === 'top' || targetSide === 'bottom';

      let points: { x: number; y: number }[];

      if (srcIsVertical && tgtIsVertical) {
        // Both vertical (e.g., bottom->top in TB layout)
        // Path: start -> stubOut -> (stubOut.x, midY) -> (stubIn.x, midY) -> stubIn -> end
        const midY = (stubOut.y + stubIn.y) / 2;
        if (Math.abs(start.x - end.x) < 1) {
          // Aligned — straight line
          points = [start, end];
        } else {
          points = [
            start,
            stubOut,
            { x: stubOut.x, y: midY },
            { x: stubIn.x, y: midY },
            stubIn,
            end,
          ];
        }
      } else if (!srcIsVertical && !tgtIsVertical) {
        // Both horizontal (e.g., right->left in LR layout)
        const midX = (stubOut.x + stubIn.x) / 2;
        if (Math.abs(start.y - end.y) < 1) {
          points = [start, end];
        } else {
          points = [
            start,
            stubOut,
            { x: midX, y: stubOut.y },
            { x: midX, y: stubIn.y },
            stubIn,
            end,
          ];
        }
      } else {
        // Mixed: one vertical, one horizontal — single bend
        if (srcIsVertical) {
          // Go vertical from source, then horizontal to target
          points = [
            start,
            stubOut,
            { x: stubOut.x, y: stubIn.y },
            stubIn,
            end,
          ];
        } else {
          // Go horizontal from source, then vertical to target
          points = [
            start,
            stubOut,
            { x: stubIn.x, y: stubOut.y },
            stubIn,
            end,
          ];
        }
      }

      return { id: edge.id, source: edge.source, target: edge.target, points };
    }

    // For curved/straight: just start, midpoint, end
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: [start, { x: midX, y: midY }, end],
    };
  });
}
