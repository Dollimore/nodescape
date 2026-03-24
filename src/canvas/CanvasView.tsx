import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Minimap } from '../minimap/Minimap';
import { ZoomControls } from '../controls/ZoomControls';
import styles from './CanvasView.module.css';

import type { CanvasBackground, LayoutNode } from '../types';

interface CanvasViewProps {
  children: React.ReactNode;
  className?: string;
  onDragMove?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  fitView?: boolean;
  contentWidth?: number;
  contentHeight?: number;
  background?: CanvasBackground;
  minimapEnabled?: boolean;
  minimapConfig?: object;
  layoutNodes?: LayoutNode[];
  layoutWidth?: number;
  layoutHeight?: number;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  zoomControls?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onBackgroundClick?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onConnectionMouseMove?: (e: React.MouseEvent) => void;
  onConnectionMouseUp?: (e: React.MouseEvent) => void;
  onLassoSelect?: (nodeIds: string[]) => void;
  onZoomChange?: (scale: number) => void;
  zoomToNodeId?: string | null;
  nodePositions?: Record<string, { x: number; y: number }>;
}

const bgClassMap: Record<CanvasBackground, string> = {
  dots: styles.dotGrid,
  isometric: styles.isometricDots,
  plain: styles.plain,
};

export function CanvasView({
  children,
  className,
  onDragMove,
  onDragEnd,
  fitView,
  contentWidth,
  contentHeight,
  background = 'dots',
  minimapEnabled = false,
  layoutNodes,
  layoutWidth,
  layoutHeight,
  contentRef,
  onDrop,
  onDragOver,
  zoomControls = false,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBackgroundClick,
  onDelete,
  onCopy,
  onPaste,
  onConnectionMouseMove,
  onConnectionMouseUp,
  onLassoSelect,
  onZoomChange,
  zoomToNodeId,
  nodePositions,
}: CanvasViewProps) {
  const { transform, onMouseDown, onMouseMove, onMouseUp, attachWheelListener, attachTouchListeners, setFitView, zoomIn, zoomOut, resetZoom } = usePanZoom();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [lassoState, setLassoState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const transformRef = useRef(transform);

  // Attach native wheel and touch listeners with { passive: false } for preventDefault
  useEffect(() => {
    attachWheelListener(containerRef.current);
    attachTouchListeners(containerRef.current);
    return () => {
      attachWheelListener(null);
      attachTouchListeners(null);
    };
  }, [attachWheelListener, attachTouchListeners]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keep transformRef up-to-date so lasso selection can read latest transform
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Notify parent when zoom scale changes
  useEffect(() => {
    if (onZoomChange) onZoomChange(transform.scale);
  }, [transform.scale, onZoomChange]);

  // Pan and zoom to center a specific node when story step changes
  useEffect(() => {
    if (!zoomToNodeId || !containerRef.current) return;

    // zoomToNodeId may be "nodeId__trigger" composite — extract the real nodeId
    const realNodeId = zoomToNodeId.split('__')[0];

    // Try to find the actual DOM node to get its real size
    const nodeEl = containerRef.current.querySelector(`[data-node-id="${realNodeId}"]`) as HTMLElement | null;
    if (!nodePositions?.[realNodeId]) return;

    const pos = nodePositions[realNodeId];
    const containerRect = containerRef.current.getBoundingClientRect();

    // Get node dimensions from DOM or estimate
    const nodeW = nodeEl ? nodeEl.offsetWidth : 160;
    const nodeH = nodeEl ? nodeEl.offsetHeight : 80;

    // Zoom to a comfortable reading level
    const targetScale = 1.2;

    // Center the node in the VISIBLE area (above the story panel)
    // Story panel is ~180px tall at the bottom
    const storyPanelHeight = 180;
    const visibleHeight = containerRect.height - storyPanelHeight;

    // Center of the node should be at center of the visible area
    const nodeCenterX = pos.x + nodeW / 2;
    const nodeCenterY = pos.y + nodeH / 2;

    setFitView({
      x: containerRect.width / 2 - nodeCenterX * targetScale,
      y: visibleHeight / 2 - nodeCenterY * targetScale,
      scale: targetScale,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomToNodeId]);

  const applyFitView = useCallback(() => {
    if (!contentWidth || !contentHeight || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 40;
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    const x = (rect.width - contentWidth * scale) / 2;
    const y = (rect.height - contentHeight * scale) / 2;
    setFitView({ x, y, scale });
  }, [contentWidth, contentHeight, setFitView]);

  useEffect(() => {
    if (!fitView) return;
    applyFitView();
  }, [fitView, applyFitView]);

  useKeyboardShortcuts(containerRef, {
    onFitView: applyFitView,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    onUndo,
    onRedo,
    onDelete,
    onCopy,
    onPaste,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (lassoState) {
      setLassoState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      return;
    }
    onMouseMove(e);
    if (onDragMove) onDragMove(e);
    if (onConnectionMouseMove) onConnectionMouseMove(e);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (lassoState) {
      // Determine selected nodes by checking which node DOM elements intersect the lasso rect
      if (onLassoSelect && containerRef.current) {
        const lassoRect = {
          left: Math.min(lassoState.startX, lassoState.currentX),
          top: Math.min(lassoState.startY, lassoState.currentY),
          right: Math.max(lassoState.startX, lassoState.currentX),
          bottom: Math.max(lassoState.startY, lassoState.currentY),
        };

        const nodeEls = containerRef.current.querySelectorAll<HTMLElement>('[data-node-id]');
        const selectedIds: string[] = [];
        nodeEls.forEach(el => {
          const nodeId = el.getAttribute('data-node-id');
          if (!nodeId) return;
          const r = el.getBoundingClientRect();
          if (
            r.left < lassoRect.right &&
            r.right > lassoRect.left &&
            r.top < lassoRect.bottom &&
            r.bottom > lassoRect.top
          ) {
            selectedIds.push(nodeId);
          }
        });

        if (selectedIds.length > 0) {
          onLassoSelect(selectedIds);
        }
      }
      setLassoState(null);
      return;
    }
    onMouseUp();
    if (onDragEnd) onDragEnd();
    if (onConnectionMouseUp) onConnectionMouseUp(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('[data-node-draggable]') || target.closest('[data-node-id]');

    // Alt + drag on background = lasso select
    if (e.altKey && !isOnNode) {
      e.preventDefault();
      setLassoState({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
      return;
    }

    onMouseDown(e);
    if (onBackgroundClick) {
      // Fire if click is directly on the canvas container or the background inner div
      // (not on a node or its children)
      if (!isOnNode) {
        onBackgroundClick();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="flow-canvas"
      className={`${styles.canvas} ${className || ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div
        className={`${styles.canvasInner} ${bgClassMap[background]}`}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: zoomToNodeId ? 'transform 0.6s ease' : undefined,
        }}
      >
        {/* Offset must be a multiple of grid visual size (32px) so grid lines align with content */}
        <div ref={contentRef} style={{ position: 'absolute', top: 9984, left: 9984 }}>
          {children}
        </div>
      </div>
      {lassoState && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(lassoState.startX, lassoState.currentX),
            top: Math.min(lassoState.startY, lassoState.currentY),
            width: Math.abs(lassoState.currentX - lassoState.startX),
            height: Math.abs(lassoState.currentY - lassoState.startY),
            border: '1px solid #3b82f6',
            background: 'rgba(59, 130, 246, 0.08)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      {minimapEnabled && layoutNodes && layoutNodes.length > 0 && (
        <Minimap
          nodes={layoutNodes}
          viewportWidth={containerSize.width}
          viewportHeight={containerSize.height}
          transform={transform}
          layoutWidth={layoutWidth || 0}
          layoutHeight={layoutHeight || 0}
        />
      )}
      {zoomControls && (
        <ZoomControls
          scale={transform.scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onFitView={applyFitView}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}
    </div>
  );
}
