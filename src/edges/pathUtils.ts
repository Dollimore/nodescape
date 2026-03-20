import type { EdgeRouting } from '../types';

export interface Point {
  x: number;
  y: number;
}

/** Build an SVG path string based on routing type */
export function buildPath(
  points: Point[],
  routing: EdgeRouting,
  cornerRadius: number = 12
): string {
  switch (routing) {
    case 'straight':
      return buildStraightPath(points);
    case 'orthogonal':
      return buildOrthogonalPath(points, cornerRadius);
    case 'curved':
    default:
      return buildBezierPath(points);
  }
}

/** Curved bezier path */
export function buildBezierPath(points: Point[]): string {
  if (points.length < 2) return '';

  const start = points[0];
  const end = points[points.length - 1];

  if (points.length === 2) {
    const midY = (start.y + end.y) / 2;
    return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
  }

  let d = `M ${start.x} ${start.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cp = points[i];
    const next = points[i + 1] || end;
    d += ` Q ${cp.x} ${cp.y}, ${(cp.x + next.x) / 2} ${(cp.y + next.y) / 2}`;
  }
  d += ` L ${end.x} ${end.y}`;
  return d;
}

/** Direct straight line */
export function buildStraightPath(points: Point[]): string {
  if (points.length < 2) return '';
  const start = points[0];
  const end = points[points.length - 1];
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

/**
 * Draw an orthogonal path through a series of waypoints with rounded corners.
 * Each consecutive pair of waypoints defines a horizontal or vertical segment.
 * Corners between segments are rounded with the given radius.
 */
export function buildOrthogonalPath(points: Point[], radius: number = 12): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Direction vectors for incoming and outgoing segments
    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;

    // Length of incoming and outgoing segments
    const inLen = Math.sqrt(inDx * inDx + inDy * inDy);
    const outLen = Math.sqrt(outDx * outDx + outDy * outDy);

    // Clamp radius to half the shortest segment
    const r = Math.min(radius, inLen / 2, outLen / 2);

    if (r < 1 || inLen < 1 || outLen < 1) {
      // Too small for rounding, just line to the point
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    // Point where we start the curve (r pixels before the corner)
    const beforeX = curr.x - (inDx / inLen) * r;
    const beforeY = curr.y - (inDy / inLen) * r;

    // Point where we end the curve (r pixels after the corner)
    const afterX = curr.x + (outDx / outLen) * r;
    const afterY = curr.y + (outDy / outLen) * r;

    d += ` L ${beforeX} ${beforeY}`;
    d += ` Q ${curr.x} ${curr.y}, ${afterX} ${afterY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
}

export function getMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const mid = Math.floor(points.length / 2);
  return points[mid];
}

export function getArrowheadPoints(
  target: Point,
  prev: Point,
  size: number = 8
): string {
  const angle = Math.atan2(target.y - prev.y, target.x - prev.x);
  const left = {
    x: target.x - size * Math.cos(angle - Math.PI / 6),
    y: target.y - size * Math.sin(angle - Math.PI / 6),
  };
  const right = {
    x: target.x - size * Math.cos(angle + Math.PI / 6),
    y: target.y - size * Math.sin(angle + Math.PI / 6),
  };
  return `${left.x},${left.y} ${target.x},${target.y} ${right.x},${right.y}`;
}
