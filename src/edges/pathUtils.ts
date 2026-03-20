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

/** Minimum distance a line must travel straight out of a handle before bending */
const MIN_STUB = 30;

/** Right-angle path with rounded corners */
export function buildOrthogonalPath(points: Point[], radius: number = 12): string {
  if (points.length < 2) return '';

  const start = points[0];
  const end = points[points.length - 1];

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Determine if this is primarily vertical or horizontal
  const isVertical = Math.abs(dy) >= Math.abs(dx);

  if (Math.abs(dx) < 1 && isVertical) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (Math.abs(dy) < 1 && !isVertical) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (isVertical) {
    const dirX = dx > 0 ? 1 : -1;
    const dirY = dy > 0 ? 1 : -1;

    // Enforce minimum stub: bend point must be at least MIN_STUB from both start and end
    const halfDy = Math.abs(dy) / 2;
    const stubDist = Math.max(MIN_STUB, halfDy);
    const midY = start.y + Math.min(stubDist, Math.abs(dy) - MIN_STUB) * dirY;

    const r = Math.min(radius, Math.abs(dx) / 2, Math.abs(midY - start.y), Math.abs(end.y - midY));

    return [
      `M ${start.x} ${start.y}`,
      `L ${start.x} ${midY - r * dirY}`,
      `Q ${start.x} ${midY}, ${start.x + r * dirX} ${midY}`,
      `L ${end.x - r * dirX} ${midY}`,
      `Q ${end.x} ${midY}, ${end.x} ${midY + r * dirY}`,
      `L ${end.x} ${end.y}`,
    ].join(' ');
  } else {
    const dirX = dx > 0 ? 1 : -1;
    const dirY = dy > 0 ? 1 : -1;

    const halfDx = Math.abs(dx) / 2;
    const stubDist = Math.max(MIN_STUB, halfDx);
    const midX = start.x + Math.min(stubDist, Math.abs(dx) - MIN_STUB) * dirX;

    const r = Math.min(radius, Math.abs(dy) / 2, Math.abs(midX - start.x), Math.abs(end.x - midX));

    return [
      `M ${start.x} ${start.y}`,
      `L ${midX - r * dirX} ${start.y}`,
      `Q ${midX} ${start.y}, ${midX} ${start.y + r * dirY}`,
      `L ${midX} ${end.y - r * dirY}`,
      `Q ${midX} ${end.y}, ${midX + r * dirX} ${end.y}`,
      `L ${end.x} ${end.y}`,
    ].join(' ');
  }
}

export function getMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const mid = Math.floor(points.length / 2);
  return points[mid];
}

/** Get the midpoint along an orthogonal path (the middle of the horizontal/vertical segment) */
export function getOrthogonalMidpoint(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const isVertical = Math.abs(dy) >= Math.abs(dx);

  if (isVertical) {
    const midY = start.y + dy / 2;
    return { x: (start.x + end.x) / 2, y: midY };
  } else {
    const midX = start.x + dx / 2;
    return { x: midX, y: (start.y + end.y) / 2 };
  }
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
