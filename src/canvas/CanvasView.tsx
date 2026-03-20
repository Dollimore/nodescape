import React, { useRef, useEffect } from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import styles from './CanvasView.module.css';

import type { CanvasBackground } from '../types';

interface CanvasViewProps {
  children: React.ReactNode;
  className?: string;
  onDragMove?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  fitView?: boolean;
  contentWidth?: number;
  contentHeight?: number;
  background?: CanvasBackground;
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
}: CanvasViewProps) {
  const { transform, onMouseDown, onMouseMove, onMouseUp, onWheel, setFitView } = usePanZoom();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fitView || !contentWidth || !contentHeight || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 40;
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    const x = (rect.width - contentWidth * scale) / 2;
    const y = (rect.height - contentHeight * scale) / 2;
    setFitView({ x, y, scale });
  }, [fitView, contentWidth, contentHeight, setFitView]);

  const handleMouseMove = (e: React.MouseEvent) => {
    onMouseMove(e);
    if (onDragMove) onDragMove(e);
  };

  const handleMouseUp = () => {
    onMouseUp();
    if (onDragEnd) onDragEnd();
  };

  return (
    <div
      ref={containerRef}
      data-testid="flow-canvas"
      className={`${styles.canvas} ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={onWheel}
    >
      <div
        className={`${styles.canvasInner} ${bgClassMap[background]}`}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Offset children back to the origin point within the oversized background */}
        <div style={{ position: 'absolute', top: 10000, left: 10000 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
