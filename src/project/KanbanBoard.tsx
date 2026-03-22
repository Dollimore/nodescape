import React, { useCallback, useState } from 'react';
import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/react';
import type { ProjectData, ProjectTask, TaskStatus } from './types';
import styles from './KanbanBoard.module.css';

/* ── Props ─────────────────────────────────────────────────── */

interface KanbanBoardProps {
  data: ProjectData;
  columns?: { id: TaskStatus; label: string }[];
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const DEFAULT_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'complete', label: 'Complete' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

const PROGRESS_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#94a3b8',
};

/* ── Helpers ───────────────────────────────────────────────── */

function getAvatarColor(name: string): string {
  const palette = [
    '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
    '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function isOverdue(dateStr: string): boolean {
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
}

/* ── Diamond icon for milestones ───────────────────────────── */

function DiamondIcon() {
  return (
    <svg
      className={styles.milestoneDiamond}
      viewBox="0 0 10 10"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="5" y="0" width="5" height="5" transform="rotate(45 5 5)" />
    </svg>
  );
}

/* ── Card ──────────────────────────────────────────────────── */

interface KanbanCardProps {
  task: ProjectTask;
  isSelected: boolean;
  onClick: () => void;
}

function KanbanCard({ task, isSelected, onClick }: KanbanCardProps) {
  const { ref, isDragging } = useDraggable({
    id: task.id,
    data: { taskId: task.id, currentStatus: task.status },
  });

  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined;
  const progressColor = PROGRESS_COLORS[task.priority ?? 'medium'];
  const overdue = task.endDate ? isOverdue(task.endDate) : false;
  const showProgress = !task.isGroup && task.progress > 0;

  const cardClasses = [
    styles.card,
    isSelected ? styles.cardSelected : '',
    isDragging ? styles.cardDragging : '',
    task.color ? styles.cardColorBorder : '',
  ].filter(Boolean).join(' ');

  const cardStyle: React.CSSProperties = task.color
    ? { borderTopColor: task.color }
    : {};

  return (
    <div
      ref={ref}
      className={cardClasses}
      style={cardStyle}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Title row */}
      <div className={styles.titleRow}>
        {task.isMilestone ? (
          <DiamondIcon />
        ) : priorityColor ? (
          <span className={styles.priorityDot} style={{ background: priorityColor }} />
        ) : null}
        <span className={`${styles.cardTitle}${task.isGroup ? ` ${styles.groupTitle}` : ''}`}>
          {task.title}
        </span>
        {task.isGroup && task.children && (
          <span className={styles.childrenBadge}>{task.children.length}</span>
        )}
      </div>

      {/* Description preview */}
      {task.description && !task.isGroup && (
        <div className={styles.cardDescription}>{task.description}</div>
      )}

      {/* Footer: assignee + due date */}
      {(task.assignee || task.endDate) && (
        <div className={styles.cardFooter}>
          {task.assignee ? (
            <div
              className={styles.assigneeAvatar}
              style={{ background: getAvatarColor(task.assignee) }}
              title={task.assignee}
            >
              {getInitials(task.assignee)}
            </div>
          ) : <span />}
          {task.endDate ? (
            <span className={`${styles.dueDate}${overdue ? ` ${styles.dueDateOverdue}` : ''}`}>
              {formatDate(task.endDate)}
            </span>
          ) : <span />}
        </div>
      )}

      {/* Progress bar */}
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${task.progress}%`, background: progressColor }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Card overlay (while dragging) ─────────────────────────── */

interface KanbanCardOverlayProps {
  task: ProjectTask;
}

function KanbanCardOverlay({ task }: KanbanCardOverlayProps) {
  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined;

  const cardStyle: React.CSSProperties = task.color
    ? { borderTopColor: task.color }
    : {};

  return (
    <div
      className={[styles.card, styles.dragOverlay, task.color ? styles.cardColorBorder : ''].filter(Boolean).join(' ')}
      style={cardStyle}
    >
      <div className={styles.titleRow}>
        {task.isMilestone ? (
          <DiamondIcon />
        ) : priorityColor ? (
          <span className={styles.priorityDot} style={{ background: priorityColor }} />
        ) : null}
        <span className={styles.cardTitle}>{task.title}</span>
      </div>
      {task.description && !task.isGroup && (
        <div className={styles.cardDescription}>{task.description}</div>
      )}
      {(task.assignee || task.endDate) && (
        <div className={styles.cardFooter}>
          {task.assignee ? (
            <div
              className={styles.assigneeAvatar}
              style={{ background: getAvatarColor(task.assignee) }}
            >
              {getInitials(task.assignee)}
            </div>
          ) : <span />}
          {task.endDate ? (
            <span className={styles.dueDate}>{formatDate(task.endDate)}</span>
          ) : <span />}
        </div>
      )}
    </div>
  );
}

/* ── Column ────────────────────────────────────────────────── */

interface KanbanColumnProps {
  columnId: TaskStatus;
  label: string;
  tasks: ProjectTask[];
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
}

function KanbanColumn({ columnId, label, tasks, selectedTaskId, onTaskClick }: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id: columnId,
    data: { status: columnId },
  });

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnLabel}>{label}</span>
        <span className={styles.countBadge}>{tasks.length}</span>
      </div>
      <div
        ref={ref}
        className={[styles.cardList, isDropTarget ? styles.cardListOver : ''].filter(Boolean).join(' ')}
      >
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>No tasks</div>
        ) : (
          tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onClick={() => onTaskClick?.(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Board ─────────────────────────────────────────────────── */

export function KanbanBoard({
  data,
  columns = DEFAULT_COLUMNS,
  selectedTaskId,
  onTaskClick,
  onTaskStatusChange,
  className,
}: KanbanBoardProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const tasksByStatus = useCallback((status: TaskStatus) =>
    data.tasks.filter(t => !t.isGroup && t.status === status),
    [data.tasks]
  );

  const draggingTask = draggingTaskId
    ? data.tasks.find(t => t.id === draggingTaskId) ?? null
    : null;

  const handleDragStart = useCallback((event: any) => {
    const sourceId = event?.operation?.source?.id;
    if (sourceId != null) setDraggingTaskId(String(sourceId));
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    setDraggingTaskId(null);
    const operation = event?.operation;
    if (!operation || operation.canceled) return;

    const sourceId = operation.source?.id;
    const targetId = operation.target?.id;

    if (sourceId == null || targetId == null) return;

    const newStatus = String(targetId) as TaskStatus;
    const task = data.tasks.find(t => t.id === String(sourceId));
    if (!task) return;
    if (task.status === newStatus) return;

    onTaskStatusChange?.(String(sourceId), newStatus);
  }, [data.tasks, onTaskStatusChange]);

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={[styles.board, className].filter(Boolean).join(' ')}>
        {columns.map(col => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            tasks={tasksByStatus(col.id)}
            selectedTaskId={selectedTaskId}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {draggingTask ? <KanbanCardOverlay task={draggingTask} /> : null}
      </DragOverlay>
    </DragDropProvider>
  );
}
