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
    <>
      <svg className={styles.edgeLayer} data-testid="edge-layer">
        {edges.map((edge) => {
          const layout = layoutMap.get(edge.id);
          if (!layout || layout.points.length < 2) return null;

          const pathD = buildBezierPath(layout.points);
          const lastTwo = layout.points.slice(-2);
          const arrowPoints = getArrowheadPoints(lastTwo[1], lastTwo[0]);

          const pathClass = [
            styles.edgePath,
            edge.type === 'dashed' ? styles.edgePathDashed : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <g key={edge.id} data-testid={`edge-${edge.id}`}>
              <path d={pathD} className={pathClass} />
              <polygon points={arrowPoints} className={styles.arrowhead} />
            </g>
          );
        })}
      </svg>
      {edges.map((edge) => {
        if (!edge.label) return null;
        const layout = layoutMap.get(edge.id);
        if (!layout || layout.points.length < 2) return null;

        const midpoint = getMidpoint(layout.points);

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
          <div
            key={`label-${edge.id}`}
            data-testid={`edge-label-${edge.id}`}
            className={labelClass}
            style={{
              position: 'absolute',
              left: midpoint.x,
              top: midpoint.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {edge.label}
          </div>
        );
      })}
    </>
  );
}
