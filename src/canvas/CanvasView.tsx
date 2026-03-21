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
}: CanvasViewProps) {
  const { transform, onMouseDown, onMouseMove, onMouseUp, attachWheelListener, setFitView, zoomIn, zoomOut, resetZoom } = usePanZoom();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Attach native wheel listener with { passive: false } for preventDefault
  useEffect(() => {
    attachWheelListener(containerRef.current);
    return () => attachWheelListener(null);
  }, [attachWheelListener]);

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
    onMouseMove(e);
    if (onDragMove) onDragMove(e);
    if (onConnectionMouseMove) onConnectionMouseMove(e);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    onMouseUp();
    if (onDragEnd) onDragEnd();
    if (onConnectionMouseUp) onConnectionMouseUp(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown(e);
    if (onBackgroundClick) {
      const target = e.target as HTMLElement;
      // Fire if click is directly on the canvas container or the background inner div
      // (not on a node or its children)
      if (!target.closest('[data-node-draggable]') && !target.closest('[data-node-id]')) {
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
        }}
      >
        {/* Offset must be a multiple of grid visual size (32px) so grid lines align with content */}
        <div ref={contentRef} style={{ position: 'absolute', top: 9984, left: 9984 }}>
          {children}
        </div>
      </div>
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
