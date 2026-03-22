import React, { useCallback, useState } from 'react';
import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/react';
import type { ProjectData, ProjectTask, TaskStatus } from './types';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  data: ProjectData;
  columns?: { id: TaskStatus; label: string }[];
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
}

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

  return (
    <div
      ref={ref}
      className={[
        styles.card,
        isSelected ? styles.cardSelected : '',
        isDragging ? styles.cardDragging : '',
      ].filter(Boolean).join(' ')}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {priorityColor && (
        <div className={styles.priorityStripe} style={{ background: priorityColor }} />
      )}
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{task.title}</span>
        {task.assignee && (
          <div
            className={styles.assigneeAvatar}
            style={{ background: getAvatarColor(task.assignee) }}
            title={task.assignee}
          >
            {getInitials(task.assignee)}
          </div>
        )}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.dueDate}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(task.endDate)}
        </span>
        {task.progress > 0 && (
          <span>{task.progress}%</span>
        )}
      </div>
      <div className={styles.progressMini}>
        <div
          className={styles.progressMiniBar}
          style={{
            width: `${task.progress}%`,
            background: task.priority === 'critical' ? '#ef4444'
              : task.priority === 'high' ? '#f59e0b'
              : '#3b82f6',
          }}
        />
      </div>
    </div>
  );
}

interface KanbanCardOverlayProps {
  task: ProjectTask;
}

function KanbanCardOverlay({ task }: KanbanCardOverlayProps) {
  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined;
  return (
    <div className={[styles.card, styles.dragOverlay].join(' ')}>
      {priorityColor && (
        <div className={styles.priorityStripe} style={{ background: priorityColor }} />
      )}
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{task.title}</span>
        {task.assignee && (
          <div
            className={styles.assigneeAvatar}
            style={{ background: getAvatarColor(task.assignee) }}
          >
            {getInitials(task.assignee)}
          </div>
        )}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.dueDate}>{formatDate(task.endDate)}</span>
        {task.progress > 0 && <span>{task.progress}%</span>}
      </div>
      <div className={styles.progressMini}>
        <div className={styles.progressMiniBar} style={{ width: `${task.progress}%` }} />
      </div>
    </div>
  );
}

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
