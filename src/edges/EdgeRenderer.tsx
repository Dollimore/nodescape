import React from 'react';
import type { FlowEdge } from '../types';
import type { LayoutEdge } from '../types';
import { buildBezierPath, getMidpoint, getArrowheadPoints } from './pathUtils';
import styles from './Edge.module.css';

interface EdgeRendererProps {
  edges: FlowEdge[];
  layoutEdges: LayoutEdge[];
}

export function EdgeRenderer({ edges, layoutEdges }: EdgeRendererProps) {
  const layoutMap = new Map(layoutEdges.map((le) => [le.id, le]));

  return (
    <svg className={styles.edgeLayer} data-testid="edge-layer">
      {edges.map((edge) => {
        const layout = layoutMap.get(edge.id);
        if (!layout || layout.points.length < 2) return null;

        const pathD = buildBezierPath(layout.points);
        const midpoint = getMidpoint(layout.points);
        const lastTwo = layout.points.slice(-2);
        const arrowPoints = getArrowheadPoints(lastTwo[1], lastTwo[0]);

        const pathClass = [
          styles.edgePath,
          edge.type === 'dashed' ? styles.edgePathDashed : '',
        ]
          .filter(Boolean)
          .join(' ');

        const labelClass = [
          styles.edgeLabel,
          edge.type === 'success'
            ? styles.edgeLabelSuccess
            : edge.type === 'failure'
              ? styles.edgeLabelFailure
              : edge.type === 'dashed'
                ? styles.edgeLabelDashed
                : styles.edgeLabelDefault,
        ].join(' ');

        return (
          <g key={edge.id} data-testid={`edge-${edge.id}`}>
            <path d={pathD} className={pathClass} />
            <polygon points={arrowPoints} className={styles.arrowhead} />
            {edge.label && (
              <foreignObject
                x={midpoint.x - 40}
                y={midpoint.y - 12}
                width={80}
                height={24}
                data-testid={`edge-label-${edge.id}`}
              >
                <div className={labelClass}>{edge.label}</div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
