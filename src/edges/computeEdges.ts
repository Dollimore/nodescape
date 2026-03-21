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

/** Determine which handle sides to use based on relative node positions.
 *  Picks the sides that produce the shortest, most natural path. */
export function computeHandleSides(
  sourcePos: { x: number; y: number },
  sourceSize: { width: number; height: number },
  targetPos: { x: number; y: number },
  targetSize: { width: number; height: number },
  direction: string
): { sourceSide: 'top' | 'bottom' | 'left' | 'right'; targetSide: 'top' | 'bottom' | 'left' | 'right' } {
  const sourceCX = sourcePos.x + sourceSize.width / 2;
  const sourceCY = sourcePos.y + sourceSize.height / 2;
  const targetCX = targetPos.x + targetSize.width / 2;
  const targetCY = targetPos.y + targetSize.height / 2;

  const dx = Math.abs(targetCX - sourceCX);
  const dy = Math.abs(targetCY - sourceCY);

  // Use the layout direction as preference, but override when the
  // cross-axis distance is significantly larger than the main axis
  const isMainlyVertical = direction === 'TB' || direction === 'BT';
  const isMainlyHorizontal = direction === 'LR' || direction === 'RL';

  // If the target is primarily to the side (cross-axis >> main axis), use side handles
  const crossAxisDominant = isMainlyVertical ? (dx > dy * 1.5) : (dy > dx * 1.5);

  if (isMainlyVertical && !crossAxisDominant) {
    // Standard TB/BT — go vertical
    if (targetCY >= sourceCY) {
      return { sourceSide: 'bottom', targetSide: 'top' };
    } else {
      return { sourceSide: 'top', targetSide: 'bottom' };
    }
  }

  if (isMainlyHorizontal && !crossAxisDominant) {
    // Standard LR/RL — go horizontal
    if (targetCX >= sourceCX) {
      return { sourceSide: 'right', targetSide: 'left' };
    } else {
      return { sourceSide: 'left', targetSide: 'right' };
    }
  }

  // Cross-axis dominant or ambiguous — pick based on actual relative position
  if (dx >= dy) {
    // Target is mostly to the side
    if (targetCX >= sourceCX) {
      return { sourceSide: 'right', targetSide: 'left' };
    } else {
      return { sourceSide: 'left', targetSide: 'right' };
    }
  } else {
    // Target is mostly above/below
    if (targetCY >= sourceCY) {
      return { sourceSide: 'bottom', targetSide: 'top' };
    } else {
      return { sourceSide: 'top', targetSide: 'bottom' };
    }
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
      // Resolve target first so we can use its position for source side calculation
      if (targetPort) {
        end = getPortPosition(targetPos, targetSize, targetPort);
        targetSide = targetPort.side;
      } else {
        const sides = computeHandleSides(sourcePos, sourceSize, targetPos, targetSize, direction);
        targetSide = sides.targetSide;
        end = getHandlePosition(targetPos, targetSize, targetSide);
      }

      if (sourcePort) {
        start = getPortPosition(sourcePos, sourceSize, sourcePort);
        sourceSide = sourcePort.side;
      } else {
        // Pick source side that points most directly at the resolved target point
        const sourceCX = sourcePos.x + sourceSize.width / 2;
        const sourceCY = sourcePos.y + sourceSize.height / 2;
        const dx = end.x - sourceCX;
        const dy = end.y - sourceCY;

        if (Math.abs(dx) > Math.abs(dy)) {
          sourceSide = dx > 0 ? 'right' : 'left';
        } else {
          sourceSide = dy > 0 ? 'bottom' : 'top';
        }
        start = getHandlePosition(sourcePos, sourceSize, sourceSide);
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
        // Both vertical — source exits top/bottom, target enters top/bottom
        const goingDown = sourceSide === 'bottom';
        const goingUp = sourceSide === 'top';
        const targetIsAbove = end.y < start.y;
        const targetIsBelow = end.y > start.y;
        const needsWrapAround = (goingDown && targetIsAbove) || (goingUp && targetIsBelow);

        if (Math.abs(start.x - end.x) < 1 && !needsWrapAround) {
          points = [start, end];
        } else if (needsWrapAround) {
          // Route around — pick closest side that clears both nodes
          const clearRight = Math.max(sourcePos.x + sourceSize.width, targetPos.x + targetSize.width) + STUB_LENGTH;
          const clearLeft = Math.min(sourcePos.x, targetPos.x) - STUB_LENGTH;
          const clearX = (start.x - clearLeft) < (clearRight - start.x) ? clearLeft : clearRight;

          points = [
            start,
            stubOut,
            { x: clearX, y: stubOut.y },
            { x: clearX, y: stubIn.y },
            stubIn,
            end,
          ];
        } else {
          // Normal case — ensure midY doesn't pass through either node
          let midY = (stubOut.y + stubIn.y) / 2;

          // Check if midY is inside source node's vertical range
          const srcTop = sourcePos.y;
          const srcBot = sourcePos.y + sourceSize.height;
          const tgtTop = targetPos.y;
          const tgtBot = targetPos.y + targetSize.height;

          const midInsideSource = midY > srcTop && midY < srcBot;
          const midInsideTarget = midY > tgtTop && midY < tgtBot;

          if (midInsideSource || midInsideTarget) {
            // Push midY outside both nodes
            if (goingDown) {
              midY = Math.max(srcBot, tgtBot) + STUB_LENGTH;
            } else {
              midY = Math.min(srcTop, tgtTop) - STUB_LENGTH;
            }
          }

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
        // Both horizontal
        const goingRight = sourceSide === 'right';
        const goingLeft = sourceSide === 'left';
        const targetIsLeft = end.x < start.x;
        const targetIsRight = end.x > start.x;
        const needsWrapAround = (goingRight && targetIsLeft) || (goingLeft && targetIsRight);

        if (Math.abs(start.y - end.y) < 1 && !needsWrapAround) {
          points = [start, end];
        } else if (needsWrapAround) {
          const clearBottom = Math.max(sourcePos.y + sourceSize.height, targetPos.y + targetSize.height) + STUB_LENGTH;
          const clearTop = Math.min(sourcePos.y, targetPos.y) - STUB_LENGTH;
          const clearY = (start.y - clearTop) < (clearBottom - start.y) ? clearTop : clearBottom;

          points = [
            start,
            stubOut,
            { x: stubOut.x, y: clearY },
            { x: stubIn.x, y: clearY },
            stubIn,
            end,
          ];
        } else {
          // Normal case — ensure midX doesn't pass through either node
          let midX = (stubOut.x + stubIn.x) / 2;

          const srcLeft = sourcePos.x;
          const srcRight = sourcePos.x + sourceSize.width;
          const tgtLeft = targetPos.x;
          const tgtRight = targetPos.x + targetSize.width;

          const midInsideSource = midX > srcLeft && midX < srcRight;
          const midInsideTarget = midX > tgtLeft && midX < tgtRight;

          if (midInsideSource || midInsideTarget) {
            if (goingRight) {
              midX = Math.max(srcRight, tgtRight) + STUB_LENGTH;
            } else {
              midX = Math.min(srcLeft, tgtLeft) - STUB_LENGTH;
            }
          }

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
