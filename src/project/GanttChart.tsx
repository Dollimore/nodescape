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
  onTaskReorder?: (taskId: string, newIndex: number) => void;
  height?: number;
  className?: string;
}

interface TooltipData {
  task: ProjectTask;
  x: number;
  y: number;
}

interface ContextMenuData {
  taskId: string;
  x: number;
  y: number;
}

interface InlineEdit {
  taskId: string;
  field: 'title' | 'startDate' | 'endDate';
  value: string;
}

interface DragMoveState {
  taskId: string;
  startMouseX: number;
  originalLeft: number;
  originalWidth: number;
  originalStart: string;
  originalEnd: string;
}

interface DragResizeState {
  taskId: string;
  side: 'left' | 'right';
  startMouseX: number;
  originalLeft: number;
  originalWidth: number;
  originalStart: string;
  originalEnd: string;
}

interface ReorderState {
  taskId: string;
  startMouseY: number;
  startIndex: number;
  currentIndex: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROW_HEIGHT = 44;
const BAR_HEIGHT = 24;
const BAR_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2; // 10px
const GROUP_BAR_HEIGHT = 6;
const MILESTONE_SIZE = 12;
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

function getTaskColor(task: ProjectTask): string {
  return task.color ?? DEFAULT_COLORS[task.status] ?? '#3b82f6';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

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

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

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

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  onTaskReorder,
  height = 600,
  className,
}: GanttChartProps) {
  /* -- state -- */
  const [internalScale, setInternalScale] = useState<TimeScale>('week');
  const scale = controlledScale ?? internalScale;
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);
  const [dragMove, setDragMove] = useState<DragMoveState | null>(null);
  const [dragResize, setDragResize] = useState<DragResizeState | null>(null);
  const [reorder, setReorder] = useState<ReorderState | null>(null);

  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const allTasks = data.tasks;
  const colWidth = getColumnWidth(scale);

  /* -- task map -- */
  const taskMap = useMemo(() => new Map(allTasks.map(t => [t.id, t])), [allTasks]);

  /* -- visible tasks (collapsed groups filtered) -- */
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

  /* -- task rects (bar positions) -- */
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
        y: i * ROW_HEIGHT + BAR_OFFSET,
        width: w,
        height: BAR_HEIGHT,
        row: i,
      });
    });
    return rects;
  }, [tasks, chartStart, colWidth, scale]);

  /* -- weekend columns (day scale only) -- */
  const weekendCols = useMemo(() => {
    if (scale !== 'day') return [];
    return getWeekendColumns(chartStart, chartEnd, colWidth);
  }, [scale, chartStart, chartEnd, colWidth]);

  /* -- today X position -- */
  const todayX = useMemo(() => {
    const now = new Date();
    if (now < chartStart || now > chartEnd) return null;
    return dateToX(now, chartStart, colWidth, scale);
  }, [chartStart, chartEnd, colWidth, scale]);

  const totalHeight = tasks.length * ROW_HEIGHT;

  /* -- grid background style (CSS repeating gradient for vertical lines) -- */
  const gridBgStyle = useMemo(() => {
    if (headers.secondary.length === 0) return {};
    const w = headers.secondary[0].width;
    return {
      width: totalWidth,
      height: totalHeight,
      backgroundImage: `repeating-linear-gradient(90deg, var(--fc-node-section-border, rgba(0,0,0,0.06)) 0px, var(--fc-node-section-border, rgba(0,0,0,0.06)) 0.5px, transparent 0.5px, transparent ${w}px)`,
      backgroundSize: `${w}px 100%`,
    };
  }, [headers.secondary, totalWidth, totalHeight]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleScaleChange = useCallback((s: TimeScale) => {
    if (onTimeScaleChange) {
      onTimeScaleChange(s);
    } else {
      setInternalScale(s);
    }
  }, [onTimeScaleChange]);

  const handleToggleCollapse = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  /* -- selection -- */
  const handleTaskClick = useCallback((taskId: string) => {
    if (onTaskClick) onTaskClick(taskId);
  }, [onTaskClick]);

  /* -- tooltip -- */
  const handleBarMouseEnter = useCallback((task: ProjectTask, e: React.MouseEvent) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      setTooltip({ task, x: e.clientX, y: e.clientY });
    }, TOOLTIP_DELAY);
  }, []);

  const handleBarMouseMoveTooltip = useCallback((task: ProjectTask, e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip({ task, x: e.clientX, y: e.clientY });
    }
  }, [tooltip]);

  const handleBarMouseLeave = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }, []);

  /* -- drag to move bars -- */
  const handleBarMouseDown = useCallback((task: ProjectTask, e: React.MouseEvent) => {
    if (!onTaskMove) return;
    // Don't start move if clicking a resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains(styles.resizeHandle) ||
        target.classList.contains(styles.resizeLeft) ||
        target.classList.contains(styles.resizeRight)) return;
    if (task.isGroup || task.isMilestone) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = taskRects.get(task.id);
    if (!rect) return;
    setDragMove({
      taskId: task.id,
      startMouseX: e.clientX,
      originalLeft: rect.x,
      originalWidth: rect.width,
      originalStart: task.startDate,
      originalEnd: task.endDate,
    });
    setTooltip(null);
  }, [onTaskMove, taskRects]);

  /* -- drag to resize bars -- */
  const handleResizeStart = useCallback((task: ProjectTask, side: 'left' | 'right', e: React.MouseEvent) => {
    if (!onTaskMove) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = taskRects.get(task.id);
    if (!rect) return;
    setDragResize({
      taskId: task.id,
      side,
      startMouseX: e.clientX,
      originalLeft: rect.x,
      originalWidth: rect.width,
      originalStart: task.startDate,
      originalEnd: task.endDate,
    });
    setTooltip(null);
  }, [onTaskMove, taskRects]);

  /* -- global mouse move/up for drag operations -- */
  useEffect(() => {
    if (!dragMove && !dragResize && !reorder) return;

    const daysPx = colWidth / (
      scale === 'day' ? 1 :
      scale === 'week' ? 7 :
      scale === 'month' ? 30.44 :
      scale === 'quarter' ? 91.31 : 365.25
    );

    const handleMouseMove = (e: MouseEvent) => {
      if (dragMove && onTaskMove) {
        const dx = e.clientX - dragMove.startMouseX;
        const daysDelta = Math.round(dx / daysPx);
        if (daysDelta === 0) return;
        const newStart = new Date(dragMove.originalStart);
        const newEnd = new Date(dragMove.originalEnd);
        newStart.setDate(newStart.getDate() + daysDelta);
        newEnd.setDate(newEnd.getDate() + daysDelta);
        onTaskMove(dragMove.taskId, toISODate(newStart), toISODate(newEnd));
      }

      if (dragResize && onTaskMove) {
        const dx = e.clientX - dragResize.startMouseX;
        const daysDelta = Math.round(dx / daysPx);
        if (daysDelta === 0) return;
        if (dragResize.side === 'left') {
          const newStart = new Date(dragResize.originalStart);
          newStart.setDate(newStart.getDate() + daysDelta);
          // Don't let start go past end
          const endDate = new Date(dragResize.originalEnd);
          if (newStart >= endDate) return;
          onTaskMove(dragResize.taskId, toISODate(newStart), dragResize.originalEnd);
        } else {
          const newEnd = new Date(dragResize.originalEnd);
          newEnd.setDate(newEnd.getDate() + daysDelta);
          // Don't let end go before start
          const startDate = new Date(dragResize.originalStart);
          if (newEnd <= startDate) return;
          onTaskMove(dragResize.taskId, dragResize.originalStart, toISODate(newEnd));
        }
      }

      if (reorder) {
        const dy = e.clientY - reorder.startMouseY;
        const newIndex = Math.max(0, Math.min(tasks.length - 1, reorder.startIndex + Math.round(dy / ROW_HEIGHT)));
        if (newIndex !== reorder.currentIndex) {
          setReorder(prev => prev ? { ...prev, currentIndex: newIndex } : null);
        }
      }
    };

    const handleMouseUp = () => {
      if (reorder && onTaskReorder && reorder.currentIndex !== reorder.startIndex) {
        onTaskReorder(reorder.taskId, reorder.currentIndex);
      }
      setDragMove(null);
      setDragResize(null);
      setReorder(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMove, dragResize, reorder, onTaskMove, onTaskReorder, colWidth, scale, tasks.length]);

  /* -- row reorder drag start -- */
  const handleReorderStart = useCallback((taskId: string, index: number, e: React.MouseEvent) => {
    if (!onTaskReorder) return;
    e.preventDefault();
    e.stopPropagation();
    setReorder({
      taskId,
      startMouseY: e.clientY,
      startIndex: index,
      currentIndex: index,
    });
  }, [onTaskReorder]);

  /* -- context menu -- */
  const handleContextMenu = useCallback((taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ taskId, x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /* -- inline editing -- */
  const handleDoubleClickField = useCallback((taskId: string, field: 'title' | 'startDate' | 'endDate', currentValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInlineEdit({ taskId, field, value: currentValue });
  }, []);

  const handleInlineEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInlineEdit(prev => prev ? { ...prev, value: e.target.value } : null);
  }, []);

  const handleInlineEditSave = useCallback(() => {
    if (!inlineEdit || !onTaskMove) return;
    const task = taskMap.get(inlineEdit.taskId);
    if (!task) { setInlineEdit(null); return; }

    if (inlineEdit.field === 'startDate') {
      const parsed = new Date(inlineEdit.value);
      if (!isNaN(parsed.getTime())) {
        onTaskMove(inlineEdit.taskId, toISODate(parsed), task.endDate);
      }
    } else if (inlineEdit.field === 'endDate') {
      const parsed = new Date(inlineEdit.value);
      if (!isNaN(parsed.getTime())) {
        onTaskMove(inlineEdit.taskId, task.startDate, toISODate(parsed));
      }
    }
    // Title editing: would need an onTaskEdit callback; for now just close
    setInlineEdit(null);
  }, [inlineEdit, onTaskMove, taskMap]);

  const handleInlineEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInlineEditSave();
    if (e.key === 'Escape') setInlineEdit(null);
  }, [handleInlineEditSave]);

  useEffect(() => {
    if (inlineEdit && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEdit]);

  /* -- sync scroll -- */
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

  /* -- cleanup -- */
  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  /* -- cursor class based on drag state -- */
  const containerCursor = dragMove ? 'grabbing' : dragResize ? 'col-resize' : reorder ? 'grabbing' : undefined;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className={`${styles.container}${className ? ` ${className}` : ''}`}
      style={{ height, cursor: containerCursor }}
    >
      {/* -- Scale toggle toolbar (segmented control in header) -- */}
      <div className={styles.toolbar}>
        <div className={styles.segmentedControl}>
          {(['day', 'week', 'month', 'quarter'] as TimeScale[]).map(s => (
            <button
              key={s}
              className={`${styles.scaleToggle}${s === scale ? ` ${styles.scaleToggleActive}` : ''}`}
              onClick={() => handleScaleChange(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* -- Main body: task list + timeline -- */}
      <div className={styles.body}>
        {/* -- Left: Task list panel -- */}
        <div className={styles.taskList} ref={taskListRef} onScroll={handleTaskListScroll}>
          <div className={styles.taskListHeader}>
            <span className={`${styles.colHeader} ${styles.colHeaderTask}`}>Task</span>
            <span className={`${styles.colHeader} ${styles.colHeaderAssignee}`}></span>
            <span className={`${styles.colHeader} ${styles.colHeaderStart}`}>Start</span>
            <span className={`${styles.colHeader} ${styles.colHeaderEnd}`}>End</span>
          </div>
          <div className={styles.taskListBody}>
            {tasks.map((task, i) => {
              const indent = getIndentLevel(task, taskMap);
              const isGroup = task.isGroup;
              const isCollapsed = collapsedGroups.has(task.id);
              const isSelected = selectedTaskId === task.id;
              const isEditingTitle = inlineEdit?.taskId === task.id && inlineEdit.field === 'title';
              const isEditingStart = inlineEdit?.taskId === task.id && inlineEdit.field === 'startDate';
              const isEditingEnd = inlineEdit?.taskId === task.id && inlineEdit.field === 'endDate';

              const taskColor = getTaskColor(task);

              return (
                <div
                  key={task.id}
                  className={[
                    styles.taskRow,
                    isSelected ? styles.taskRowSelected : '',
                    isGroup ? styles.taskRowGroup : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleTaskClick(task.id)}
                  onContextMenu={e => handleContextMenu(task.id, e)}
                  style={{
                    ...(reorder && reorder.currentIndex === i && reorder.taskId !== task.id
                      ? { borderTop: '2px solid #3b82f6' }
                      : {}),
                    ...(isGroup ? { '--group-color': taskColor } as React.CSSProperties : {}),
                  }}
                >
                  {/* Left color indicator */}
                  <div className={styles.colorIndicator} style={{ background: taskColor }} />
                  {/* Drag handle */}
                  <div
                    className={`${styles.dragHandle}${reorder?.taskId === task.id ? ` ${styles.dragHandleActive}` : ''}`}
                    onMouseDown={e => handleReorderStart(task.id, i, e)}
                  >
                    <div className={styles.gripDotRow}>
                      <div className={styles.gripDot} />
                      <div className={styles.gripDot} />
                    </div>
                    <div className={styles.gripDotRow}>
                      <div className={styles.gripDot} />
                      <div className={styles.gripDot} />
                    </div>
                    <div className={styles.gripDotRow}>
                      <div className={styles.gripDot} />
                      <div className={styles.gripDot} />
                    </div>
                  </div>

                  <div className={styles.taskRowLeft} style={{ paddingLeft: indent * INDENT_PX }}>
                    {/* Chevron for groups */}
                    {isGroup ? (
                      <div
                        className={`${styles.chevron}${isCollapsed ? '' : ` ${styles.chevronExpanded}`}`}
                        onClick={e => handleToggleCollapse(task.id, e)}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                          <path d="M6 3l5 5-5 5V3z" />
                        </svg>
                      </div>
                    ) : (
                      <div className={styles.chevronPlaceholder} />
                    )}

                    {/* Status dot */}
                    <div className={styles.statusDot} style={{ background: getTaskColor(task) }} />

                    {/* Task name (inline editable) */}
                    {isEditingTitle ? (
                      <input
                        ref={inlineInputRef}
                        className={styles.inlineEditInput}
                        value={inlineEdit!.value}
                        onChange={handleInlineEditChange}
                        onKeyDown={handleInlineEditKeyDown}
                        onBlur={handleInlineEditSave}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div
                        className={[
                          styles.taskName,
                          isGroup ? styles.taskNameGroup : '',
                          task.isMilestone ? styles.taskNameMilestone : '',
                        ].filter(Boolean).join(' ')}
                        title={task.title}
                        onDoubleClick={e => handleDoubleClickField(task.id, 'title', task.title, e)}
                      >
                        {task.title}
                      </div>
                    )}
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

                  {/* Start date */}
                  {isEditingStart ? (
                    <input
                      ref={inlineInputRef}
                      className={styles.inlineDateInput}
                      value={inlineEdit!.value}
                      onChange={handleInlineEditChange}
                      onKeyDown={handleInlineEditKeyDown}
                      onBlur={handleInlineEditSave}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className={styles.taskDate}
                      onDoubleClick={e => handleDoubleClickField(task.id, 'startDate', task.startDate, e)}
                    >
                      {shortDate(task.startDate)}
                    </div>
                  )}

                  {/* End date */}
                  {isEditingEnd ? (
                    <input
                      ref={inlineInputRef}
                      className={styles.inlineDateInput}
                      value={inlineEdit!.value}
                      onChange={handleInlineEditChange}
                      onKeyDown={handleInlineEditKeyDown}
                      onBlur={handleInlineEditSave}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className={styles.taskDate}
                      onDoubleClick={e => handleDoubleClickField(task.id, 'endDate', task.endDate, e)}
                    >
                      {shortDate(task.endDate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* -- Right: Timeline panel -- */}
        <div className={styles.timeline} ref={timelineRef} onScroll={handleTimelineScroll}>
          {/* -- Dual time header (sticky) -- */}
          <div className={styles.timelineHeader}>
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
                    className={`${styles.headerSecondaryCell}${isWk ? ` ${styles.headerSecondaryCellWeekend}` : ''}`}
                    style={{ width: h.width, minWidth: h.width }}
                  >
                    {h.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* -- Timeline body -- */}
          <div className={styles.timelineBody} style={{ width: totalWidth, height: totalHeight }}>
            {/* Grid background (CSS gradient) */}
            <div className={styles.gridBackground} style={gridBgStyle} />

            {/* Weekend shading */}
            {weekendCols.map((col, i) => (
              <div
                key={`wk-${i}`}
                className={styles.weekendColumn}
                style={{ left: col.x, width: col.width }}
              />
            ))}

            {/* Row backgrounds */}
            {tasks.map((task, i) => {
              const isSelected = selectedTaskId === task.id;
              const isAlt = i % 2 === 1;
              return (
                <div
                  key={`row-${task.id}`}
                  className={[
                    styles.timelineRow,
                    isAlt ? styles.timelineRowAlt : '',
                    isSelected ? styles.timelineRowSelected : '',
                  ].filter(Boolean).join(' ')}
                  style={{ top: i * ROW_HEIGHT }}
                  onClick={() => handleTaskClick(task.id)}
                  onContextMenu={e => handleContextMenu(task.id, e)}
                />
              );
            })}

            {/* Today marker */}
            {showToday && todayX !== null && (
              <>
                <div className={styles.todayLine} style={{ left: todayX }} />
                <div className={styles.todayChip} style={{ left: todayX }}>
                  Today
                </div>
              </>
            )}

            {/* Baseline bars */}
            {showBaseline && tasks.map(task => {
              if (!task.baselineStart || !task.baselineEnd) return null;
              if (task.isMilestone || task.isGroup) return null;
              const rect = taskRects.get(task.id);
              if (!rect) return null;
              const bsX = dateToX(new Date(task.baselineStart), chartStart, colWidth, scale);
              const beX = dateToX(new Date(task.baselineEnd), chartStart, colWidth, scale);
              const bW = Math.max(beX - bsX, 2);
              return (
                <div
                  key={`bl-${task.id}`}
                  className={styles.baselineBar}
                  style={{
                    left: bsX,
                    top: rect.y + BAR_HEIGHT + 2,
                    width: bW,
                  }}
                />
              );
            })}

            {/* Task bars */}
            {tasks.map(task => {
              const rect = taskRects.get(task.id);
              if (!rect) return null;
              const color = getTaskColor(task);
              const isSelected = selectedTaskId === task.id;
              const isDragging = dragMove?.taskId === task.id;
              const isResizing = dragResize?.taskId === task.id;

              // Milestone: rotated square div
              if (task.isMilestone) {
                const cx = rect.x - MILESTONE_SIZE / 2;
                const cy = rect.y + (BAR_HEIGHT - MILESTONE_SIZE) / 2;
                return (
                  <div
                    key={`ms-${task.id}`}
                    className={`${styles.milestone}${isSelected ? ` ${styles.milestoneSelected}` : ''}`}
                    style={{
                      left: cx,
                      top: cy,
                      backgroundColor: color,
                    }}
                    onClick={e => { e.stopPropagation(); handleTaskClick(task.id); }}
                    onMouseEnter={e => handleBarMouseEnter(task, e)}
                    onMouseMove={e => handleBarMouseMoveTooltip(task, e)}
                    onMouseLeave={handleBarMouseLeave}
                    onContextMenu={e => handleContextMenu(task.id, e)}
                  />
                );
              }

              // Group bar: thin bar with triangles
              if (task.isGroup) {
                const barTop = rect.y + (BAR_HEIGHT - GROUP_BAR_HEIGHT) / 2;
                return (
                  <div
                    key={`grp-${task.id}`}
                    className={styles.groupBar}
                    style={{
                      left: rect.x,
                      top: barTop,
                      width: rect.width,
                    }}
                    onClick={e => { e.stopPropagation(); handleTaskClick(task.id); }}
                    onMouseEnter={e => handleBarMouseEnter(task, e)}
                    onMouseMove={e => handleBarMouseMoveTooltip(task, e)}
                    onMouseLeave={handleBarMouseLeave}
                    onContextMenu={e => handleContextMenu(task.id, e)}
                  >
                    <div className={styles.groupBarFill} style={{ backgroundColor: color }} />
                    <div className={styles.groupBarTriLeft} style={{ color }} />
                    <div className={styles.groupBarTriRight} style={{ color }} />
                  </div>
                );
              }

              // Regular task bar
              return (
                <div
                  key={`bar-${task.id}`}
                  className={[
                    styles.taskBar,
                    isDragging || isResizing ? styles.taskBarDragging : '',
                    isSelected ? styles.taskBarSelected : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    backgroundColor: color,
                  }}
                  onClick={e => { e.stopPropagation(); handleTaskClick(task.id); }}
                  onMouseDown={e => handleBarMouseDown(task, e)}
                  onMouseEnter={e => handleBarMouseEnter(task, e)}
                  onMouseMove={e => handleBarMouseMoveTooltip(task, e)}
                  onMouseLeave={handleBarMouseLeave}
                  onContextMenu={e => handleContextMenu(task.id, e)}
                >
                  {/* Progress fill */}
                  {showProgress && task.progress > 0 && (
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(task.progress, 100)}%` }}
                    />
                  )}

                  {/* Bar label — only show if bar is wide enough for clean look */}
                  {rect.width > 60 && (
                    <span className={styles.barLabel}>{task.title}</span>
                  )}

                  {/* Left resize handle */}
                  <div
                    className={`${styles.resizeHandle} ${styles.resizeLeft}`}
                    onMouseDown={e => handleResizeStart(task, 'left', e)}
                  />

                  {/* Right resize handle */}
                  <div
                    className={`${styles.resizeHandle} ${styles.resizeRight}`}
                    onMouseDown={e => handleResizeStart(task, 'right', e)}
                  />
                </div>
              );
            })}

            {/* Dependency arrows (SVG overlay) */}
            {showDependencies && (
              <svg
                className={styles.dependencyLayer}
                width={totalWidth}
                height={totalHeight}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 7 4 L 0 7 Z" fill="var(--fc-node-desc, #999)" opacity="0.4" />
                  </marker>
                </defs>
                {tasks.flatMap(task =>
                  (task.dependencies ?? []).map(dep => {
                    const fromRect = taskRects.get(dep.taskId);
                    const toRect = taskRects.get(task.id);
                    if (!fromRect || !toRect) return null;
                    const pathD = getDependencyPath(fromRect, toRect, dep.type);
                    return (
                      <path
                        key={`dep-${dep.taskId}-${task.id}`}
                        d={pathD}
                        className={styles.dependencyPath}
                        markerEnd="url(#gantt-arrow)"
                      />
                    );
                  }),
                )}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* -- Tooltip -- */}
      {tooltip && !dragMove && !dragResize && (
        <div
          className={styles.tooltipOverlay}
          style={{ left: tooltip.x + 12, top: tooltip.y - 80 }}
        >
          <div className={styles.tooltip}>
            <div className={styles.tooltipHeader}>
              <div className={styles.tooltipColorDot} style={{ background: getTaskColor(tooltip.task) }} />
              <div className={styles.tooltipTitle}>{tooltip.task.title}</div>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Start</span>
              <span className={styles.tooltipValue}>{formatDate(new Date(tooltip.task.startDate))}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>End</span>
              <span className={styles.tooltipValue}>{formatDate(new Date(tooltip.task.endDate))}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Progress</span>
              <span className={styles.tooltipValue}>{tooltip.task.progress}%</span>
            </div>
            {tooltip.task.assignee && (
              <div className={styles.tooltipAssigneeRow}>
                <span className={styles.tooltipLabel}>Assignee</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    className={styles.tooltipAvatar}
                    style={{ background: getAvatarColor(tooltip.task.assignee) }}
                  >
                    {getInitials(tooltip.task.assignee)}
                  </div>
                  <span className={styles.tooltipValue}>{tooltip.task.assignee}</span>
                </div>
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

      {/* -- Context menu -- */}
      {contextMenu && (
        <>
          <div className={styles.contextMenuBackdrop} onClick={closeContextMenu} onContextMenu={e => { e.preventDefault(); closeContextMenu(); }} />
          <div className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button
              className={styles.contextMenuItem}
              onClick={() => { handleTaskClick(contextMenu.taskId); closeContextMenu(); }}
            >
              Edit
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => {
                const task = taskMap.get(contextMenu.taskId);
                if (task) {
                  setInlineEdit({ taskId: task.id, field: 'title', value: task.title });
                }
                closeContextMenu();
              }}
            >
              Rename
            </button>
            <div className={styles.contextMenuDivider} />
            <button
              className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
              onClick={() => { closeContextMenu(); }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
