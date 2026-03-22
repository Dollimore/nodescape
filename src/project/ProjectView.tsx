import React, { lazy, Suspense, useMemo, useState } from 'react';
import type { FlowCanvasProps, FlowDiagram } from '../types';
import type { ProjectData, TaskStatus } from './types';
import { KanbanBoard } from './KanbanBoard';
import { applyProjectStatus } from './projectUtils';
import styles from './ProjectView.module.css';

// Lazy-load GanttChart — may not exist yet during development
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — GanttChart module created by sibling agent
const GanttChart = lazy(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import('./GanttChart') as Promise<any>).then((m: any) => ({ default: m.GanttChart })).catch(() => ({
    default: function GanttPlaceholder() { return <div className={styles.placeholder}>Gantt view coming soon</div>; },
  }))
);

// Lazy-load FlowCanvas to avoid circular dependency in library context
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const FlowCanvas = lazy(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import('../FlowCanvas') as Promise<any>).then((m: any) => ({ default: m.FlowCanvas })).catch(() => ({
    default: function DiagramPlaceholder() { return <div className={styles.placeholder}>Diagram view unavailable</div>; },
  }))
);

interface ProjectViewProps {
  project: ProjectData;
  diagram?: FlowDiagram;
  activeView?: 'kanban' | 'gantt' | 'diagram';
  onViewChange?: (view: 'kanban' | 'gantt' | 'diagram') => void;
  onTaskClick?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  selectedTaskId?: string | null;
  /** Pass-through props to FlowCanvas */
  diagramProps?: Partial<FlowCanvasProps>;
  className?: string;
}

const VIEW_TABS: { id: 'kanban' | 'gantt' | 'diagram'; label: string; icon: React.ReactNode }[] = [
  {
    id: 'kanban',
    label: 'Kanban',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="3" width="5" height="18" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
  },
  {
    id: 'gantt',
    label: 'Gantt',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="15" y2="12" />
        <line x1="3" y1="18" x2="18" y2="18" />
        <circle cx="21" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="18" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'diagram',
    label: 'Diagram',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="3" width="6" height="6" rx="1" />
        <rect x="9" y="15" width="6" height="6" rx="1" />
        <line x1="9" y1="6" x2="15" y2="6" />
        <line x1="12" y1="6" x2="12" y2="15" />
      </svg>
    ),
  },
];

export function ProjectView({
  project,
  diagram,
  activeView: controlledView,
  onViewChange,
  onTaskClick,
  onTaskStatusChange,
  selectedTaskId,
  diagramProps,
  className,
}: ProjectViewProps) {
  const [internalView, setInternalView] = useState<'kanban' | 'gantt' | 'diagram'>('kanban');
  const activeView = controlledView ?? internalView;

  const handleViewChange = (view: 'kanban' | 'gantt' | 'diagram') => {
    setInternalView(view);
    onViewChange?.(view);
  };

  const coloredDiagram = useMemo(() => {
    if (!diagram) return undefined;
    return applyProjectStatus(diagram, project);
  }, [diagram, project]);

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={styles.toolbar}>
        {project.title && <span className={styles.title}>{project.title}</span>}
        <div className={styles.tabGroup}>
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              className={[styles.tab, activeView === tab.id ? styles.tabActive : ''].filter(Boolean).join(' ')}
              onClick={() => handleViewChange(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {activeView === 'kanban' && (
          <div className={styles.viewPane}>
            <KanbanBoard
              data={project}
              selectedTaskId={selectedTaskId}
              onTaskClick={onTaskClick}
              onTaskStatusChange={onTaskStatusChange}
            />
          </div>
        )}

        {activeView === 'gantt' && (
          <div className={styles.viewPane}>
            <Suspense fallback={<div className={styles.placeholder}>Loading...</div>}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {React.createElement(GanttChart as any, {
                data: project,
                selectedTaskId,
                onTaskClick,
              })}
            </Suspense>
          </div>
        )}

        {activeView === 'diagram' && (
          <div className={styles.viewPane}>
            {coloredDiagram ? (
              <Suspense fallback={<div className={styles.placeholder}>Loading...</div>}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {React.createElement(FlowCanvas as any, {
                  diagram: coloredDiagram,
                  onNodeClick: onTaskClick,
                  ...diagramProps,
                })}
              </Suspense>
            ) : (
              <div className={styles.placeholder}>No diagram provided</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
