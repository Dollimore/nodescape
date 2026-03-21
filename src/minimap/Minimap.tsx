import React from 'react';
import type { LayoutNode } from '../types';
import styles from './Minimap.module.css';

interface MinimapProps {
  nodes: LayoutNode[];
  viewportWidth: number;
  viewportHeight: number;
  transform: { x: number; y: number; scale: number };
  layoutWidth: number;
  layoutHeight: number;
}

export function Minimap({ nodes, viewportWidth, viewportHeight, transform, layoutWidth, layoutHeight }: MinimapProps) {
  const minimapWidth = 180;
  const minimapHeight = 120;
  const padding = 10;

  // Scale factor to fit the layout into the minimap
  const scaleX = (minimapWidth - padding * 2) / (layoutWidth || 1);
  const scaleY = (minimapHeight - padding * 2) / (layoutHeight || 1);
  const minimapScale = Math.min(scaleX, scaleY);

  // Must match the offset in CanvasView (9984 = 312 * 32, grid-aligned)
  const CANVAS_ORIGIN_OFFSET = 9984;
  const vpX = ((-transform.x / transform.scale) - CANVAS_ORIGIN_OFFSET) * minimapScale + padding;
  const vpY = ((-transform.y / transform.scale) - CANVAS_ORIGIN_OFFSET) * minimapScale + padding;
  const vpW = (viewportWidth / transform.scale) * minimapScale;
  const vpH = (viewportHeight / transform.scale) * minimapScale;

  return (
    <div className={styles.minimap} data-testid="minimap">
      <svg width={minimapWidth} height={minimapHeight}>
        {/* Node rectangles */}
        {nodes.map((node) => (
          <rect
            key={node.id}
            x={node.x * minimapScale + padding}
            y={node.y * minimapScale + padding}
            width={node.width * minimapScale}
            height={node.height * minimapScale}
            className={styles.node}
          />
        ))}
        {/* Viewport indicator */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW}
          height={vpH}
          className={styles.viewport}
        />
      </svg>
    </div>
  );
}
