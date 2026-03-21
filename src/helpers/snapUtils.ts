const SNAP_THRESHOLD = 5;

interface NodeRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SnapResult {
  snappedX: number;
  snappedY: number;
  lines: { type: 'horizontal' | 'vertical'; position: number }[];
}

export function calculateSnap(
  draggingId: string,
  dragX: number,
  dragY: number,
  dragWidth: number,
  dragHeight: number,
  otherNodes: NodeRect[]
): SnapResult {
  const lines: { type: 'horizontal' | 'vertical'; position: number }[] = [];
  let snappedX = dragX;
  let snappedY = dragY;

  const dragCenterX = dragX + dragWidth / 2;
  const dragCenterY = dragY + dragHeight / 2;
  const dragRight = dragX + dragWidth;
  const dragBottom = dragY + dragHeight;

  for (const other of otherNodes) {
    if (other.id === draggingId) continue;

    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    // Vertical alignment checks (snap X)
    // Left edges
    if (Math.abs(dragX - other.x) < SNAP_THRESHOLD) {
      snappedX = other.x;
      lines.push({ type: 'vertical', position: other.x });
    }
    // Center X
    else if (Math.abs(dragCenterX - otherCenterX) < SNAP_THRESHOLD) {
      snappedX = otherCenterX - dragWidth / 2;
      lines.push({ type: 'vertical', position: otherCenterX });
    }
    // Right edges
    else if (Math.abs(dragRight - otherRight) < SNAP_THRESHOLD) {
      snappedX = otherRight - dragWidth;
      lines.push({ type: 'vertical', position: otherRight });
    }

    // Horizontal alignment checks (snap Y)
    // Top edges
    if (Math.abs(dragY - other.y) < SNAP_THRESHOLD) {
      snappedY = other.y;
      lines.push({ type: 'horizontal', position: other.y });
    }
    // Center Y
    else if (Math.abs(dragCenterY - otherCenterY) < SNAP_THRESHOLD) {
      snappedY = otherCenterY - dragHeight / 2;
      lines.push({ type: 'horizontal', position: otherCenterY });
    }
    // Bottom edges
    else if (Math.abs(dragBottom - otherBottom) < SNAP_THRESHOLD) {
      snappedY = otherBottom - dragHeight;
      lines.push({ type: 'horizontal', position: otherBottom });
    }
  }

  return { snappedX, snappedY, lines };
}
