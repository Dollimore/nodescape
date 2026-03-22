import React, { useMemo, useRef, useState, useCallback } from 'react';
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

const ROW_HEIGHT = 40;
const BAR_HEIGHT = 22;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const GROUP_BAR_HEIGHT = 8;
const MILESTONE_SIZE = 14;
const HEADER_HEIGHT = 60;

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
  const [dragState, setDragState] = useState<{
    taskId: string;
    startMouseX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);

  const tasks = data.tasks;
  const colWidth = getColumnWidth(scale);

  /* -- date range & headers -- */
  const { start: chartStart, end: chartEnd } = useMemo(() => getDateRange(tasks), [tasks]);
  const headers = useMemo(
    () => generateTimeHeaders(chartStart, chartEnd, scale),
    [chartStart, chartEnd, scale],
  );

  /* -- total timeline width -- */
  const totalWidth = useMemo(() => {
    return headers.secondary.reduce((sum, h) => sum + h.width, 0);
  }, [headers.secondary]);

  /* -- task map for quick lookup -- */
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);

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

  /* -- tooltip handlers -- */
  const handleBarMouseEnter = useCallback(
    (task: ProjectTask, e: React.MouseEvent) => {
      setTooltip({ task, x: e.clientX + 12, y: e.clientY - 8 });
    },
    [],
  );

  const handleBarMouseMove = useCallback(
    (task: ProjectTask, e: React.MouseEvent) => {
      setTooltip({ task, x: e.clientX + 12, y: e.clientY - 8 });
    },
    [],
  );

  const handleBarMouseLeave = useCallback(() => {
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
      <div className={styles.taskList} ref={taskListRef}>
        <div className={styles.taskListHeader}>Task Name</div>
        {tasks.map((task, i) => (
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
              className={styles.taskIcon}
              style={{ background: getTaskColor(task) }}
            />
            <div
              className={[
                styles.taskName,
                task.isGroup ? styles.taskNameGroup : '',
                task.isMilestone ? styles.taskNameMilestone : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={task.title}
            >
              {task.title}
            </div>
            {task.assignee && (
              <div className={styles.taskAssignee} title={task.assignee}>
                {task.assignee}
              </div>
            )}
          </div>
        ))}
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
            {/* Gradient definitions per task */}
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
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={darken(color, 30)} />
                </linearGradient>
              );
            })}
            {/* Arrow marker */}
            <marker
              id="gantt-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 Z" fill="var(--fc-node-desc, #888)" />
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
                  height={4}
                  className={styles.baselineBar}
                  fill={getTaskColor(task)}
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
                const fromTask = taskMap.get(dep.taskId);
                const color = fromTask ? getTaskColor(fromTask) : '#888';
                const pathD = getDependencyPath(fromRect, toRect, dep.type);
                return (
                  <g key={`dep-${dep.taskId}-${task.id}`}>
                    <path
                      d={pathD}
                      className={styles.dependency}
                      stroke={color}
                      opacity={0.45}
                      markerEnd="url(#gantt-arrow)"
                    />
                  </g>
                );
              }),
            )}

          {/* -- Task bars -- */}
          {tasks.map(task => {
            const rect = taskRects.get(task.id);
            if (!rect) return null;
            const color = getTaskColor(task);

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
                >
                  <polygon
                    points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
                    fill={`url(#bar-grad-${task.id})`}
                    stroke={darken(color, 40)}
                    strokeWidth={1}
                  />
                </g>
              );
            }

            // Group/summary bar: thin bar with triangles
            if (task.isGroup) {
              const y = rect.y + (BAR_HEIGHT - GROUP_BAR_HEIGHT) / 2;
              const triSize = 6;
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
                    fill={`url(#bar-grad-${task.id})`}
                    rx={2}
                    ry={2}
                  />
                  {/* Left triangle */}
                  <polygon
                    points={`${rect.x},${y} ${rect.x + triSize},${y} ${rect.x},${y + GROUP_BAR_HEIGHT + triSize}`}
                    fill={color}
                  />
                  {/* Right triangle */}
                  <polygon
                    points={`${rect.x + rect.width},${y} ${rect.x + rect.width - triSize},${y} ${rect.x + rect.width},${y + GROUP_BAR_HEIGHT + triSize}`}
                    fill={color}
                  />
                </g>
              );
            }

            // Regular task bar
            return (
              <g
                key={`bar-${task.id}`}
                onClick={() => handleTaskClick(task.id)}
                onMouseEnter={e => handleBarMouseEnter(task, e)}
                onMouseMove={e => handleBarMouseMove(task, e)}
                onMouseLeave={handleBarMouseLeave}
                onMouseDown={e => handleBarMouseDown(task, e)}
              >
                {/* Bar shadow */}
                <rect
                  x={rect.x + 1}
                  y={rect.y + 2}
                  width={rect.width}
                  height={BAR_HEIGHT}
                  rx={4}
                  ry={4}
                  fill="var(--fc-node-shadow, rgba(0,0,0,0.04))"
                  opacity={0.5}
                />
                {/* Main bar */}
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={BAR_HEIGHT}
                  fill={`url(#bar-grad-${task.id})`}
                  className={styles.taskBar}
                  stroke={darken(color, 25)}
                  strokeWidth={0.5}
                />
                {/* Progress fill */}
                {showProgress && task.progress > 0 && (
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={Math.max(0, (rect.width * Math.min(task.progress, 100)) / 100)}
                    height={BAR_HEIGHT}
                    fill={darken(color, 20)}
                    className={styles.progressFill}
                    opacity={0.35}
                  />
                )}
                {/* Bar label (if wide enough) */}
                {rect.width > 60 && (
                  <text
                    x={rect.x + 8}
                    y={rect.y + BAR_HEIGHT / 2 + 4}
                    className={styles.barLabel}
                    clipPath={`rect(${rect.x},${rect.y},${rect.width},${BAR_HEIGHT})`}
                  >
                    {task.title.length > Math.floor(rect.width / 7)
                      ? task.title.slice(0, Math.floor(rect.width / 7) - 2) + '...'
                      : task.title}
                  </text>
                )}
                {/* Progress percentage on right side */}
                {showProgress && task.progress > 0 && rect.width > 40 && (
                  <text
                    x={rect.x + rect.width - 6}
                    y={rect.y + BAR_HEIGHT / 2 + 3}
                    fontSize={8}
                    fontWeight={700}
                    fill="#fff"
                    textAnchor="end"
                    opacity={0.7}
                    style={{ pointerEvents: 'none' }}
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
              <line
                x1={todayX}
                y1={0}
                x2={todayX}
                y2={totalHeight}
                className={styles.todayLine}
              />
              <text
                x={todayX}
                y={-4}
                className={styles.todayLabel}
              >
                Today
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* -- Tooltip -- */}
      {tooltip && (
        <div
          className={styles.tooltipOverlay}
          style={{ left: tooltip.x, top: tooltip.y }}
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
