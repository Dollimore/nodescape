import React from 'react';
import type { FlowEdge, EdgeRouting } from '../types';
import type { LayoutEdge } from '../types';
import { buildPath, getMidpoint, getOrthogonalMidpoint, getArrowheadPoints } from './pathUtils';
import styles from './Edge.module.css';

interface EdgeRendererProps {
  edges: FlowEdge[];
  layoutEdges: LayoutEdge[];
  defaultRouting?: EdgeRouting;
  cornerRadius?: number;
}

export function EdgeRenderer({ edges, layoutEdges, defaultRouting = 'curved', cornerRadius = 12 }: EdgeRendererProps) {
  const layoutMap = new Map(layoutEdges.map((le) => [le.id, le]));

  return (
    <>
      <svg className={styles.edgeLayer} data-testid="edge-layer">
        {edges.map((edge) => {
          const layout = layoutMap.get(edge.id);
          if (!layout || layout.points.length < 2) return null;

          const routing = edge.routing || defaultRouting;
          const pathD = buildPath(layout.points, routing, cornerRadius);

          // For arrowhead direction, use the last segment
          const start = layout.points[0];
          const end = layout.points[layout.points.length - 1];
          // For orthogonal, the arrow comes from the direction of the last segment
          const arrowPrev = routing === 'orthogonal'
            ? { x: end.x, y: end.y - (end.y > start.y ? 1 : -1) }
            : layout.points[layout.points.length - 2] || start;
          const arrowPoints = getArrowheadPoints(end, arrowPrev);

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

        const routing = edge.routing || defaultRouting;
        const start = layout.points[0];
        const end = layout.points[layout.points.length - 1];

        // Position label at the visual midpoint of the path
        const midpoint = routing === 'orthogonal'
          ? getOrthogonalMidpoint(start, end)
          : getMidpoint(layout.points);

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
