interface Point {
  x: number;
  y: number;
}

interface Segment {
  start: Point;
  end: Point;
  edgeId: string;
}

export interface Crossover {
  x: number;
  y: number;
  edgeId: string; // the edge that should render the hop
  orientation: 'horizontal' | 'vertical'; // which direction the hop goes
}

/** Extract straight line segments from an edge's waypoints */
function getSegments(edgeId: string, points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({ start: points[i], end: points[i + 1], edgeId });
  }
  return segments;
}

/** Check if a horizontal and vertical segment intersect (strict — endpoints excluded) */
function findIntersection(h: Segment, v: Segment): Point | null {
  const hMinX = Math.min(h.start.x, h.end.x);
  const hMaxX = Math.max(h.start.x, h.end.x);
  const hY = h.start.y; // horizontal segment has constant y

  const vMinY = Math.min(v.start.y, v.end.y);
  const vMaxY = Math.max(v.start.y, v.end.y);
  const vX = v.start.x; // vertical segment has constant x

  // Check if they cross (strict inequality — endpoints do not count as crossovers)
  if (vX > hMinX && vX < hMaxX && hY > vMinY && hY < vMaxY) {
    return { x: vX, y: hY };
  }
  return null;
}

function isHorizontal(seg: Segment): boolean {
  return Math.abs(seg.start.y - seg.end.y) < 1;
}

function isVertical(seg: Segment): boolean {
  return Math.abs(seg.start.x - seg.end.x) < 1;
}

/** Find all crossover points between edges.
 *  Only edges with showHops === true participate as the "hopping" edge;
 *  all edges contribute segments that can be crossed. */
export function detectCrossovers(
  edges: { id: string; points: Point[]; showHops?: boolean }[]
): Crossover[] {
  // Collect all segments across all edges
  const allSegments: Segment[] = [];
  for (const edge of edges) {
    if (edge.points.length >= 2) {
      allSegments.push(...getSegments(edge.id, edge.points));
    }
  }

  // Build sets for quick lookup
  const hopEnabledIds = new Set(edges.filter(e => e.showHops).map(e => e.id));

  const horizontals = allSegments.filter(isHorizontal);
  const verticals = allSegments.filter(isVertical);

  const crossovers: Crossover[] = [];

  for (const h of horizontals) {
    for (const v of verticals) {
      // Segments from the same edge cannot cross each other
      if (h.edgeId === v.edgeId) continue;

      const intersection = findIntersection(h, v);
      if (!intersection) continue;

      // Render the hop on whichever of the two edges has showHops enabled.
      // Preference: horizontal edge hops over the vertical edge.
      if (hopEnabledIds.has(h.edgeId)) {
        crossovers.push({
          x: intersection.x,
          y: intersection.y,
          edgeId: h.edgeId,
          orientation: 'horizontal',
        });
      } else if (hopEnabledIds.has(v.edgeId)) {
        crossovers.push({
          x: intersection.x,
          y: intersection.y,
          edgeId: v.edgeId,
          orientation: 'vertical',
        });
      }
    }
  }

  return crossovers;
}
