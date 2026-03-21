import { useCallback, useRef, useState } from 'react';
import React from 'react';

const GRID_SIZE = 8;

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

interface NodePositions {
  [nodeId: string]: { x: number; y: number };
}

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  childIds: string[]; // children to move together (for group nodes)
  childOrigins: { [id: string]: { x: number; y: number } };
}

interface GroupInfo {
  [nodeId: string]: string[]; // groupId -> array of child nodeIds
}

export function useDragNode(
  initialPositions: NodePositions,
  scale: number,
  onPositionChange?: (positions: NodePositions) => void,
  groupChildren?: GroupInfo
) {
  const [positions, setPositions] = useState<NodePositions>(initialPositions);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<DragState | null>(null);

  const updatePositions = useCallback((newPositions: NodePositions) => {
    if (!dragState.current) {
      setPositions(newPositions);
    }
  }, []);

  const onDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const pos = positions[nodeId];
      if (!pos) return;

      // If this is a group node, capture all children origins
      const childIds = groupChildren?.[nodeId] || [];
      const childOrigins: { [id: string]: { x: number; y: number } } = {};
      for (const cid of childIds) {
        if (positions[cid]) {
          childOrigins[cid] = { ...positions[cid] };
        }
      }

      dragState.current = {
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        childIds,
        childOrigins,
      };
      setIsDragging(true);
    },
    [positions, groupChildren]
  );

  const onDragMove = useCallback(
    (e: React.MouseEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      const rawX = drag.originX + dx;
      const rawY = drag.originY + dy;
      const snappedX = snapToGrid(rawX, GRID_SIZE);
      const snappedY = snapToGrid(rawY, GRID_SIZE);

      setPositions((prev) => {
        const next = {
          ...prev,
          [drag.nodeId]: { x: snappedX, y: snappedY },
        };

        // Move children by the same delta (group drag)
        if (drag.childIds.length > 0) {
          const snapDx = snappedX - drag.originX;
          const snapDy = snappedY - drag.originY;
          for (const cid of drag.childIds) {
            const origin = drag.childOrigins[cid];
            if (origin) {
              next[cid] = {
                x: snapToGrid(origin.x + snapDx, GRID_SIZE),
                y: snapToGrid(origin.y + snapDy, GRID_SIZE),
              };
            }
          }
        }

        return next;
      });
    },
    [scale]
  );

  const onDragEnd = useCallback(() => {
    if (dragState.current) {
      dragState.current = null;
      setIsDragging(false);
      setPositions((current) => {
        if (onPositionChange) {
          onPositionChange(current);
        }
        return current;
      });
    }
  }, [onPositionChange]);

  return {
    positions,
    updatePositions,
    onDragStart,
    onDragMove,
    onDragEnd,
    isDragging,
  };
}
