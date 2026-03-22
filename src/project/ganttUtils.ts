import type { ProjectTask, TimeScale, DependencyType } from './types';

export interface HeaderItem {
  label: string;
  start: Date;
  end: Date;
  width: number;
}

export interface TaskRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
}

const COLUMN_WIDTHS: Record<TimeScale, number> = {
  day: 40,
  week: 80,
  month: 120,
  quarter: 200,
  year: 300,
};

export function getColumnWidth(scale: TimeScale): number {
  return COLUMN_WIDTHS[scale];
}

/**
 * Calculate the full date range for the chart, adding padding on both sides.
 */
export function getDateRange(tasks: ProjectTask[]): { start: Date; end: Date } {
  if (!tasks.length) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 3, 0),
    };
  }

  let earliest = Infinity;
  let latest = -Infinity;

  for (const t of tasks) {
    const s = new Date(t.startDate).getTime();
    const e = new Date(t.endDate).getTime();
    if (s < earliest) earliest = s;
    if (e > latest) latest = e;
    if (t.baselineStart) {
      const bs = new Date(t.baselineStart).getTime();
      if (bs < earliest) earliest = bs;
    }
    if (t.baselineEnd) {
      const be = new Date(t.baselineEnd).getTime();
      if (be > latest) latest = be;
    }
  }

  const startDate = new Date(earliest);
  const endDate = new Date(latest);

  // Add padding: 7 days before and after
  startDate.setDate(startDate.getDate() - 7);
  endDate.setDate(endDate.getDate() + 7);

  return { start: startDate, end: endDate };
}

/**
 * Convert a Date to an x pixel position on the timeline.
 */
export function dateToX(date: Date, startDate: Date, columnWidth: number, scale: TimeScale): number {
  const ms = date.getTime() - startDate.getTime();
  const days = ms / (1000 * 60 * 60 * 24);

  switch (scale) {
    case 'day':
      return days * columnWidth;
    case 'week':
      return (days / 7) * columnWidth;
    case 'month':
      return (days / 30.44) * columnWidth;
    case 'quarter':
      return (days / 91.31) * columnWidth;
    case 'year':
      return (days / 365.25) * columnWidth;
  }
}

/**
 * Convert an x pixel position back to a Date.
 */
export function xToDate(x: number, startDate: Date, columnWidth: number, scale: TimeScale): Date {
  let days: number;

  switch (scale) {
    case 'day':
      days = x / columnWidth;
      break;
    case 'week':
      days = (x / columnWidth) * 7;
      break;
    case 'month':
      days = (x / columnWidth) * 30.44;
      break;
    case 'quarter':
      days = (x / columnWidth) * 91.31;
      break;
    case 'year':
      days = (x / columnWidth) * 365.25;
      break;
  }

  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + Math.round(days));
  return result;
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Generate dual-row time headers based on the selected scale.
 */
export function generateTimeHeaders(
  start: Date,
  end: Date,
  scale: TimeScale,
): { primary: HeaderItem[]; secondary: HeaderItem[] } {
  const primary: HeaderItem[] = [];
  const secondary: HeaderItem[] = [];
  const colW = COLUMN_WIDTHS[scale];

  switch (scale) {
    case 'day': {
      // Primary: months, Secondary: days
      const cursor = new Date(start);
      while (cursor <= end) {
        const dayStart = new Date(cursor);
        const dayEnd = new Date(cursor);
        dayEnd.setDate(dayEnd.getDate() + 1);
        secondary.push({
          label: cursor.getDate().toString(),
          start: dayStart,
          end: dayEnd,
          width: colW,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      // Primary months
      const mCursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (mCursor <= end) {
        const mStart = new Date(mCursor);
        const mEnd = new Date(mCursor.getFullYear(), mCursor.getMonth() + 1, 0);
        const startClamp = mStart < start ? start : mStart;
        const endClamp = mEnd > end ? end : mEnd;
        const daysSpan = Math.max(1, Math.ceil((endClamp.getTime() - startClamp.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        primary.push({
          label: mStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
          start: startClamp,
          end: endClamp,
          width: daysSpan * colW,
        });
        mCursor.setMonth(mCursor.getMonth() + 1);
      }
      break;
    }

    case 'week': {
      // Primary: months, Secondary: week numbers
      const cursor = new Date(start);
      // Align to Monday
      const dayOfWeek = cursor.getDay();
      cursor.setDate(cursor.getDate() - ((dayOfWeek + 6) % 7));
      while (cursor <= end) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekNum = getWeekNumber(weekStart);
        secondary.push({
          label: `W${weekNum}`,
          start: weekStart,
          end: weekEnd,
          width: colW,
        });
        cursor.setDate(cursor.getDate() + 7);
      }
      // Primary months
      const mCursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (mCursor <= end) {
        const mStart = new Date(mCursor);
        const mEnd = new Date(mCursor.getFullYear(), mCursor.getMonth() + 1, 0);
        const startClamp = mStart < start ? start : mStart;
        const endClamp = mEnd > end ? end : mEnd;
        const daysSpan = Math.max(1, Math.ceil((endClamp.getTime() - startClamp.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const weeksSpan = daysSpan / 7;
        primary.push({
          label: mStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
          start: startClamp,
          end: endClamp,
          width: weeksSpan * colW,
        });
        mCursor.setMonth(mCursor.getMonth() + 1);
      }
      break;
    }

    case 'month': {
      // Primary: years, Secondary: months
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        const mStart = new Date(cursor);
        const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        secondary.push({
          label: cursor.toLocaleString('default', { month: 'short' }),
          start: mStart,
          end: mEnd,
          width: colW,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      // Primary years
      for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
        const yStart = new Date(y, 0, 1);
        const yEnd = new Date(y, 11, 31);
        const startClamp = yStart < start ? start : yStart;
        const endClamp = yEnd > end ? end : yEnd;
        const startMonth = startClamp.getMonth();
        const endMonth = endClamp.getMonth();
        const monthsSpan = endMonth - startMonth + 1;
        primary.push({
          label: y.toString(),
          start: startClamp,
          end: endClamp,
          width: monthsSpan * colW,
        });
      }
      break;
    }

    case 'quarter': {
      // Primary: years, Secondary: quarters
      const startQ = Math.floor(start.getMonth() / 3);
      const cursor = new Date(start.getFullYear(), startQ * 3, 1);
      while (cursor <= end) {
        const q = Math.floor(cursor.getMonth() / 3) + 1;
        const qStart = new Date(cursor);
        const qEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 0);
        secondary.push({
          label: `Q${q}`,
          start: qStart,
          end: qEnd,
          width: colW,
        });
        cursor.setMonth(cursor.getMonth() + 3);
      }
      // Primary years
      for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
        const yStart = new Date(y, 0, 1);
        const yEnd = new Date(y, 11, 31);
        const startClamp = yStart < start ? start : yStart;
        const endClamp = yEnd > end ? end : yEnd;
        const startQIdx = Math.floor(startClamp.getMonth() / 3);
        const endQIdx = Math.floor(endClamp.getMonth() / 3);
        const quartersSpan = endQIdx - startQIdx + 1;
        primary.push({
          label: y.toString(),
          start: startClamp,
          end: endClamp,
          width: quartersSpan * colW,
        });
      }
      break;
    }

    case 'year': {
      // Primary: decades, Secondary: years
      for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
        const yStart = new Date(y, 0, 1);
        const yEnd = new Date(y, 11, 31);
        secondary.push({
          label: y.toString(),
          start: yStart,
          end: yEnd,
          width: colW,
        });
      }
      // Primary decades
      const startDecade = Math.floor(start.getFullYear() / 10) * 10;
      const endDecade = Math.floor(end.getFullYear() / 10) * 10;
      for (let d = startDecade; d <= endDecade; d += 10) {
        const dStart = new Date(d, 0, 1);
        const dEnd = new Date(d + 9, 11, 31);
        const startClamp = dStart < start ? start : dStart;
        const endClamp = dEnd > end ? end : dEnd;
        const yearsSpan = endClamp.getFullYear() - startClamp.getFullYear() + 1;
        primary.push({
          label: `${d}s`,
          start: startClamp,
          end: endClamp,
          width: yearsSpan * colW,
        });
      }
      break;
    }
  }

  return { primary, secondary };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate dependency arrow path (L-shaped routing).
 */
export function getDependencyPath(from: TaskRect, to: TaskRect, type: DependencyType): string {
  const rowH = 40;
  const midGap = 12;
  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;

  switch (type) {
    case 'FS': // Finish-to-Start
      startX = from.x + from.width;
      startY = from.y + from.height / 2;
      endX = to.x;
      endY = to.y + to.height / 2;
      break;
    case 'FF': // Finish-to-Finish
      startX = from.x + from.width;
      startY = from.y + from.height / 2;
      endX = to.x + to.width;
      endY = to.y + to.height / 2;
      break;
    case 'SS': // Start-to-Start
      startX = from.x;
      startY = from.y + from.height / 2;
      endX = to.x;
      endY = to.y + to.height / 2;
      break;
    case 'SF': // Start-to-Finish
      startX = from.x;
      startY = from.y + from.height / 2;
      endX = to.x + to.width;
      endY = to.y + to.height / 2;
      break;
  }

  // L-shaped routing
  if (type === 'FS') {
    if (endX > startX + midGap * 2) {
      // Simple: go right, then turn
      const midX = startX + midGap;
      return `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
    } else {
      // Route around: go right, down/up past the bar, then left to target
      const midX = startX + midGap;
      const detourY = startY < endY
        ? Math.max(startY + rowH, endY + rowH * 0.5)
        : Math.min(startY - rowH, endY - rowH * 0.5);
      const midX2 = endX - midGap;
      return `M ${startX} ${startY} H ${midX} V ${detourY} H ${midX2} V ${endY} H ${endX}`;
    }
  }

  if (type === 'SS') {
    const leftX = Math.min(startX, endX) - midGap;
    return `M ${startX} ${startY} H ${leftX} V ${endY} H ${endX}`;
  }

  if (type === 'FF') {
    const rightX = Math.max(startX, endX) + midGap;
    return `M ${startX} ${startY} H ${rightX} V ${endY} H ${endX}`;
  }

  if (type === 'SF') {
    const leftX = startX - midGap;
    return `M ${startX} ${startY} H ${leftX} V ${endY} H ${endX}`;
  }

  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

/**
 * Calculate the critical path through the project using forward/backward pass.
 * Returns an array of task IDs on the critical path.
 */
export function calculateCriticalPath(tasks: ProjectTask[]): string[] {
  if (!tasks.length) return [];

  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Calculate durations in days
  const durations = new Map<string, number>();
  for (const t of tasks) {
    const start = new Date(t.startDate).getTime();
    const end = new Date(t.endDate).getTime();
    durations.set(t.id, Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))));
  }

  // Forward pass: calculate early start and early finish
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  // Topological sort based on dependencies
  const visited = new Set<string>();
  const sorted: string[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const task = taskMap.get(id);
    if (task?.dependencies) {
      for (const dep of task.dependencies) {
        if (taskMap.has(dep.taskId)) {
          visit(dep.taskId);
        }
      }
    }
    sorted.push(id);
  }

  for (const t of tasks) visit(t.id);

  // Forward pass
  for (const id of sorted) {
    const task = taskMap.get(id)!;
    let es = 0;
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        const predEF = earlyFinish.get(dep.taskId);
        if (predEF !== undefined) {
          const lag = dep.lag ?? 0;
          es = Math.max(es, predEF + lag);
        }
      }
    }
    earlyStart.set(id, es);
    earlyFinish.set(id, es + (durations.get(id) ?? 1));
  }

  // Backward pass
  const projectEnd = Math.max(...Array.from(earlyFinish.values()));
  const lateFinish = new Map<string, number>();
  const lateStart = new Map<string, number>();

  for (const id of [...sorted].reverse()) {
    // Find successors
    let lf = projectEnd;
    for (const t of tasks) {
      if (t.dependencies?.some(d => d.taskId === id)) {
        const ls = lateStart.get(t.id);
        if (ls !== undefined) {
          const dep = t.dependencies!.find(d => d.taskId === id)!;
          const lag = dep.lag ?? 0;
          lf = Math.min(lf, ls - lag);
        }
      }
    }
    lateFinish.set(id, lf);
    lateStart.set(id, lf - (durations.get(id) ?? 1));
  }

  // Critical path: tasks where early start === late start (zero float)
  const critical: string[] = [];
  for (const id of sorted) {
    const es = earlyStart.get(id) ?? 0;
    const ls = lateStart.get(id) ?? 0;
    if (Math.abs(es - ls) < 0.001) {
      critical.push(id);
    }
  }

  return critical;
}

/**
 * Format a date as a short string for display.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('default', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generate weekend column positions for day scale.
 */
export function getWeekendColumns(start: Date, end: Date, columnWidth: number): { x: number; width: number }[] {
  const cols: { x: number; width: number }[] = [];
  const cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= end) {
    if (isWeekend(cursor)) {
      cols.push({
        x: dayIndex * columnWidth,
        width: columnWidth,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    dayIndex++;
  }

  return cols;
}
