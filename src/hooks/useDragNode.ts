import { useCallback, useRef, useState } from 'react';
import React from 'react';

interface NodePositions {
  [nodeId: string]: { x: number; y: number };
}

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function useDragNode(
  initialPositions: NodePositions,
  scale: number,
  onPositionChange?: (positions: NodePositions) => void
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
      dragState.current = {
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
      };
      setIsDragging(true);
    },
    [positions]
  );

  const onDragMove = useCallback(
    (e: React.MouseEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      setPositions((prev) => ({
        ...prev,
        [drag.nodeId]: {
          x: drag.originX + dx,
          y: drag.originY + dy,
        },
      }));
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
