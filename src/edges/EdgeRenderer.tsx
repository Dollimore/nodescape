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

          const isWire = edge.type === 'wire';
          const routing = isWire ? 'orthogonal' : (edge.routing || defaultRouting);
          const pathD = buildPath(layout.points, routing, cornerRadius);

          const end = layout.points[layout.points.length - 1];
          const arrowPrev = layout.points[layout.points.length - 2] || layout.points[0];
          const arrowPoints = getArrowheadPoints(end, arrowPrev);

          const pathClass = [
            styles.edgePath,
            edge.type === 'dashed' ? styles.edgePathDashed : '',
            edge.animated ? styles.edgePathAnimated : '',
            isWire ? styles.edgePathWire : '',
          ]
            .filter(Boolean)
            .join(' ');

          const edgeColor = edge.color;
          const pathStyle: React.CSSProperties = {
            ...(isDragging ? { transition: 'none' } : {}),
            ...(edgeColor ? { stroke: edgeColor } : {}),
            ...(edge.thickness ? { strokeWidth: edge.thickness } : {}),
          };
          const arrowStyle: React.CSSProperties = edgeColor ? { fill: edgeColor } : {};

          return (
            <g key={edge.id} data-testid={`edge-${edge.id}`}>
              <path d={pathD} className={pathClass} style={pathStyle} />
              {!isWire && <polygon points={arrowPoints} className={styles.arrowhead} style={arrowStyle} />}
              {/* Directional flow pulse — a highlighted segment traveling along the path */}
              {edge.flowAnimation && (
                <path
                  d={pathD}
                  className={styles.flowPulse}
                  style={edgeColor ? { stroke: edgeColor } : undefined}
                />
              )}
              {edge.showJunction && (
                <>
                  <circle cx={layout.points[0].x} cy={layout.points[0].y} r={3} className={styles.junction} style={edgeColor ? { fill: edgeColor } : undefined} />
                  <circle cx={end.x} cy={end.y} r={3} className={styles.junction} style={edgeColor ? { fill: edgeColor } : undefined} />
                </>
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
      {edges.map((edge) => {
        if (!edge.annotation) return null;
        const layout = layoutMap.get(edge.id);
        if (!layout || layout.points.length < 2) return null;

        // Find the longest segment in the path — place annotation on its midpoint.
        // This avoids collisions at shared stubs near the source/target node.
        let bestIdx = 0;
        let bestLen = 0;
        for (let i = 0; i < layout.points.length - 1; i++) {
          const sx = layout.points[i + 1].x - layout.points[i].x;
          const sy = layout.points[i + 1].y - layout.points[i].y;
          const segLen = Math.sqrt(sx * sx + sy * sy);
          if (segLen > bestLen) {
            bestLen = segLen;
            bestIdx = i;
          }
        }

        // If user specified a position, use that instead
        const idx = edge.annotationPosition !== undefined
          ? Math.min(Math.floor((layout.points.length - 1) * edge.annotationPosition), layout.points.length - 2)
          : bestIdx;

        const p1 = layout.points[idx];
        const p2 = layout.points[idx + 1] || p1;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Offset perpendicular to the segment direction
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const offsetX = (-dy / len) * 16;
        const offsetY = (dx / len) * 16;

        return (
          <div
            key={`annotation-${edge.id}`}
            className={styles.edgeAnnotation}
            style={{
              position: 'absolute',
              left: midX + offsetX,
              top: midY + offsetY,
              transform: 'translate(-50%, -50%)',
              transition: isDragging ? 'none' : undefined,
            }}
          >
            {edge.annotation}
          </div>
        );
      })}
    </>
  );
}
