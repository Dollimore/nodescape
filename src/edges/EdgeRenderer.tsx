import React from 'react';
import type { FlowEdge, EdgeRouting } from '../types';
import type { LayoutEdge } from '../types';
import { buildPath, getMidpoint, getArrowheadPoints } from './pathUtils';
import styles from './Edge.module.css';

interface EdgeRendererProps {
  edges: FlowEdge[];
  layoutEdges: LayoutEdge[];
  defaultRouting?: EdgeRouting;
  cornerRadius?: number;
  isDragging?: boolean;
}

export function EdgeRenderer({ edges, layoutEdges, defaultRouting = 'curved', cornerRadius = 12, isDragging }: EdgeRendererProps) {
  const layoutMap = new Map(layoutEdges.map((le) => [le.id, le]));

  return (
    <>
      <svg className={styles.edgeLayer} data-testid="edge-layer">
        {edges.map((edge) => {
          const layout = layoutMap.get(edge.id);
          if (!layout || layout.points.length < 2) return null;

          const routing = edge.routing || defaultRouting;
          const pathD = buildPath(layout.points, routing, cornerRadius);

          const end = layout.points[layout.points.length - 1];
          const arrowPrev = layout.points[layout.points.length - 2] || layout.points[0];
          const arrowPoints = getArrowheadPoints(end, arrowPrev);

          const pathClass = [
            styles.edgePath,
            edge.type === 'dashed' ? styles.edgePathDashed : '',
            edge.animated ? styles.edgePathAnimated : '',
          ]
            .filter(Boolean)
            .join(' ');

          const edgeColor = edge.color;
          const pathStyle: React.CSSProperties = {
            ...(isDragging ? { transition: 'none' } : {}),
            ...(edgeColor ? { stroke: edgeColor } : {}),
          };
          const arrowStyle: React.CSSProperties = edgeColor ? { fill: edgeColor } : {};

          return (
            <g key={edge.id} data-testid={`edge-${edge.id}`}>
              <path d={pathD} className={pathClass} style={pathStyle} />
              <polygon points={arrowPoints} className={styles.arrowhead} style={arrowStyle} />
              {/* Directional flow pulse — a highlighted segment traveling along the path */}
              {edge.flowAnimation && (
                <path
                  d={pathD}
                  className={styles.flowPulse}
                  style={edgeColor ? { stroke: edgeColor } : undefined}
                />
              )}
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
              transition: isDragging ? 'none' : undefined,
            }}
          >
            {edge.label}
          </div>
        );
      })}
    </>
  );
}
