import React from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import styles from './CanvasView.module.css';

interface CanvasViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CanvasView({ children, className }: CanvasViewProps) {
  const { transform, onMouseDown, onMouseMove, onMouseUp, onWheel } = usePanZoom();

  return (
    <div
      data-testid="flow-canvas"
      className={`${styles.canvas} ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        className={styles.canvasInner}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
