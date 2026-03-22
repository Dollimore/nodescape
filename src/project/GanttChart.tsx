import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { ProjectData, ProjectTask, TimeScale, DependencyType } from './types';
import {
  getDateRange,
  dateToX,
  xToDate,
  generateTimeHeaders,
  getColumnWidth,
  getDependencyPath,
  isWeekend,
  getWeekendColumns,
  formatDate,
} from './ganttUtils';
import type { TaskRect } from './ganttUtils';
import styles from './GanttChart.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GanttChartProps {
  data: ProjectData;
  timeScale?: TimeScale;
  showBaseline?: boolean;
  showDependencies?: boolean;
  showToday?: boolean;
  showProgress?: boolean;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
  onTaskMove?: (taskId: string, newStart: string, newEnd: string) => void;
  onTimeScaleChange?: (scale: TimeScale) => void;
  height?: number;
  className?: string;
}

interface TooltipData {
  task: ProjectTask;
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROW_HEIGHT = 36;
const BAR_HEIGHT = 20;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const GROUP_BAR_HEIGHT = 4;
const MILESTONE_SIZE = 10;
const HEADER_HEIGHT = 58;
const INDENT_PX = 16;
const TOOLTIP_DELAY = 200;

const DEFAULT_COLORS: Record<string, string> = {
  backlog: '#94a3b8',
  todo: '#60a5fa',
  'in-progress': '#3b82f6',
  review: '#a78bfa',
  complete: '#22c55e',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function lighten(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.min(255, parseInt(c.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(c.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(c.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getTaskColor(task: ProjectTask): string {
  return task.color ?? DEFAULT_COLORS[task.status] ?? '#3b82f6';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Simple stable hash for assigning avatar colors */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const AVATAR_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

function getAvatarColor(name: string): string {
  return AVATAR_PALETTE[hashStr(name) % AVATAR_PALETTE.length];
}

/** Format a short date like "Mar 5" for the task list */
function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

/** Calculate indent level for a task based on its groupId chain */
function getIndentLevel(task: ProjectTask, taskMap: Map<string, ProjectTask>): number {
  let level = 0;
  let current = task;
  while (current.groupId) {
    level++;
    const parent = taskMap.get(current.groupId);
    if (!parent) break;
    current = parent;
  }
  return level;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GanttChart({
  data,
  timeScale: controlledScale,
  showBaseline = true,
  showDependencies = true,
  showToday = true,
  showProgress = true,
  selectedTaskId = null,
  onTaskClick,
  onTaskMove,
  onTimeScaleChange,
  height = 600,
  className,
}: GanttChartProps) {
  const [internalScale, setInternalScale] = useState<TimeScale>('week');
  const scale = controlledScale ?? internalScale;
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragState, setDragState] = useState<{
    taskId: string;
    startMouseX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);

  const allTasks = data.tasks;
  const colWidth = getColumnWidth(scale);

  /* -- task map for quick lookup -- */
  const taskMap = useMemo(() => new Map(allTasks.map(t => [t.id, t])), [allTasks]);

  /* -- visible tasks (respecting collapsed groups) -- */
  const tasks = useMemo(() => {
    return allTasks.filter(task => {
      let current = task;
      while (current.groupId) {
        if (collapsedGroups.has(current.groupId)) return false;
        const parent = taskMap.get(current.groupId);
        if (!parent) break;
        current = parent;
      }
      return true;
    });
  }, [allTasks, collapsedGroups, taskMap]);

  /* -- date range & headers -- */
  const { start: chartStart, end: chartEnd } = useMemo(() => getDateRange(allTasks), [allTasks]);
  const headers = useMemo(
    () => generateTimeHeaders(chartStart, chartEnd, scale),
    [chartStart, chartEnd, scale],
  );

  /* -- total timeline width -- */
  const totalWidth = useMemo(() => {
    return headers.secondary.reduce((sum, h) => sum + h.width, 0);
  }, [headers.secondary]);

  /* -- task rectangles (positions) -- */
  const taskRects = useMemo<Map<string, TaskRect>>(() => {
    const rects = new Map<string, TaskRect>();
    tasks.forEach((task, i) => {
      const startD = new Date(task.startDate);
      const endD = new Date(task.endDate);
      const x = dateToX(startD, chartStart, colWidth, scale);
      const xEnd = dateToX(endD, chartStart, colWidth, scale);
      const w = Math.max(xEnd - x, 2);
      rects.set(task.id, {
        id: task.id,
        x,
        y: i * ROW_HEIGHT + BAR_Y_OFFSET,
        width: w,
        height: BAR_HEIGHT,
        row: i,
      });
    });
    return rects;
  }, [tasks, chartStart, colWidth, scale]);

  /* -- weekend columns (only for day scale) -- */
  const weekendCols = useMemo(() => {
    if (scale !== 'day') return [];
    return getWeekendColumns(chartStart, chartEnd, colWidth);
  }, [scale, chartStart, chartEnd, colWidth]);

  /* -- today x position -- */
  const todayX = useMemo(() => {
    const now = new Date();
    if (now < chartStart || now > chartEnd) return null;
    return dateToX(now, chartStart, colWidth, scale);
  }, [chartStart, chartEnd, colWidth, scale]);

  const totalHeight = tasks.length * ROW_HEIGHT;

  /* -- scale change handler -- */
  const handleScaleChange = useCallback(
    (s: TimeScale) => {
      if (onTimeScaleChange) {
        onTimeScaleChange(s);
      } else {
        setInternalScale(s);
      }
    },
    [onTimeScaleChange],
  );

  /* -- collapse/expand handler -- */
  const handleToggleCollapse = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  /* -- tooltip handlers with delay -- */
  const handleBarMouseEnter = useCallback(
    (task: ProjectTask, e: React.MouseEvent) => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
      tooltipTimer.current = setTimeout(() => {
        setTooltip({ task, x: e.clientX, y: e.clientY });
      }, TOOLTIP_DELAY);
    },
    [],
  );

  const handleBarMouseMove = useCallback(
    (task: ProjectTask, e: React.MouseEvent) => {
      if (tooltip) {
        setTooltip({ task, x: e.clientX, y: e.clientY });
      }
    },
    [tooltip],
  );

  const handleBarMouseLeave = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }, []);

  /* -- click handler -- */
  const handleTaskClick = useCallback(
    (taskId: string) => {
      if (onTaskClick) onTaskClick(taskId);
    },
    [onTaskClick],
  );

  /* -- drag handlers for moving bars -- */
  const handleBarMouseDown = useCallback(
    (task: ProjectTask, e: React.MouseEvent) => {
      if (!onTaskMove) return;
      e.preventDefault();
      setDragState({
        taskId: task.id,
        startMouseX: e.clientX,
        originalStart: task.startDate,
        originalEnd: task.endDate,
      });
    },
    [onTaskMove],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !onTaskMove) return;
      const dx = e.clientX - dragState.startMouseX;
      const daysPx = colWidth / (scale === 'day' ? 1 : scale === 'week' ? 7 : scale === 'month' ? 30.44 : scale === 'quarter' ? 91.31 : 365.25);
      const daysDelta = Math.round(dx / daysPx);
      if (daysDelta === 0) return;

      const newStart = new Date(dragState.originalStart);
      const newEnd = new Date(dragState.originalEnd);
      newStart.setDate(newStart.getDate() + daysDelta);
      newEnd.setDate(newEnd.getDate() + daysDelta);
      onTaskMove(dragState.taskId, newStart.toISOString().slice(0, 10), newEnd.toISOString().slice(0, 10));
    },
    [dragState, onTaskMove, colWidth, scale],
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  /* -- sync scroll between task list and timeline -- */
  const handleTimelineScroll = useCallback(() => {
    if (timelineRef.current && taskListRef.current) {
      taskListRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  }, []);

  const handleTaskListScroll = useCallback(() => {
    if (taskListRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = taskListRef.current.scrollTop;
    }
  }, []);

  /* -- cleanup tooltip timer -- */
  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className={`${styles.container}${className ? ` ${className}` : ''}`}
      style={{ height }}
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
    >
      {/* -- Scale toggle toolbar -- */}
      <div className={styles.toolbar}>
        {(['day', 'week', 'month', 'quarter', 'year'] as TimeScale[]).map(s => (
          <button
            key={s}
            className={`${styles.scaleToggle}${s === scale ? ` ${styles.scaleToggleActive}` : ''}`}
            onClick={() => handleScaleChange(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* -- Left: Task list panel -- */}
      <div className={styles.taskList} ref={taskListRef} onScroll={handleTaskListScroll}>
        <div className={styles.taskListHeader}>
          <span className={`${styles.colHeader} ${styles.colHeaderTask}`}>Task</span>
          <span className={`${styles.colHeader} ${styles.colHeaderAssignee}`}></span>
          <span className={`${styles.colHeader} ${styles.colHeaderStart}`}>Start</span>
          <span className={`${styles.colHeader} ${styles.colHeaderEnd}`}>End</span>
        </div>
        {tasks.map((task, i) => {
          const indent = getIndentLevel(task, taskMap);
          const isGroup = task.isGroup;
          const isCollapsed = collapsedGroups.has(task.id);
          return (
            <div
              key={task.id}
              className={[
                styles.taskRow,
                i % 2 === 1 ? styles.taskRowAlt : '',
                selectedTaskId === task.id ? styles.taskRowSelected : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleTaskClick(task.id)}
            >
              <div
                className={styles.taskRowLeft}
                style={{ paddingLeft: indent * INDENT_PX }}
              >
                {/* Chevron for groups, placeholder for leaves */}
                {isGroup ? (
                  <div
                    className={`${styles.chevron}${isCollapsed ? '' : ` ${styles.chevronExpanded}`}`}
                    onClick={(e) => handleToggleCollapse(task.id, e)}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6 3l5 5-5 5V3z" />
                    </svg>
                  </div>
                ) : (
                  <div className={styles.chevronPlaceholder} />
                )}

                {/* Status dot */}
                <div
                  className={styles.statusDot}
                  style={{ background: getTaskColor(task) }}
                />

                {/* Task name */}
                <div
                  className={[
                    styles.taskName,
                    isGroup ? styles.taskNameGroup : '',
                    task.isMilestone ? styles.taskNameMilestone : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={task.title}
                >
                  {task.title}
                </div>
              </div>

              {/* Initials avatar */}
              {task.assignee ? (
                <div
                  className={styles.initialsAvatar}
                  title={task.assignee}
                  style={{ background: getAvatarColor(task.assignee) }}
                >
                  {getInitials(task.assignee)}
                </div>
              ) : (
                <div style={{ width: 18, flexShrink: 0 }} />
              )}

              {/* Start / End dates */}
              <div className={styles.taskDate}>{shortDate(task.startDate)}</div>
              <div className={styles.taskDate}>{shortDate(task.endDate)}</div>
            </div>
          );
        })}
      </div>

      {/* -- Right: Timeline panel -- */}
      <div
        className={styles.timeline}
        ref={timelineRef}
        onScroll={handleTimelineScroll}
      >
        {/* -- Dual time header -- */}
        <div className={styles.header}>
          <div className={styles.headerPrimaryRow}>
            {headers.primary.map((h, i) => (
              <div
                key={i}
                className={styles.headerPrimaryCell}
                style={{ width: h.width, minWidth: h.width }}
              >
                {h.label}
              </div>
            ))}
          </div>
          <div className={styles.headerSecondaryRow}>
            {headers.secondary.map((h, i) => {
              const isWk = scale === 'day' && isWeekend(h.start);
              return (
                <div
                  key={i}
                  className={[
                    styles.headerSecondaryCell,
                    isWk ? styles.headerSecondaryCellWeekend : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ width: h.width, minWidth: h.width }}
                >
                  {h.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* -- SVG chart body -- */}
        <svg
          width={totalWidth}
          height={totalHeight}
          className={styles.chartBody}
          style={{ display: 'block' }}
        >
          <defs>
            {/* Subtle gradient definitions per task (5% lighter at top) */}
            {tasks.map(task => {
              const color = getTaskColor(task);
              return (
                <linearGradient
                  key={`grad-${task.id}`}
                  id={`bar-grad-${task.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={lighten(color, 12)} />
                  <stop offset="100%" stopColor={color} />
                </linearGradient>
              );
            })}
            {/* Drop shadow filter for bars */}
            <filter id="gantt-bar-shadow" x="-4%" y="-20%" width="108%" height="150%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.06" />
            </filter>
            <filter id="gantt-bar-shadow-hover" x="-4%" y="-20%" width="108%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
            </filter>
            {/* Selected ring filter */}
            <filter id="gantt-bar-selected" x="-8%" y="-30%" width="116%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.35" />
            </filter>
            {/* Arrow marker -- small, 5px filled */}
            <marker
              id="gantt-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 Z" fill="var(--fc-edge, #d0d0d0)" opacity="0.4" />
            </marker>
          </defs>

          {/* -- Row backgrounds -- */}
          {tasks.map((task, i) => {
            const isSelected = selectedTaskId === task.id;
            const isAlt = i % 2 === 1;
            if (!isSelected && !isAlt) return null;
            return (
              <rect
                key={`row-${task.id}`}
                x={0}
                y={i * ROW_HEIGHT}
                width={totalWidth}
                height={ROW_HEIGHT}
                className={isSelected ? styles.rowBgSelected : styles.rowBgAlt}
              />
            );
          })}

          {/* -- Row separator lines -- */}
          {tasks.map((_task, i) => (
            <line
              key={`line-${i}`}
              x1={0}
              y1={(i + 1) * ROW_HEIGHT}
              x2={totalWidth}
              y2={(i + 1) * ROW_HEIGHT}
              className={styles.rowLine}
            />
          ))}

          {/* -- Weekend shading -- */}
          {weekendCols.map((col, i) => (
            <rect
              key={`wk-${i}`}
              x={col.x}
              y={0}
              width={col.width}
              height={totalHeight}
              className={styles.weekend}
            />
          ))}

          {/* -- Grid lines (secondary ticks) -- */}
          {(() => {
            let x = 0;
            return headers.secondary.map((h, i) => {
              const lineX = x;
              x += h.width;
              return (
                <line
                  key={`grid-${i}`}
                  x1={lineX}
                  y1={0}
                  x2={lineX}
                  y2={totalHeight}
                  className={styles.gridLine}
                />
              );
            });
          })()}

          {/* -- Baseline bars -- */}
          {showBaseline &&
            tasks.map(task => {
              if (!task.baselineStart || !task.baselineEnd) return null;
              if (task.isMilestone || task.isGroup) return null;
              const rect = taskRects.get(task.id);
              if (!rect) return null;
              const bsX = dateToX(new Date(task.baselineStart), chartStart, colWidth, scale);
              const beX = dateToX(new Date(task.baselineEnd), chartStart, colWidth, scale);
              const bW = Math.max(beX - bsX, 2);
              return (
                <rect
                  key={`bl-${task.id}`}
                  x={bsX}
                  y={rect.y + BAR_HEIGHT + 2}
                  width={bW}
                  height={3}
                  rx={1.5}
                  ry={1.5}
                  className={styles.baselineBar}
                  fill="#94a3b8"
                />
              );
            })}

          {/* -- Dependency arrows -- */}
          {showDependencies &&
            tasks.flatMap(task =>
              (task.dependencies ?? []).map(dep => {
                const fromRect = taskRects.get(dep.taskId);
                const toRect = taskRects.get(task.id);
                if (!fromRect || !toRect) return null;
                const pathD = getDependencyPath(fromRect, toRect, dep.type);
                return (
                  <path
                    key={`dep-${dep.taskId}-${task.id}`}
                    d={pathD}
                    className={styles.dependency}
                    stroke="var(--fc-edge, #d0d0d0)"
                    opacity={0.3}
                    markerEnd="url(#gantt-arrow)"
                  />
                );
              }),
            )}

          {/* -- Task bars -- */}
          {tasks.map(task => {
            const rect = taskRects.get(task.id);
            if (!rect) return null;
            const color = getTaskColor(task);
            const isSelected = selectedTaskId === task.id;

            // Milestone: diamond
            if (task.isMilestone) {
              const cx = rect.x;
              const cy = rect.y + BAR_HEIGHT / 2;
              const s = MILESTONE_SIZE / 2;
              return (
                <g
                  key={`ms-${task.id}`}
                  className={styles.milestone}
                  onClick={() => handleTaskClick(task.id)}
                  onMouseEnter={e => handleBarMouseEnter(task, e)}
                  onMouseMove={e => handleBarMouseMove(task, e)}
                  onMouseLeave={handleBarMouseLeave}
                  filter={isSelected ? 'url(#gantt-bar-selected)' : undefined}
                >
                  <polygon
                    points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
                    fill={color}
                  />
                </g>
              );
            }

            // Group/summary bar: thin 4px bar at 40% opacity with triangles
            if (task.isGroup) {
              const y = rect.y + (BAR_HEIGHT - GROUP_BAR_HEIGHT) / 2;
              const triSize = 4;
              return (
                <g
                  key={`grp-${task.id}`}
                  className={styles.groupBar}
                  onClick={() => handleTaskClick(task.id)}
                  onMouseEnter={e => handleBarMouseEnter(task, e)}
                  onMouseMove={e => handleBarMouseMove(task, e)}
                  onMouseLeave={handleBarMouseLeave}
                >
                  {/* Main thin bar */}
                  <rect
                    x={rect.x}
                    y={y}
                    width={rect.width}
                    height={GROUP_BAR_HEIGHT}
                    fill={color}
                    opacity={0.4}
                    rx={1}
                    ry={1}
                  />
                  {/* Left downward triangle */}
                  <polygon
                    points={`${rect.x},${y} ${rect.x + triSize},${y} ${rect.x},${y + GROUP_BAR_HEIGHT + triSize}`}
                    fill={color}
                    opacity={0.4}
                  />
                  {/* Right downward triangle */}
                  <polygon
                    points={`${rect.x + rect.width},${y} ${rect.x + rect.width - triSize},${y} ${rect.x + rect.width},${y + GROUP_BAR_HEIGHT + triSize}`}
                    fill={color}
                    opacity={0.4}
                  />
                </g>
              );
            }

            // Regular task bar
            return (
              <g
                key={`bar-${task.id}`}
                className={styles.taskBarGroup}
                onClick={() => handleTaskClick(task.id)}
                onMouseEnter={e => handleBarMouseEnter(task, e)}
                onMouseMove={e => handleBarMouseMove(task, e)}
                onMouseLeave={handleBarMouseLeave}
                onMouseDown={e => handleBarMouseDown(task, e)}
                filter={isSelected ? 'url(#gantt-bar-selected)' : 'url(#gantt-bar-shadow)'}
              >
                {/* Main bar */}
                <rect
                  className={styles.taskBarRect}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={BAR_HEIGHT}
                  fill={`url(#bar-grad-${task.id})`}
                  rx={6}
                  ry={6}
                  stroke={color}
                  strokeWidth={0.5}
                  strokeOpacity={0.1}
                />
                {/* Progress fill */}
                {showProgress && task.progress > 0 && (
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={Math.max(0, (rect.width * Math.min(task.progress, 100)) / 100)}
                    height={BAR_HEIGHT}
                    fill="rgba(0,0,0,0.15)"
                    className={styles.progressFill}
                    rx={6}
                    ry={6}
                  />
                )}
                {/* Bar label (if wide enough) */}
                {rect.width > 60 && (
                  <text
                    x={rect.x + 8}
                    y={rect.y + BAR_HEIGHT / 2 + 3.5}
                    className={styles.barLabel}
                  >
                    {task.title.length > Math.floor(rect.width / 7)
                      ? task.title.slice(0, Math.floor(rect.width / 7) - 2) + '...'
                      : task.title}
                  </text>
                )}
                {/* Progress percentage */}
                {showProgress && task.progress > 0 && rect.width > 40 && (
                  <text
                    x={rect.x + rect.width - 6}
                    y={rect.y + BAR_HEIGHT / 2 + 3}
                    className={styles.barProgress}
                    textAnchor="end"
                  >
                    {Math.round(task.progress)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* -- Today line -- */}
          {showToday && todayX !== null && (
            <g>
              {/* Chip background */}
              <rect
                className={styles.todayChipBg}
                x={todayX - 18}
                y={0}
                width={36}
                height={14}
                rx={4}
                ry={4}
              />
              <text
                x={todayX}
                y={10}
                className={styles.todayChip}
                textAnchor="middle"
              >
                Today
              </text>
              <line
                x1={todayX}
                y1={14}
                x2={todayX}
                y2={totalHeight}
                className={styles.todayLine}
              />
            </g>
          )}
        </svg>
      </div>

      {/* -- Tooltip -- */}
      {tooltip && (
        <div
          className={styles.tooltipOverlay}
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 80,
          }}
        >
          <div className={styles.tooltip}>
            <div className={styles.tooltipTitle}>{tooltip.task.title}</div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Start</span>
              <span className={styles.tooltipValue}>
                {formatDate(new Date(tooltip.task.startDate))}
              </span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>End</span>
              <span className={styles.tooltipValue}>
                {formatDate(new Date(tooltip.task.endDate))}
              </span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Progress</span>
              <span className={styles.tooltipValue}>{tooltip.task.progress}%</span>
            </div>
            {tooltip.task.assignee && (
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>Assignee</span>
                <span className={styles.tooltipValue}>{tooltip.task.assignee}</span>
              </div>
            )}
            {tooltip.task.priority && (
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>Priority</span>
                <span
                  className={styles.priorityBadge}
                  style={{
                    background: PRIORITY_COLORS[tooltip.task.priority] + '22',
                    color: PRIORITY_COLORS[tooltip.task.priority],
                  }}
                >
                  {tooltip.task.priority}
                </span>
              </div>
            )}
            <div className={styles.tooltipProgress}>
              <div
                className={styles.tooltipProgressFill}
                style={{
                  width: `${tooltip.task.progress}%`,
                  background: getTaskColor(tooltip.task),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
