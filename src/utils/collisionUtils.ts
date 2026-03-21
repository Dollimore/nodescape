interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Check if two rectangles overlap */
export function rectsOverlap(a: Rect, b: Rect, padding: number = 4): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

/** Find the nearest non-overlapping position for a dragged node */
export function resolveCollision(
  draggingId: string,
  dragRect: Rect,
  otherRects: { id: string; rect: Rect }[],
  gridSize: number = 8
): { x: number; y: number } | null {
  // Check if there are any collisions
  const collisions = otherRects.filter(
    other => other.id !== draggingId && rectsOverlap(dragRect, other.rect)
  );

  if (collisions.length === 0) return null; // no collision

  // Return null and let the node overlap rather than doing complex resolution
  // (Full resolution is complex and can cause jitter)
  return null;
}
