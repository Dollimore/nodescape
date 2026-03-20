export interface Point {
  x: number;
  y: number;
}

export function buildBezierPath(points: Point[]): string {
  if (points.length < 2) return '';

  const start = points[0];
  const end = points[points.length - 1];

  if (points.length === 2) {
    const midY = (start.y + end.y) / 2;
    return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
  }

  // Use dagre control points
  let d = `M ${start.x} ${start.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cp = points[i];
    const next = points[i + 1] || end;
    d += ` Q ${cp.x} ${cp.y}, ${(cp.x + next.x) / 2} ${(cp.y + next.y) / 2}`;
  }
  d += ` L ${end.x} ${end.y}`;
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
